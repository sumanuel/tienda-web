# Cierra frontend y backend de tienda-web por puerto
# Uso: .\stop.ps1

function Stop-PortProcesses {
    param(
        [Parameter(Mandatory = $true)]
        [int]$Port,
        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    $processIds = @()

    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($connections) {
            $processIds = @(
                $connections |
                    Select-Object -ExpandProperty OwningProcess -Unique |
                    Where-Object { $_ -and $_ -gt 0 }
            )
        }
    } catch {
        $processIds = @()
    }

    if ($processIds.Count -eq 0) {
        $netstatPids = @(
            netstat -ano |
                Select-String ":$Port " |
                ForEach-Object {
                    $parts = ($_ -replace "\s+", " ").Trim().Split(" ")
                    if ($parts.Length -ge 5) { $parts[-1] }
                } |
                Where-Object { $_ -match "^\d+$" } |
                Select-Object -Unique
        )

        if ($netstatPids) {
            $processIds = @($netstatPids)
        }
    }

    if ($processIds.Count -eq 0) {
        Write-Host "$Name ya estaba detenido" -ForegroundColor DarkGray
        return
    }

    foreach ($processId in $processIds) {
        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
            Write-Host "$Name detenido (PID $processId)" -ForegroundColor Green
        } catch {
            Write-Host "No se pudo detener $Name (PID $processId)" -ForegroundColor Red
        }
    }
}

Write-Host "=== T-Suma: Deteniendo proyecto ===" -ForegroundColor Cyan
Stop-PortProcesses -Port 3000 -Name "Frontend"
Stop-PortProcesses -Port 4000 -Name "Backend"
Write-Host "=== Cierre completado ===" -ForegroundColor Cyan
