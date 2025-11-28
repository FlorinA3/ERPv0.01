<#
.SYNOPSIS
Template to install MicroOps ERP backend as a Windows service (using NSSM).

.NOTES
- Run this as an administrator after adjusting the parameters.
- Use a limited service account (no interactive logon, no domain admin).
- Place your `.env.production` in the install directory with restricted NTFS permissions.
#>

param(
    [string]$ServiceName = "MicroOpsERP",
    [string]$InstallDir = "D:\MicroOps\MicroOpsERP",
    [string]$NodeExe = "C:\Program Files\nodejs\node.exe",
    [string]$NssmExe = "C:\nssm\nssm.exe",
    [string]$EnvFile = ".env.production",
    [string]$LogDir = "D:\MicroOps\Logs",
    [string]$ServiceUser = "" # e.g. ".\svc-microops" or "NT SERVICE\MicroOpsERP"
)

if (-not (Test-Path $NssmExe)) { Write-Error "NSSM not found at $NssmExe"; exit 1 }
if (-not (Test-Path $NodeExe)) { Write-Error "Node executable not found at $NodeExe"; exit 1 }
if (-not (Test-Path $InstallDir)) { Write-Error "InstallDir not found: $InstallDir"; exit 1 }

$entryScript = Join-Path $InstallDir "server\index.js"
if (-not (Test-Path $entryScript)) { Write-Error "Backend entry not found at $entryScript"; exit 1 }

if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
}

# Install service
& $NssmExe install $ServiceName $NodeExe $entryScript
& $NssmExe set $ServiceName AppDirectory $InstallDir
& $NssmExe set $ServiceName AppEnvironmentExtra "NODE_ENV=production"
& $NssmExe set $ServiceName AppStdout (Join-Path $LogDir "microops-service.out.log")
& $NssmExe set $ServiceName AppStderr (Join-Path $LogDir "microops-service.err.log")
& $NssmExe set $ServiceName Start SERVICE_AUTO_START

if ($ServiceUser) {
    & $NssmExe set $ServiceName ObjectName $ServiceUser
}

Write-Host "Service '$ServiceName' configured. Ensure $EnvFile contains production secrets and has restricted permissions." -ForegroundColor Green
