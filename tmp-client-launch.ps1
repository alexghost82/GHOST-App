$env:PATH = 'C:\Program Files\nodejs;' + $env:PATH
$stdout = 'c:\Users\User\Documents\GitHub\GHOST-App\output\playwright\client-stdout.log'
$stderr = 'c:\Users\User\Documents\GitHub\GHOST-App\output\playwright\client-stderr.log'
New-Item -ItemType Directory -Force -Path 'c:\Users\User\Documents\GitHub\GHOST-App\output\playwright' | Out-Null
if (Test-Path $stdout) { Remove-Item -LiteralPath $stdout -Force }
if (Test-Path $stderr) { Remove-Item -LiteralPath $stderr -Force }
Start-Process -FilePath 'C:\Program Files\nodejs\npm.cmd' `
  -ArgumentList 'run','dev:client','--','--host','127.0.0.1','--port','4173' `
  -WorkingDirectory 'c:\Users\User\Documents\GitHub\GHOST-App' `
  -WindowStyle Hidden `
  -RedirectStandardOutput $stdout `
  -RedirectStandardError $stderr
