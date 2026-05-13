$ErrorActionPreference = "Stop"

param(
  [string]$AppPath,
  [string]$TaskName = "GHOST Camera Agent"
)

$clientRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

if (-not $AppPath) {
  $unpackedExe = Join-Path $clientRoot "build\win-unpacked\GHOST Camera Agent.exe"
  if (Test-Path $unpackedExe) {
    $AppPath = (Resolve-Path $unpackedExe).Path
  } else {
    throw "App executable not found. Pass -AppPath to the installed EXE or build the packaged app first."
  }
}

if (!(Test-Path $AppPath)) {
  throw "Executable not found at $AppPath"
}

$workingDir = Split-Path $AppPath -Parent
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$action = New-ScheduledTaskAction -Execute $AppPath -Argument "--hidden" -WorkingDirectory $workingDir
$trigger = New-ScheduledTaskTrigger -AtLogOn
$principal = New-ScheduledTaskPrincipal -UserId $currentUser -LogonType Interactive -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DisallowStartIfOnBatteries:$false -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
Write-Host "Installed scheduled task: $TaskName"
