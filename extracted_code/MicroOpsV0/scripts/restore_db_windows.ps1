<#
.SYNOPSIS
Restores a MicroOps PostgreSQL backup (.sql) into a staging/test database on Windows.

.NOTES
- Intended for manual/staging restores. Do not point to production DB without confirmation.
- Assumes psql is on PATH. Supply credentials via parameters or DB_* environment variables.
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,

    [Parameter(Mandatory = $true)]
    [string]$DatabaseName,

    [string]$DbHost = $env:DB_HOST,
    [string]$DbPort = $env:DB_PORT,
    [string]$DbUser = $env:DB_USER,
    [string]$DbPassword = $env:DB_PASSWORD,

    [switch]$CreateDatabase
)

if (-not (Test-Path $BackupFile)) {
    Write-Error "Backup file not found: $BackupFile"
    exit 1
}

if (-not $DbHost) { $DbHost = "localhost" }
if (-not $DbPort) { $DbPort = "5432" }
if (-not $DbUser) { $DbUser = "postgres" }

if ($DbPassword) {
    $env:PGPASSWORD = $DbPassword
}

if ($CreateDatabase) {
    $createCmd = "DROP DATABASE IF EXISTS `"$DatabaseName`"; CREATE DATABASE `"$DatabaseName`";"
    Write-Host "Creating database $DatabaseName on $DbHost:$DbPort..."
    & psql -h $DbHost -p $DbPort -U $DbUser -d postgres -c $createCmd
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to create database $DatabaseName"
        exit $LASTEXITCODE
    }
}

Write-Host "Restoring $BackupFile into $DatabaseName..."
& psql -h $DbHost -p $DbPort -U $DbUser -d $DatabaseName -f $BackupFile
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host "Restore completed."
} else {
    Write-Error "Restore failed with exit code $exitCode"
}

exit $exitCode
