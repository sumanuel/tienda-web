# Script para reiniciar el servidor backend limpiamente
# Uso: .\restart-server.ps1

Write-Host "Reiniciando servidor backend..." -ForegroundColor Cyan

# Paso 1: Matar procesos en puerto 4000
Write-Host "Buscando procesos en puerto 4000..." -ForegroundColor Yellow
$portPids = @()

try {
    $connections = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
    if ($connections) {
        $portPids = @(
            $connections |
                Select-Object -ExpandProperty OwningProcess -Unique |
                Where-Object { $_ -and $_ -gt 0 }
        )
    }
} catch {
    $portPids = @()
}

if ($portPids.Count -eq 0) {
    # Fallback para casos donde Get-NetTCPConnection no reporte conexiones activas
    $netstatPids = @(
        netstat -ano |
            Select-String ":4000" |
            ForEach-Object {
                $parts = ($_ -replace "\s+", " ").Trim().Split(" ")
                if ($parts.Length -ge 5) { $parts[-1] }
            } |
            Where-Object { $_ -match "^\d+$" } |
            Select-Object -Unique
    )

    if ($netstatPids) {
        $portPids = @($netstatPids)
    }
}

if ($portPids.Count -gt 0) {
    foreach ($portPid in $portPids) {
        try {
            Write-Host "Terminando proceso $portPid en puerto 4000..." -ForegroundColor Yellow
            Stop-Process -Id $portPid -Force -ErrorAction Stop
        } catch {
            Write-Host "No se pudo terminar el proceso $portPid" -ForegroundColor Red
        }
    }
    Start-Sleep -Seconds 2
    Write-Host "Limpieza de puerto 4000 completada" -ForegroundColor Green
} else {
    Write-Host "Puerto 4000 libre" -ForegroundColor Green
}

# Paso 2: Iniciar servidor
Write-Host "Iniciando servidor..." -ForegroundColor Cyan
npm run dev
