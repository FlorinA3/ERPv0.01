<#
.SYNOPSIS
Checks the MicroOps health endpoint and exits non-zero on degraded/critical status.

.NOTES
- Intended for Task Scheduler. Uses GET on /api/health by default.
#>

param(
    [string]$HealthUrl = "http://localhost:4000/api/health",
    [string]$LogFile = ""
)

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$status = "unknown"
$exitCode = 1

try {
    $response = Invoke-RestMethod -Uri $HealthUrl -Method Get -TimeoutSec 15
    $status = $response.status
    if ($status -eq "ok") {
        $exitCode = 0
    } else {
        $exitCode = 1
    }
} catch {
    $status = "error"
    $exitCode = 1
}

$line = "[{0}] health={1} url={2}" -f $timestamp, $status, $HealthUrl
Write-Host $line

if ($LogFile) {
    try {
        Add-Content -Path $LogFile -Value $line
    } catch {
        Write-Warning "Could not write health log: $($_.Exception.Message)"
    }
}

exit $exitCode
