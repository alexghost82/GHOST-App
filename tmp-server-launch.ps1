$env:PATH = 'C:\Program Files\nodejs;' + $env:PATH
$stdout = 'c:\Users\User\Documents\GitHub\GHOST-App\output\playwright\server-stdout.log'
$stderr = 'c:\Users\User\Documents\GitHub\GHOST-App\output\playwright\server-stderr.log'
New-Item -ItemType Directory -Force -Path 'c:\Users\User\Documents\GitHub\GHOST-App\output\playwright' | Out-Null
if (Test-Path $stdout) { Remove-Item -LiteralPath $stdout -Force }
if (Test-Path $stderr) { Remove-Item -LiteralPath $stderr -Force }
Start-Process -FilePath 'c:\Users\User\Documents\GitHub\GHOST-App\node_modules\.bin\tsx.cmd' `
  -ArgumentList 'server\index.ts' `
  -WorkingDirectory 'c:\Users\User\Documents\GitHub\GHOST-App' `
  -WindowStyle Hidden `
  -RedirectStandardOutput $stdout `
  -RedirectStandardError $stderr
