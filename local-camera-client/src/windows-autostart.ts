import { dirname } from 'node:path'
import { spawn } from 'node:child_process'

export const AUTOSTART_TASK_NAME = 'GHOST Camera Agent'

export interface AutostartLaunchConfig {
  executable: string
  args: string[]
  workingDirectory?: string
}

export async function isAutostartEnabled(taskName: string = AUTOSTART_TASK_NAME): Promise<boolean> {
  try {
    await runPowerShell(`
      if (Get-ScheduledTask -TaskName ${psQuote(taskName)} -ErrorAction SilentlyContinue) {
        exit 0
      }
      exit 1
    `)
    return true
  } catch {
    return false
  }
}

export async function registerAutostart(
  launchConfig: AutostartLaunchConfig,
  taskName: string = AUTOSTART_TASK_NAME,
): Promise<void> {
  const executable = launchConfig.executable
  const workingDirectory = launchConfig.workingDirectory ?? dirname(executable)
  const argumentString = toArgumentString(launchConfig.args)

  await runPowerShell(`
    $taskName = ${psQuote(taskName)}
    $exe = ${psQuote(executable)}
    $args = ${psQuote(argumentString)}
    $workingDir = ${psQuote(workingDirectory)}
    $user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    $action = New-ScheduledTaskAction -Execute $exe -Argument $args -WorkingDirectory $workingDir
    $trigger = New-ScheduledTaskTrigger -AtLogOn
    $principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Highest
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DisallowStartIfOnBatteries:$false -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
  `)
}

export async function unregisterAutostart(taskName: string = AUTOSTART_TASK_NAME): Promise<void> {
  await runPowerShell(`
    $taskName = ${psQuote(taskName)}
    if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
      Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
      Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    }
  `)
}

function toArgumentString(args: string[]): string {
  return args
    .filter((value) => value && value.trim().length > 0)
    .map((value) => (/[\s"]/u.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value))
    .join(' ')
}

function psQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

function runPowerShell(script: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      script,
    ], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stderr = ''
    let stdout = ''

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8')
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8')
    })
    child.on('error', (error) => reject(error))
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error((stderr || stdout || `PowerShell exited with code ${code}.`).trim()))
    })
  })
}
