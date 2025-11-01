param(
    [Parameter(Mandatory=$false)]
    [int]$Port = 5172
)

Write-Host "Checking for listeners on port $Port..."
$connections = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
if (-not $connections) {
    Write-Host "No listeners found on port $Port."
    exit 0
}

$PIDs = $connections | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique
foreach ($pid in $PIDs) {
    try {
        $proc = Get-Process -Id $pid -ErrorAction Stop
        Write-Host ("Stopping PID {0} ({1})" -f $pid, $proc.Name)
        Stop-Process -Id $pid -Force -ErrorAction Stop
    } catch {
        Write-Warning ("Failed to stop PID {0}: {1}" -f $pid, $_.Exception.Message)
    }
}

Start-Sleep -Seconds 1
if (Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue) {
    Write-Error "Port $Port still in use."
    exit 1
} else {
    Write-Host "Port $Port freed."
}
