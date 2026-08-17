<#
    Simular-Ambiente.ps1

    Gera dados FICTÍCIOS localmente — public/data/printers.json e
    public/data/monthly-report.json — para testar o painel inteiro em casa,
    sem precisar de acesso à rede da Elgin nem às impressoras reais.

    PARA QUE SERVE
    ---------------
    Coletar-Impressoras.ps1 precisa de acesso RPC aos servidores de
    impressão (elgjunprt/elgmcprt/elgvloprt) e UDP/161 (SNMP) até cada
    impressora — só funciona de dentro da rede da empresa (ou VPN). Fora
    dela — trabalhando de casa, por exemplo — esses dois arquivos
    simplesmente não existem, e o painel cai no modo demo (dados fixos de
    src/data/printers.ts, sempre os mesmos).

    Este script cria os DOIS arquivos que o painel espera (public/data/
    printers.json e public/data/monthly-report.json), no MESMO formato
    exato que os coletores reais produzem (mesmos campos, mesmos tipos —
    ver src/types.ts), só que com dados sorteados localmente. Nenhuma
    chamada de rede é feita. Dá pra testar igualzinho ao ambiente real:
    filtros, ordenação, alertas de toner baixo/crítico, impressoras
    offline, a área "Suprimentos", o Histórico mensal, exportar CSV — tudo
    reagindo a dados que "parecem" reais, só que sorteados.

    IMPORTANTE: os nomes das impressoras simuladas começam com "SIM_" e os
    departamentos com "TESTE -" de propósito, pra nunca ficar em dúvida se
    o que está na tela é dado real da empresa ou simulação local. Os IPs
    usam o terceiro octeto fixo 10.99.x.x (fora da faixa real usada pela
    Elgin) pelo mesmo motivo.

    USO
    ----
        pwsh .\scripts\Simular-Ambiente.ps1
        pwsh .\scripts\Simular-Ambiente.ps1 -PrinterCount 60
        pwsh .\scripts\Simular-Ambiente.ps1 -Seed 42          # sorteio reprodutível
        pwsh .\scripts\Simular-Ambiente.ps1 -SoPrinters       # só printers.json, sem histórico mensal

    Depois é só rodar `npm run dev` (ou abrir o build) — o rodapé do
    painel muda de "Modo demonstração" para "Conectado ao servidor" /
    "Relatório mensal real" usando esses dados simulados. Rode de novo a
    qualquer momento pra sortear um cenário diferente (mais offline, mais
    toner crítico, etc.).

    LIMPEZA
    --------
    Pra voltar ao modo demo padrão, apague os dois arquivos gerados:
        Remove-Item public\data\printers.json, public\data\monthly-report.json
#>

param(
    [int]$PrinterCount = 40,
    [string]$PrintersOutFile = (Join-Path $PSScriptRoot "..\public\data\printers.json"),
    [string]$MonthlyOutFile  = (Join-Path $PSScriptRoot "..\public\data\monthly-report.json"),
    [int]$Seed = 0,
    [switch]$SoPrinters,
    [switch]$Silencioso
)

function Write-Log {
    param([string]$Message, [ValidateSet("Info", "Warning", "Error", "Success")] [string]$Level = "Info")
    if ($Silencioso) { return }
    $color = switch ($Level) { "Info" { "Gray" } "Warning" { "Yellow" } "Error" { "Red" } "Success" { "Green" } }
    Write-Host "[$($Level.ToUpper())] $Message" -ForegroundColor $color
}

$rnd = if ($Seed -ne 0) { [System.Random]::new($Seed) } else { [System.Random]::new() }
function Rand-Int([int]$min, [int]$max) { $rnd.Next($min, $max + 1) }
function Rand-Pick($lista) { $lista[$rnd.Next(0, $lista.Count)] }
function Rand-Bool([double]$chance) { $rnd.NextDouble() -lt $chance }

# ─────────────────────────────────────────────────────────────────────────────
#  Dados de referência para o sorteio (nada disso sai pela rede)
# ─────────────────────────────────────────────────────────────────────────────
$departamentos = @(
    "TESTE - Administração", "TESTE - Logística", "TESTE - TI",
    "TESTE - Financeiro", "TESTE - RH", "TESTE - Diretoria",
    "TESTE - Automação", "TESTE - Qualidade", "TESTE - Recepção"
)
$modelosMono  = @("Kyocera M2035", "Kyocera FS-4020", "Kyocera M3040", "Kyocera P2135")
$modelosColor = @("Ricoh MC251fw", "SP_BM5100ADW", "Ricoh SP_C250DN")
$modelosLabel = @("Elgin TT042", "Zebra GK420t", "Honeywell PC42t")
$corSigla     = [ordered]@{ Preto = "K"; Ciano = "C"; Magenta = "M"; Amarelo = "Y" }

Write-Log "Gerando ambiente simulado ($PrinterCount impressoras fictícias, sem acesso à rede)..." -Level Success

# ─────────────────────────────────────────────────────────────────────────────
#  printers.json — mesmo formato de ConvertTo-PainelJson em Coletar-Impressoras.ps1
# ─────────────────────────────────────────────────────────────────────────────
$impressoras = @()
for ($i = 1; $i -le $PrinterCount; $i++) {
    $dept = Rand-Pick $departamentos
    $deptSlug = ($dept -replace "TESTE - ", "") -replace "\s", ""
    $ehLabel = Rand-Bool 0.12
    $ehColor = (-not $ehLabel) -and (Rand-Bool 0.28)
    $model = if ($ehLabel) { Rand-Pick $modelosLabel } elseif ($ehColor) { Rand-Pick $modelosColor } else { Rand-Pick $modelosMono }

    $offline = Rand-Bool 0.18
    $ip = "10.99.$(Rand-Int 1 40).$(Rand-Int 2 250)"

    $tonerList = $null
    $piorPct = 100
    if (-not $ehLabel -and -not $offline) {
        $canais = if ($ehColor) { $corSigla.Keys } else { @("Preto") }
        $tonerList = @(
            foreach ($cor in $canais) {
                # ~22% de chance de qualquer canal vir baixo, pra gerar alertas de teste
                $pct = if (Rand-Bool 0.22) { Rand-Int 2 20 } else { Rand-Int 21 98 }
                if ($pct -lt $piorPct) { $piorPct = $pct }
                [ordered]@{ color = $corSigla[$cor]; label = "$cor ($($corSigla[$cor]))"; percent = $pct }
            }
        )
    }

    $status = if ($offline) { "offline" } elseif (-not $ehLabel -and $piorPct -le 20) { "atencao" } else { "online" }

    $impressoras += [ordered]@{
        id           = "$i"
        name         = "SIM_${deptSlug}_$i"
        ip           = $ip
        model        = $model
        department   = $dept
        status       = $status
        toner        = $tonerList
        pagesPrinted = Rand-Int 300 60000
        lastSeen     = if ($status -eq "offline") { "há $(Rand-Int 1 12) dias" } else { "agora" }
    }
}

$outDir = Split-Path -Parent $PrintersOutFile
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
(ConvertTo-Json -InputObject $impressoras -Depth 6) | Set-Content -Path $PrintersOutFile -Encoding UTF8
Write-Log "Gravado: $PrintersOutFile ($($impressoras.Count) impressoras)" -Level Success

if ($SoPrinters) {
    Write-Log "Rode 'npm run dev' — o painel já deve mostrar 'Conectado ao servidor' com esses dados." -Level Info
    return
}

# ─────────────────────────────────────────────────────────────────────────────
#  monthly-report.json — mesmo formato de Relatorio-Mensal.ps1
#  (aqui não há diff de contador real: os valores mensais são sorteados
#  direto, só pra popular Contadores Mensais / Histórico / ranking)
# ─────────────────────────────────────────────────────────────────────────────
$culturaPt = [System.Globalization.CultureInfo]::new("pt-BR")
$meses = for ($m = 5; $m -ge 0; $m--) { (Get-Date).AddMonths(-$m) }
$monthlyPorImpressora = @{}
$agregadoPorMes = [ordered]@{}

foreach ($imp in $impressoras) {
    $ehLabel = $modelosLabel -contains $imp.model
    if ($ehLabel) { continue }  # etiqueta não tem contador SNMP — fica de fora, igual ao coletor real

    $historico = @()
    foreach ($dataMes in $meses) {
        $label = $culturaPt.TextInfo.ToTitleCase($dataMes.ToString("MMM", $culturaPt)).TrimEnd(".")
        $inicio = Get-Date -Year $dataMes.Year -Month $dataMes.Month -Day 1
        $fim = $inicio.AddMonths(1).AddDays(-1)
        $periodo = "$($inicio.ToString('dd/MM'))–$($fim.ToString('dd/MM'))"
        $paginas = if (Rand-Bool 0.08) { 0 } else { Rand-Int 200 9000 }

        $historico += [ordered]@{ month = $label; pages = $paginas; period = $periodo }
        if (-not $agregadoPorMes.Contains($label)) { $agregadoPorMes[$label] = [ordered]@{ pages = 0; period = $periodo } }
        $agregadoPorMes[$label].pages += $paginas
    }

    $monthlyPorImpressora[$imp.ip] = [ordered]@{
        ip           = $imp.ip
        name         = $imp.name
        department   = $imp.department
        monthlyPages = $historico
    }
}

$monthlyUsage = foreach ($label in $agregadoPorMes.Keys) {
    [ordered]@{ month = $label; pages = $agregadoPorMes[$label].pages; period = $agregadoPorMes[$label].period }
}

$relatorio = [ordered]@{
    generatedAt  = (Get-Date).ToUniversalTime().ToString("o")
    monthlyUsage = @($monthlyUsage)
    printers     = @($monthlyPorImpressora.Values)
}

($relatorio | ConvertTo-Json -Depth 8) | Set-Content -Path $MonthlyOutFile -Encoding UTF8
Write-Log "Gravado: $MonthlyOutFile ($($monthlyPorImpressora.Count) impressoras com histórico de 6 meses)" -Level Success
Write-Log "Pronto. Rode 'npm run dev' — o rodapé do painel deve mostrar 'Conectado ao servidor' e 'Relatório mensal real'." -Level Info
