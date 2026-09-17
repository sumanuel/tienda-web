# Reinicia frontend y backend de tienda-web (stop + start)
# Uso: .\restart.ps1

Write-Host "=== T-Suma: Reiniciando proyecto ===" -ForegroundColor Cyan
Write-Host ""

# Ejecutar stop.ps1
& ".\stop.ps1"

Write-Host ""
Write-Host "Esperando 2 segundos antes de reiniciar..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host ""

# Ejecutar start.ps1
& ".\start.ps1"
