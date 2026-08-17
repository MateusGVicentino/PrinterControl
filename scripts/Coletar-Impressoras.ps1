<#
    Coletar-Impressoras.ps1

    Coleta status, toner e paginas impressas das impressoras publicadas
    nos servidores de impressao da Elgin (elgjunprt, elgmcprt, elgvloprt)
    e grava o resultado em JSON no formato consumido pelo painel web
    (public/data/printers.json).

    Portado das funcoes reais de coleta do NOC Impressoras (Main.ps1):
    Get-ImpressorasEmpresa, Process-ImpressorasList, Get-TonerSNMP,
    Obter-Modelo, Obter-TipoImpressora. Todo o WPF/XAML (janela, popups,
    filtros, toast) foi removido — este script e so a coleta, sem UI.

    Requisitos: rodar em uma maquina com acesso RPC aos servidores de
    impressao (modulo PrintManagement) e acesso UDP/161 (SNMP) as
    impressoras. Agende via Task Scheduler no mesmo intervalo do
    TempoRefreshMinutos abaixo.

    Uso:
        .\Coletar-Impressoras.ps1
        .\Coletar-Impressoras.ps1 -OutFile "C:\inetpub\wwwroot\data\printers.json"
        .\Coletar-Impressoras.ps1 -Servidores elgjunprt,elgmcprt -SnmpCommunity public
#>

param(
    [string[]]$Servidores = @("elgjunprt", "elgmcprt", "elgvloprt"),
    [string]$SnmpCommunity = "public",
    [string]$OutFile = (Join-Path $PSScriptRoot "..\public\data\printers.json"),
    [switch]$Silencioso
)

function Write-Log {
    param([string]$Message, [ValidateSet("Info", "Warning", "Error", "Success")] [string]$Level = "Info")
    if ($Silencioso) { return }
    $color = switch ($Level) { "Info" { "Gray" } "Warning" { "Yellow" } "Error" { "Red" } "Success" { "Green" } }
    Write-Host "[$($Level.ToUpper())] $Message" -ForegroundColor $color
}

# ─────────────────────────────────────────────────────────────────────────────
#  SNMP — consulta toner, uptime e contador de paginas (Printer-MIB padrao)
# ─────────────────────────────────────────────────────────────────────────────
function Get-TonerSNMP {
    param([string]$IP, [int]$Qtd = 1, [string]$Community = "public")
    Write-Log "Consultando SNMP em $IP (esperando $Qtd toner/s)..." -Level Info

    try {
        $udp = New-Object System.Net.Sockets.UdpClient
        $udp.Client.ReceiveTimeout = 1500
        $udp.Connect($IP, 161)

        function Build-SnmpGetBulk {
            param([string[]]$Oids, [int]$MaxRepetitions = 15)
            function ToOidBytes([string]$oid) {
                $parts = $oid.Split('.') | ForEach-Object { [int]$_ }
                $bytes = @(0x2b)
                for ($i = 2; $i -lt $parts.Count; $i++) {
                    $val = $parts[$i]
                    if ($val -lt 128) { $bytes += [byte]$val }
                    else {
                        $buf = @(); $buf += [byte]($val -band 0x7F); $val = $val -shr 7
                        while ($val -gt 0) { $buf = @([byte](($val -band 0x7F) -bor 0x80)) + $buf; $val = $val -shr 7 }
                        $bytes += $buf
                    }
                }
                return $bytes
            }
            $varbinds = @()
            foreach ($oid in $Oids) {
                $oidBytes = ToOidBytes $oid
                $oidTlv   = @(0x06, $oidBytes.Count) + $oidBytes
                $nullTlv  = @(0x05, 0x00)
                $varbinds += @(0x30, ($oidTlv.Count + $nullTlv.Count)) + $oidTlv + $nullTlv
            }
            $varbindListTlv = @(0x30, $varbinds.Count) + $varbinds
            $community = [System.Text.Encoding]::ASCII.GetBytes($Community)
            $commTlv   = @(0x04, $community.Count) + $community
            $reqId     = @(0x02, 0x04, 0x00, 0x00, 0x00, 0x02)
            $nonRep    = @(0x02, 0x01, 0x00)
            $maxRep    = @(0x02, 0x01, [byte]$MaxRepetitions)
            $pdu       = @(0xa5) + @(0x00) + $reqId + $nonRep + $maxRep + $varbindListTlv
            $pdu[1]    = $pdu.Count - 2
            $version   = @(0x02, 0x01, 0x01)
            $seq       = @(0x30) + @(0x00) + $version + $commTlv + $pdu
            $seq[1]    = $seq.Count - 2
            return [byte[]]$seq
        }
        function Build-SnmpGet {
            param([string]$oid)
            $oidParts = $oid.Split('.') | ForEach-Object { [int]$_ }
            $oidBytes = @(0x2b)
            for ($i = 2; $i -lt $oidParts.Count; $i++) {
                $val = $oidParts[$i]
                if ($val -lt 128) { $oidBytes += [byte]$val }
                else {
                    $buf = @(); $buf += [byte]($val -band 0x7F); $val = $val -shr 7
                    while ($val -gt 0) { $buf = @([byte](($val -band 0x7F) -bor 0x80)) + $buf; $val = $val -shr 7 }
                    $oidBytes += $buf
                }
            }
            $oidTlv   = @(0x06, $oidBytes.Count) + $oidBytes
            $nullTlv  = @(0x05, 0x00)
            $varBind  = @(0x30, ($oidTlv.Count + $nullTlv.Count)) + $oidTlv + $nullTlv
            $varBinds = @(0x30, $varBind.Count) + $varBind
            $community = [System.Text.Encoding]::ASCII.GetBytes($Community)
            $commTlv  = @(0x04, $community.Count) + $community
            $reqId    = @(0x02, 0x04, 0x00, 0x00, 0x00, 0x01)
            $errStat  = @(0x02, 0x01, 0x00)
            $errIdx   = @(0x02, 0x01, 0x00)
            $pdu      = @(0xa0) + @(0x00) + $reqId + $errStat + $errIdx + $varBinds
            $pdu[1]   = $pdu.Count - 2
            $version  = @(0x02, 0x01, 0x00)
            $seq      = @(0x30) + @(0x00) + $version + $commTlv + $pdu
            $seq[1]   = $seq.Count - 2
            return [byte[]]$seq
        }
        function Read-BerTlv {
            param([byte[]]$data, [int]$pos)
            $tag = $data[$pos]; $pos++
            $len = $data[$pos]; $pos++
            if ($len -band 0x80) {
                $n = $len -band 0x7F; $len = 0
                for ($i = 0; $i -lt $n; $i++) { $len = ($len -shl 8) -bor $data[$pos]; $pos++ }
            }
            return @{ Tag = $tag; Len = $len; ValStart = $pos; NextPos = ($pos + $len) }
        }
        function Read-BerOid {
            param([byte[]]$data, [int]$pos, [int]$len)
            $end = $pos + $len
            $first = $data[$pos]; $pos++
            $oid = "$([math]::Floor($first/40)).$($first%40)"
            while ($pos -lt $end) {
                $val = 0
                while ($true) {
                    $b = $data[$pos]; $pos++
                    $val = ($val -shl 7) -bor ($b -band 0x7F)
                    if (-not ($b -band 0x80)) { break }
                }
                $oid += ".$val"
            }
            return $oid
        }
        function Convert-SnmpValueBytes {
            param([byte[]]$b)
            if ($null -eq $b -or $b.Count -eq 0) { return 0 }
            $val = 0; foreach ($x in $b) { $val = ($val -shl 8) -bor $x }
            return $val
        }
        function Parse-SnmpBulkResponse {
            param([byte[]]$data)
            $results = New-Object System.Collections.Generic.List[object]
            try {
                $outer = Read-BerTlv $data 0
                $pos = $outer.ValStart
                $verTlv = Read-BerTlv $data $pos; $pos = $verTlv.NextPos
                $commTlv = Read-BerTlv $data $pos; $pos = $commTlv.NextPos
                $pduTlv = Read-BerTlv $data $pos
                $pos = $pduTlv.ValStart
                $reqIdTlv = Read-BerTlv $data $pos; $pos = $reqIdTlv.NextPos
                $errStatTlv = Read-BerTlv $data $pos; $pos = $errStatTlv.NextPos
                $errIdxTlv = Read-BerTlv $data $pos; $pos = $errIdxTlv.NextPos
                $vbListTlv = Read-BerTlv $data $pos
                $vbPos = $vbListTlv.ValStart
                $vbEnd = $vbListTlv.NextPos
                while ($vbPos -lt $vbEnd) {
                    $vbTlv = Read-BerTlv $data $vbPos
                    $inner = $vbTlv.ValStart
                    $oidTlv = Read-BerTlv $data $inner
                    $oidStr = Read-BerOid $data $oidTlv.ValStart $oidTlv.Len
                    $valTlv = Read-BerTlv $data $oidTlv.NextPos
                    $valBytes = if ($valTlv.Len -gt 0) { $data[$valTlv.ValStart..($valTlv.NextPos - 1)] } else { @() }
                    $results.Add([PSCustomObject]@{ Oid = $oidStr; Type = $valTlv.Tag; Bytes = $valBytes })
                    $vbPos = $vbTlv.NextPos
                }
            } catch {}
            return $results
        }
        function Parse-SnmpInt {
            param([byte[]]$data)
            if ($null -eq $data -or $data.Count -lt 4) { return $null }
            $result = $null; $i = 0
            while ($i -lt ($data.Count - 2)) {
                if ($data[$i] -eq 0x02) {
                    $len = $data[$i + 1]
                    if ($len -ge 1 -and $len -le 4 -and ($i + 2 + $len) -le $data.Count) {
                        $val = 0
                        for ($j = 0; $j -lt $len; $j++) { $val = ($val -shl 8) -bor $data[$i + 2 + $j] }
                        if ($i -gt 10) { $result = $val }
                    }
                }
                $i++
            }
            return $result
        }
        function Parse-SnmpString {
            param([byte[]]$data)
            if ($null -eq $data -or $data.Count -lt 12) { return "" }
            $result = ""; $i = 0
            while ($i -lt ($data.Count - 2)) {
                if ($data[$i] -eq 0x04) {
                    $len = $data[$i + 1]
                    if ($len -gt 0 -and ($i + 2 + $len) -le $data.Count -and $i -gt 10) {
                        $result = [System.Text.Encoding]::ASCII.GetString($data[($i + 2)..($i + 1 + $len)]).Trim()
                    }
                }
                $i++
            }
            return $result
        }
        function Parse-SnmpCounter {
            param([byte[]]$data)
            if ($null -eq $data -or $data.Count -lt 4) { return $null }
            $result = $null; $i = 0
            while ($i -lt ($data.Count - 2)) {
                if ($data[$i] -eq 0x41 -or $data[$i] -eq 0x02) {
                    $len = $data[$i + 1]
                    if ($len -ge 1 -and $len -le 5 -and ($i + 2 + $len) -le $data.Count) {
                        $val = 0
                        for ($j = 0; $j -lt $len; $j++) { $val = ($val -shl 8) -bor $data[$i + 2 + $j] }
                        if ($i -gt 10) { $result = $val }
                    }
                }
                $i++
            }
            return $result
        }

        $ep = [System.Net.IPEndPoint]::new([System.Net.IPAddress]::Any, 0)

        $uptimeStr = "N/A"
        try {
            $pkgUptime = Build-SnmpGet "1.3.6.1.2.1.1.3.0"
            $udp.Send($pkgUptime, $pkgUptime.Count) | Out-Null
            $respUptime = $udp.Receive([ref]$ep)
            $ticks = $null
            for ($i = 0; $i -lt ($respUptime.Count - 2); $i++) {
                if ($respUptime[$i] -eq 0x43) {
                    $len = $respUptime[$i + 1]
                    if ($len -ge 1 -and $len -le 5 -and ($i + 2 + $len) -le $respUptime.Count) {
                        $val = 0
                        for ($j = 0; $j -lt $len; $j++) { $val = ($val -shl 8) -bor $respUptime[$i + 2 + $j] }
                        $ticks = $val; break
                    }
                }
            }
            if ($null -ne $ticks) {
                $sec = $ticks / 100
                $uptimeStr = "$([math]::Floor($sec/86400))d, $([math]::Floor(($sec%86400)/3600))h, $([math]::Floor(($sec%3600)/60))m"
            }
        } catch {}

        $pageCount = $null
        try {
            $pkgPagCount = Build-SnmpGet "1.3.6.1.2.1.43.10.2.1.4.1.1"
            $udp.Send($pkgPagCount, $pkgPagCount.Count) | Out-Null
            $pageCount = Parse-SnmpCounter ($udp.Receive([ref]$ep))
        } catch {}

        $candidatos = @()
        $bulkOk = $false
        try {
            $colNivel = "1.3.6.1.2.1.43.11.1.1.9.1"
            $colMax   = "1.3.6.1.2.1.43.11.1.1.8.1"
            $colDesc  = "1.3.6.1.2.1.43.11.1.1.6.1"
            $pkgBulk = Build-SnmpGetBulk -Oids @($colNivel, $colMax, $colDesc) -MaxRepetitions 15
            $udp.Send($pkgBulk, $pkgBulk.Count) | Out-Null
            $respBulk = $udp.Receive([ref]$ep)
            $vbs = @(Parse-SnmpBulkResponse $respBulk)

            if ($vbs.Count -ge 3 -and ($vbs.Count % 3) -eq 0) {
                $bulkOk = $true
                for ($g = 0; $g -lt $vbs.Count; $g += 3) {
                    $vNivel = $vbs[$g]; $vMax = $vbs[$g + 1]; $vDesc = $vbs[$g + 2]
                    if ($vNivel.Oid -notlike "$colNivel.*" -or $vMax.Oid -notlike "$colMax.*") { break }
                    if ($vNivel.Type -in @(0x80, 0x81, 0x82) -or $vMax.Type -in @(0x80, 0x81, 0x82)) { break }

                    $nivel  = Convert-SnmpValueBytes $vNivel.Bytes
                    $maximo = Convert-SnmpValueBytes $vMax.Bytes
                    $desc   = if ($vDesc.Type -eq 0x04) { [System.Text.Encoding]::ASCII.GetString($vDesc.Bytes).Trim() } else { "" }
                    $indice = [int]($vNivel.Oid.Substring($colNivel.Length + 1))

                    if ($maximo -le 0) { continue }
                    if ($desc -match "(?i)waste|descarte|lixeira|recovery|container|cleaner") { continue }

                    $pct = [math]::Min(100, [math]::Max(0, [math]::Round(($nivel / $maximo) * 100)))

                    $cor = "Preto"
                    if ($desc -match "(?i)cyan|ciano|azul|\bc\b") { $cor = "Ciano" }
                    elseif ($desc -match "(?i)magenta|rosa|\bm\b") { $cor = "Magenta" }
                    elseif ($desc -match "(?i)yellow|amarelo|\by\b") { $cor = "Amarelo" }
                    elseif ($desc -match "(?i)black|preto|negro|\bk\b") { $cor = "Preto" }
                    elseif ($Qtd -gt 1) {
                        switch ($indice % 4) { 1 { $cor = "Ciano" } 2 { $cor = "Magenta" } 3 { $cor = "Amarelo" } 0 { $cor = "Preto" } }
                    }

                    $candidatos += [PSCustomObject]@{ Indice = $indice; Pct = $pct; CorToner = $cor; Maximo = $maximo }
                }
            }
        } catch { $bulkOk = $false }

        if (-not $bulkOk) {
            $candidatos = @()
            $falhasConsecutivas = 0
            foreach ($indice in 1..20) {
                try {
                    $pkgNivel = Build-SnmpGet "1.3.6.1.2.1.43.11.1.1.9.1.$indice"
                    $udp.Send($pkgNivel, $pkgNivel.Count) | Out-Null
                    $nivel = Parse-SnmpInt ($udp.Receive([ref]$ep))

                    $pkgMax = Build-SnmpGet "1.3.6.1.2.1.43.11.1.1.8.1.$indice"
                    $udp.Send($pkgMax, $pkgMax.Count) | Out-Null
                    $maximo = Parse-SnmpInt ($udp.Receive([ref]$ep))

                    if ($null -ne $nivel -and $null -ne $maximo -and $maximo -gt 0) {
                        $falhasConsecutivas = 0
                        $pkgDesc = Build-SnmpGet "1.3.6.1.2.1.43.11.1.1.6.1.$indice"
                        $udp.Send($pkgDesc, $pkgDesc.Count) | Out-Null
                        $desc = Parse-SnmpString ($udp.Receive([ref]$ep))

                        if ($desc -match "(?i)waste|descarte|lixeira|recovery|container|cleaner") { continue }

                        $pct = [math]::Min(100, [math]::Max(0, [math]::Round(($nivel / $maximo) * 100)))

                        $cor = "Preto"
                        if ($desc -match "(?i)cyan|ciano|azul|\bc\b") { $cor = "Ciano" }
                        elseif ($desc -match "(?i)magenta|rosa|\bm\b") { $cor = "Magenta" }
                        elseif ($desc -match "(?i)yellow|amarelo|\by\b") { $cor = "Amarelo" }
                        elseif ($desc -match "(?i)black|preto|negro|\bk\b") { $cor = "Preto" }
                        elseif ($Qtd -gt 1) {
                            switch ($indice % 4) { 1 { $cor = "Ciano" } 2 { $cor = "Magenta" } 3 { $cor = "Amarelo" } 0 { $cor = "Preto" } }
                        }

                        $candidatos += [PSCustomObject]@{ Indice = $indice; Pct = $pct; CorToner = $cor; Maximo = $maximo }
                    } else {
                        $falhasConsecutivas++
                    }
                } catch {
                    $falhasConsecutivas++
                }
                if ($Qtd -eq 1 -and $candidatos.Count -ge 1) { break }
                if ($Qtd -gt 1 -and $candidatos.Count -ge 8) { break }
                if ($falhasConsecutivas -ge 3) { break }
            }
        }

        $melhores = @()
        if ($candidatos.Count -gt 0) {
            if ($Qtd -gt 1) {
                $pesos = @{ "Ciano" = 1; "Magenta" = 2; "Amarelo" = 3; "Preto" = 4 }
                $melhores = $candidatos | Group-Object CorToner | ForEach-Object { $_.Group | Select-Object -First 1 } | Sort-Object { $pesos[$_.CorToner] }
            } else {
                $melhores = $candidatos | Sort-Object Maximo -Descending | Select-Object -First 1
            }
        }

        $udp.Dispose()
        return @{ Toners = $melhores; Uptime = $uptimeStr; PageCount = $pageCount }
    } catch {
        if ($null -ne $udp) { $udp.Dispose() }
        return @{ Toners = $null; Uptime = "Erro"; PageCount = $null }
    }
}

# ─────────────────────────────────────────────────────────────────────────────
#  Classificacao de modelo / tipo (mesma logica do NOC)
# ─────────────────────────────────────────────────────────────────────────────
function Obter-Modelo {
    param([string]$Driver)
    switch -Regex ($Driver) {
        "P 311"     { "Ricoh P311" }
        "P 502"     { "Ricoh P502" }
        "M3040"     { "Kyocera M3040idn" }
        "P3055"     { "Kyocera P3055dn" }
        "M6530"     { "Kyocera M6530cdn" }
        "Honeywell" { "Honeywell RP4f" }
        "TT042"     { "Elgin TT042" }
        "ELGIN"     { "Elgin TT042 Plus" }
        default     { $Driver -replace '\s+(PCL\d*|PS|KX|XPS|UFR\s*II|Class Driver)\b.*', '' }
    }
}

function Obter-TipoImpressora {
    param([string]$Nome, [string]$Modelo)
    $texto = "$Nome $Modelo"
    switch -Regex ($texto) {
        "(?i)zebra|elgin|tt042|argox"               { "Etiqueta"; break }
        "(?i)honeywell|rp4f|sewoo|portatil|portátil" { "Portatil"; break }
        "(?i)canon|kyocera|ricoh|pantum|hp\b|epson|brother|xerox|lexmark|samsung" { "A4"; break }
        default { "A4" }
    }
}

# ─────────────────────────────────────────────────────────────────────────────
#  Descoberta por servidor (Get-Printer / Get-PrinterPort) + enriquecimento
#  paralelo via SNMP (runspace pool)
# ─────────────────────────────────────────────────────────────────────────────
function Get-ImpressorasServidor {
    param([string]$Servidor, [string]$SnmpCommunity)

    Write-Log "Conectando ao spooler de '$Servidor'..." -Level Info
    try {
        $ports    = Get-PrinterPort -ComputerName $Servidor -ErrorAction Stop
        $printers = Get-Printer -ComputerName $Servidor -ErrorAction Stop
    } catch {
        Write-Log "Servidor '$Servidor' inacessivel: $($_.Exception.Message)" -Level Error
        return @()
    }

    $portMap = @{}
    foreach ($port in $ports) {
        if ($port.Name) { $portMap[$port.Name] = [string]$port.PrinterHostAddress }
    }

    $pool = [runspacefactory]::CreateRunspacePool(1, 30)
    $pool.Open()

    $defGetToner = (Get-Command Get-TonerSNMP).Definition
    $defObterMod = (Get-Command Obter-Modelo).Definition

    $tasks = @()
    foreach ($printer in $printers) {
        $ps = [powershell]::Create()
        $ps.RunspacePool = $pool
        [void]$ps.AddScript(@"
param(`$p, `$portMap, `$defGetToner, `$defObterMod, `$snmpCommunity, `$servidor)
Invoke-Expression "function Get-TonerSNMP { `$defGetToner }"
Invoke-Expression "function Obter-Modelo { `$defObterMod }"

`$ip     = if (`$portMap.ContainsKey(`$p.PortName)) { `$portMap[`$p.PortName] } else { `$p.PortName }
`$online = `$false
if (`$ip -match '^\d') {
    try { if ((New-Object System.Net.NetworkInformation.Ping).Send(`$ip, 400).Status -eq 'Success') { `$online = `$true } } catch {}
}
`$modelo = Obter-Modelo `$p.DriverName
`$qtd    = if (`$modelo -match 'color|M6530' -or `$p.Name -match 'color') { 4 } else { 1 }
`$snmp   = @{ Toners = `$null; Uptime = 'N/A'; PageCount = `$null }

if (`$online -and `$modelo -notmatch 'TT042|Honeywell' -and `$p.Name -notmatch 'TT042|Honeywell|Etiqueta|Elgin') {
    `$snmp = Get-TonerSNMP -IP `$ip -Qtd `$qtd -Community `$snmpCommunity
}

return [PSCustomObject]@{
    Nome      = `$p.Name
    IP        = `$ip
    Modelo    = `$modelo
    Servidor  = `$servidor
    Status    = if (`$online) { 'Online' } else { 'Offline' }
    Qtd       = `$qtd
    Toners    = `$snmp.Toners
    Uptime    = `$snmp.Uptime
    PageCount = `$snmp.PageCount
}
"@)
        [void]$ps.AddArgument($printer)
        [void]$ps.AddArgument($portMap)
        [void]$ps.AddArgument($defGetToner)
        [void]$ps.AddArgument($defObterMod)
        [void]$ps.AddArgument($SnmpCommunity)
        [void]$ps.AddArgument($Servidor)
        $tasks += @{ Pipe = $ps; Handle = $ps.BeginInvoke() }
    }

    $resultado = [System.Collections.Generic.List[object]]::new()
    foreach ($t in $tasks) {
        try {
            $obj = $t.Pipe.EndInvoke($t.Handle) | Select-Object -Last 1
            if ($null -ne $obj) {
                Write-Log "  $($obj.Nome) [$Servidor] -> $($obj.Status)" -Level Info
                $resultado.Add($obj) | Out-Null
            }
        } catch {
            Write-Log "Erro num runspace de '$Servidor': $_" -Level Warning
        }
        $t.Pipe.Dispose()
    }
    $pool.Close(); $pool.Dispose()
    return $resultado
}

# ─────────────────────────────────────────────────────────────────────────────
#  Monta o JSON no formato do painel web (Printer[] de src/types.ts)
# ─────────────────────────────────────────────────────────────────────────────
function ConvertTo-PainelJson {
    param($impressoras)

    $corSigla = @{ "Ciano" = "C"; "Magenta" = "M"; "Amarelo" = "Y"; "Preto" = "K" }
    $idx = 0
    $saida = foreach ($imp in $impressoras) {
        $idx++
        $ehEtiqueta = $imp.Modelo -match "TT042|Honeywell" -or $imp.Nome -match "TT042|Honeywell|Etiqueta|Elgin"

        $tonerList = $null
        $piorPct = 100
        if (-not $ehEtiqueta -and $imp.Status -eq "Online" -and $imp.Toners -and @($imp.Toners).Count -gt 0) {
            $tonerList = @(
                foreach ($t in @($imp.Toners)) {
                    $sigla = $corSigla[$t.CorToner]
                    if ($t.Pct -lt $piorPct) { $piorPct = $t.Pct }
                    [ordered]@{
                        color   = $sigla
                        label   = "$($t.CorToner) ($sigla)"
                        percent = [int]$t.Pct
                    }
                }
            )
        }

        $status = if ($imp.Status -eq "Offline") { "offline" }
                  elseif (-not $ehEtiqueta -and $piorPct -le 20) { "atencao" }
                  else { "online" }

        [ordered]@{
            id           = "$idx"
            name         = $imp.Nome
            ip           = $imp.IP
            model        = $imp.Modelo
            department   = $imp.Servidor
            status       = $status
            toner        = $tonerList
            pagesPrinted = if ($imp.PageCount) { [int]$imp.PageCount } else { 0 }
            lastSeen     = if ($imp.Status -eq "Online") { "agora" } else { $imp.Uptime }
        }
    }
    return , @($saida)
}

# ─────────────────────────────────────────────────────────────────────────────
#  Execucao
# ─────────────────────────────────────────────────────────────────────────────
Write-Log "Coletando de $($Servidores.Count) servidor(es): $($Servidores -join ', ')" -Level Success

$todas = [System.Collections.Generic.List[object]]::new()
foreach ($srv in $Servidores) {
    $resultadoServidor = Get-ImpressorasServidor -Servidor $srv -SnmpCommunity $SnmpCommunity
    foreach ($r in $resultadoServidor) { $todas.Add($r) | Out-Null }
}

$json = ConvertTo-PainelJson -impressoras $todas | ConvertTo-Json -Depth 6

$outDir = Split-Path -Parent $OutFile
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
Set-Content -LiteralPath $OutFile -Value $json -Encoding UTF8

Write-Log "OK: $($todas.Count) impressora(s) gravada(s) em '$OutFile'." -Level Success
