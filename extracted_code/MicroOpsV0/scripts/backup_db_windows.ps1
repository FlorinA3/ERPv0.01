<#
.SYNOPSIS
Runs the MicroOps PostgreSQL backup script on Windows (for Task Scheduler).

.NOTES
- Assumes pg_dump is on PATH and .env.production is present in the install directory.
- Sets NODE_ENV=production before running the Node backup CLI.
#>

param(
    [string]$InstallDir = "",
    [string]$LogFile = ""
)

$scriptRoot = Split-Path -Parent $PSCommandPath
if (-not $InstallDir) {
    $InstallDir = Split-Path $scriptRoot -Parent
}

if (-not (Test-Path $InstallDir)) {
    Write-Error "InstallDir not found: $InstallDir"
    exit 1
}

Set-Location $InstallDir
$env:NODE_ENV = "production"

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$logLine = ""

try {
    & node server/utils/backupDb.js
    $exitCode = $LASTEXITCODE
} catch {
    Write-Error $_.Exception.Message
    $exitCode = 1
}

$logLine = "[{0}] backup_db_windows exit={1}" -f $timestamp, $exitCode
Write-Host $logLine

if ($LogFile) {
    try {
        Add-Content -Path $LogFile -Value $logLine
    } catch {
        Write-Warning "Could not write to log file $LogFile : $($_.Exception.Message)"
    }
}

exit $exitCode
