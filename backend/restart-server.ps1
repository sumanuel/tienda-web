# Script para reiniciar el servidor backend limpiamente
# Uso: .\restart-server.ps1

Write-Host "Reiniciando servidor backend..." -ForegroundColor Cyan

# Paso 1: Matar proceso en puerto 4000
Write-Host "Buscando proceso en puerto 4000..." -ForegroundColor Yellow
try {
    $process = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
    if ($process) {
        $pid = $process.OwningProcess
        Write-Host "Encontrado proceso $pid en puerto 4000. Terminando..." -ForegroundColor Yellow
        Stop-Process -Id $pid -Force
        Start-Sleep -Seconds 2
        Write-Host "Proceso terminado" -ForegroundColor Green
    } else {
        Write-Host "Puerto 4000 libre" -ForegroundColor Green
    }
} catch {
    Write-Host "Puerto 4000 libre" -ForegroundColor Green
}

# Paso 2: Iniciar servidor
Write-Host "Iniciando servidor..." -ForegroundColor Cyan
npm run dev
