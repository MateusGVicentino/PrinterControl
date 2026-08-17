<#
    Relatorio-Mensal.ps1

    PROBLEMA QUE ESTE SCRIPT RESOLVE
    ---------------------------------
    O SNMP (Printer-MIB, OID prtMarkerLifeCount = 1.3.6.1.2.1.43.10.2.1.4.1.1)
    só expõe um contador CUMULATIVO de páginas — o total impresso desde que a
    impressora saiu de fábrica. Não existe OID de "páginas este mês": isso é
    sempre calculado por fora, tirando duas leituras do contador em datas
    diferentes e subtraindo uma da outra. É exatamente assim que a planilha
    "Levantamento_impressões" foi montada (colunas Jan..Dez = diferença entre
    a leitura do dia ~2/4 de um mês e a leitura do dia ~2/4 do mês seguinte).

    O QUE ESTE SCRIPT FAZ
    ----------------------
    1. Lê o `printers.json` mais recente gerado por Coletar-Impressoras.ps1
       (contador cumulativo atual de cada impressora).
    2. Compara com a última leitura salva em um arquivo de histórico local
       (`HistoryFile`, não é servido pelo site — é só estado interno).
    3. A diferença (atual - anterior) é a quantidade de páginas impressas
       NESSE período — o mesmo cálculo da planilha.
    4. Grava esse valor no relatório mensal (`OutFile`,
       public/data/monthly-report.json), no formato que o painel web já sabe
       ler (MonthlyPageCount[] por impressora + MonthlyUsageEntry[] agregado
       — ver src/types.ts e src/lib/fetchMonthlyReport.ts).
    5. Atualiza o histórico com a leitura atual, para servir de base no
       próximo mês.

    PRÉ-REQUISITO IMPORTANTE
    -------------------------
    Rode Coletar-Impressoras.ps1 (ou deixe a tarefa agendada dele já ter
    rodado) ANTES deste script, para garantir que o `printers.json` de
    entrada tem o contador SNMP atualizado. Este script não consulta SNMP
    diretamente — ele só faz a matemática em cima do que o outro coletou.

    LIMITAÇÕES / PONTOS DE ATENÇÃO
    --------------------------------
    - Precisa rodar numa cadência regular (Task Scheduler, mensal — sugestão:
      todo dia 4, mesmo padrão da planilha). Se pular um mês, a diferença
      simplesmente vira maior no mês seguinte (o total continua correto, só
      não fica dividido igual à planilha).
    - Se o contador de uma impressora DIMINUIR entre duas leituras (placa
      trocada, firmware resetado, impressora substituída), a diferença seria
      negativa — o script detecta isso, NÃO grava um valor negativo, marca o
      evento no log como "reset de contador" e recomeça a contagem a partir
      da leitura atual.
    - Impressora nova (sem leitura anterior no histórico): primeiro run só
      grava a base, ainda não gera um "mês" no relatório — o primeiro valor
      real aparece a partir da segunda execução.
    - Impressoras "Etiqueta" (Elgin TT042/Honeywell) não têm contador SNMP
      (ver Coletar-Impressoras.ps1) — ficam de fora do relatório mensal.

    USO
    ----
        .\Relatorio-Mensal.ps1
        .\Relatorio-Mensal.ps1 -InFile "C:\inetpub\wwwroot\data\printers.json" `
                                -OutFile "C:\inetpub\wwwroot\data\monthly-report.json" `
                                -HistoryFile "C:\ProgramData\ElginImpressoras\counter-history.json"

    Agendamento sugerido (Task Scheduler): mensal, todo dia 4 às 08:00, logo
    depois da execução diária/periódica de Coletar-Impressoras.ps1.
#>

param(
    [string]$InFile      = (Join-Path $PSScriptRoot "..\public\data\printers.json"),
    [string]$OutFile     = (Join-Path $PSScriptRoot "..\public\data\monthly-report.json"),
    [string]$HistoryFile = (Join-Path $PSScriptRoot "data\counter-history.json"),
    [int]$MesesParaManter = 12,
    [switch]$Silencioso
)

function Write-Log {
    param([string]$Message, [ValidateSet("Info", "Warning", "Error", "Success")] [string]$Level = "Info")
    if ($Silencioso) { return }
    $color = switch ($Level) { "Info" { "Gray" } "Warning" { "Yellow" } "Error" { "Red" } "Success" { "Green" } }
    Write-Host "[$($Level.ToUpper())] $Message" -ForegroundColor $color
}

# Meses abreviados em pt-BR no mesmo formato usado pelo painel web
# (src/data/printers.ts / src/types.ts espera exatamente "Jan","Fev",...).
$MESES_PT = @("Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez")

# Chave estável para casar a mesma impressora entre execuções. IP é o campo
# mais estável no parque (mesmo IP = mesma porta/impressora física na
# prática); nome entra como desempate para o raro caso de IP duplicado/DHCP.
function Get-ChaveImpressora {
    param($Impressora)
    return "$($Impressora.ip)|$($Impressora.name)"
}

# ─────────────────────────────────────────────────────────────────────────────
#  Carrega entrada (contador atual) e histórico (contador da última execução)
# ─────────────────────────────────────────────────────────────────────────────
if (-not (Test-Path $InFile)) {
    Write-Log "Arquivo de entrada '$InFile' não encontrado. Rode Coletar-Impressoras.ps1 primeiro." -Level Error
    exit 1
}
# @() força array mesmo quando o JSON de entrada tem só 1 impressora
# (ConvertFrom-Json devolve um objeto solto nesse caso, não um array de 1).
$impressorasAtuais = @(Get-Content -LiteralPath $InFile -Raw | ConvertFrom-Json)

$historyDir = Split-Path -Parent $HistoryFile
if (-not (Test-Path $historyDir)) { New-Item -ItemType Directory -Path $historyDir -Force | Out-Null }

$historico = @{}
if (Test-Path $HistoryFile) {
    try {
        $raw = Get-Content -LiteralPath $HistoryFile -Raw | ConvertFrom-Json
        foreach ($prop in $raw.PSObject.Properties) { $historico[$prop.Name] = $prop.Value }
    } catch {
        Write-Log "Histórico existente em '$HistoryFile' está corrompido — começando do zero." -Level Warning
    }
}

$agora = Get-Date
$mesAtual = $MESES_PT[$agora.Month - 1]

# ─────────────────────────────────────────────────────────────────────────────
#  Calcula a diferença (páginas neste período) para cada impressora
# ─────────────────────────────────────────────────────────────────────────────
$relatorioPorImpressora = @()
$totalPaginasMes = 0
$novasBaselines = 0
$resetsDetectados = 0

foreach ($imp in $impressorasAtuais) {
    # TT042/Honeywell (etiqueta) não reportam contador de páginas via SNMP.
    if ($null -eq $imp.pagesPrinted) { continue }

    $chave = Get-ChaveImpressora $imp
    $contadorAtual = [int64]$imp.pagesPrinted

    $entradaAnterior = $historico[$chave]
    $mensal = @()

    # Reaproveita o histórico mensal já calculado em execuções passadas,
    # descartando entradas além da janela de retenção (MesesParaManter).
    if ($null -ne $entradaAnterior -and $entradaAnterior.monthlyPages) {
        $mensal = @($entradaAnterior.monthlyPages)
    }

    if ($null -eq $entradaAnterior) {
        Write-Log "  $($imp.name) [$($imp.ip)]: primeira leitura, registrando base (contador=$contadorAtual)." -Level Info
        $novasBaselines++
    } else {
        $contadorAnterior = [int64]$entradaAnterior.pageCount
        $delta = $contadorAtual - $contadorAnterior

        if ($delta -lt 0) {
            Write-Log "  $($imp.name) [$($imp.ip)]: contador caiu ($contadorAnterior -> $contadorAtual) — provável troca/reset. Reiniciando base, sem gerar página este mês." -Level Warning
            $resetsDetectados++
        } else {
            $periodoInicio = [DateTime]$entradaAnterior.dataUtc
            $periodo = "$($periodoInicio.ToString('dd/MM')) – $($agora.ToString('dd/MM'))"

            # Se já existe uma entrada para o mês atual (rodou 2x no mesmo
            # mês), soma ao invés de duplicar — mantém 1 registro por mês.
            $existente = $mensal | Where-Object { $_.month -eq $mesAtual } | Select-Object -First 1
            if ($existente) {
                $existente.pages += $delta
                $existente.period = $periodo
            } else {
                $mensal += [ordered]@{ month = $mesAtual; pages = [int]$delta; period = $periodo }
                if ($mensal.Count -gt $MesesParaManter) {
                    $mensal = $mensal[($mensal.Count - $MesesParaManter)..($mensal.Count - 1)]
                }
            }
            $totalPaginasMes += $delta
            Write-Log "  $($imp.name) [$($imp.ip)]: +$delta páginas ($periodo)." -Level Success
        }
    }

    $historico[$chave] = [ordered]@{
        ip          = $imp.ip
        name        = $imp.name
        pageCount   = $contadorAtual
        dataUtc     = $agora.ToUniversalTime().ToString("o")
        monthlyPages = $mensal
    }

    $relatorioPorImpressora += [ordered]@{
        ip           = $imp.ip
        name         = $imp.name
        department   = $imp.department
        monthlyPages = $mensal
    }
}

# ─────────────────────────────────────────────────────────────────────────────
#  Agregado mensal (soma de todas as impressoras) — mesmo formato da tabela
#  "Mês / Período / Impressões" no topo da planilha original.
# ─────────────────────────────────────────────────────────────────────────────
$agregadoPorMes = @{}
foreach ($imp in $relatorioPorImpressora) {
    foreach ($m in $imp.monthlyPages) {
        if (-not $agregadoPorMes.ContainsKey($m.month)) {
            $agregadoPorMes[$m.month] = [ordered]@{ month = $m.month; pages = 0; period = $m.period }
        }
        $agregadoPorMes[$m.month].pages += $m.pages
        $agregadoPorMes[$m.month].period = $m.period
    }
}
# Ordena os meses na ordem cronológica em que apareceram no calendário pt-BR.
$monthlyUsage = $MESES_PT | Where-Object { $agregadoPorMes.ContainsKey($_) } | ForEach-Object { $agregadoPorMes[$_] }

# ─────────────────────────────────────────────────────────────────────────────
#  Grava histórico (estado interno) e relatório (consumido pelo painel web)
# ─────────────────────────────────────────────────────────────────────────────
$historico | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $HistoryFile -Encoding UTF8

$relatorio = [ordered]@{
    generatedAt  = $agora.ToUniversalTime().ToString("o")
    monthlyUsage = $monthlyUsage
    printers     = $relatorioPorImpressora
}
$outDir = Split-Path -Parent $OutFile
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
$relatorio | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutFile -Encoding UTF8

Write-Log "OK: relatório mensal gravado em '$OutFile'." -Level Success
Write-Log "Resumo: $totalPaginasMes página(s) somadas em '$mesAtual', $novasBaselines impressora(s) nova(s), $resetsDetectados reset(s) de contador detectado(s)." -Level Info
