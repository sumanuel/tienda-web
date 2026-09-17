# Arranca backend y frontend de tienda-web en terminales separadas
# Uso: .\start.ps1

Write-Host "=== T-Suma: Iniciando proyecto ===" -ForegroundColor Cyan

# --- Backend ---
$backendPath = Join-Path $PSScriptRoot "backend"

# Liberar puerto 4000 si está ocupado
$portPids = @()
try {
    $connections = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
    if ($connections) {
        $portPids = @($connections | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 })
    }
} catch {}

if ($portPids.Count -eq 0) {
    $netstatPids = @(
        netstat -ano | Select-String ":4000 " |
        ForEach-Object { ($_ -replace "\s+", " ").Trim().Split(" ")[-1] } |
        Where-Object { $_ -match "^\d+$" } |
        Select-Object -Unique
    )
    if ($netstatPids) { $portPids = @($netstatPids) }
}

foreach ($processId in $portPids) {
    try { Stop-Process -Id $processId -Force -ErrorAction Stop } catch {}
}

if ($portPids.Count -gt 0) {
    Write-Host "Puerto 4000 liberado" -ForegroundColor Yellow
    Start-Sleep -Seconds 1
}

# Iniciar backend en nueva terminal
Write-Host "Iniciando backend en puerto 4000..." -ForegroundColor Green
Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev"

# Esperar a que el backend responda
Write-Host "Esperando que el backend este listo..." -ForegroundColor Yellow
$maxWait = 20
$ready = $false
for ($i = 0; $i -lt $maxWait; $i++) {
    Start-Sleep -Seconds 1
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $ready = $true
            break
        }
    } catch {}
    Write-Host "  Esperando... ($($i+1)/$maxWait)" -ForegroundColor DarkGray
}

if (-not $ready) {
    Write-Host "Advertencia: el backend no respondio en $maxWait segundos, revisa la terminal del backend" -ForegroundColor Red
} else {
    Write-Host "Backend listo!" -ForegroundColor Green
}

# --- Frontend ---
$frontendPath = $PSScriptRoot

# Liberar puerto 3000 si está ocupado
$portPids3 = @()
try {
    $c3 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($c3) { $portPids3 = @($c3 | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 }) }
} catch {}

foreach ($processId in $portPids3) {
    try { Stop-Process -Id $processId -Force -ErrorAction Stop } catch {}
}

if ($portPids3.Count -gt 0) {
    Write-Host "Puerto 3000 liberado" -ForegroundColor Yellow
    Start-Sleep -Seconds 1
}

Write-Host "Iniciando frontend en puerto 3000..." -ForegroundColor Green
Write-Host ""
Write-Host "=== Proyecto iniciado ===" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Backend:  http://localhost:4000" -ForegroundColor White
Write-Host ""

Set-Location $frontendPath
npm run dev
