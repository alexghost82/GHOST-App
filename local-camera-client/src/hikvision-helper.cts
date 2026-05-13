import { createInterface } from 'node:readline'
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { DiscoveredCamera, HikvisionSdkCameraSource } from './types.js'
import type { CaptureOptions } from './cameras/camera-source.js'

type Request =
  | { id: string; action: 'capture'; payload: { source: HikvisionSdkCameraSource; outputPath: string; options: CaptureOptions } }
  | { id: string; action: 'discover'; payload: Record<string, never> }
  | { id: string; action: 'shutdown'; payload: Record<string, never> }

type WorkerRequestAction = Request['action']

interface WorkerRequest {
  id: string
  action: WorkerRequestAction
  payload: Record<string, unknown>
}

interface WorkerResponse {
  id: string
  ok: boolean
  result?: unknown
  error?: string
}

const POWERSHELL_PATH = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'

const rl = createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
})

process.stdout.write('__READY__\n')

rl.on('line', async (line) => {
  const request = JSON.parse(line) as Request
  try {
    switch (request.action) {
      case 'capture':
        await sdkWorker.capture(request.payload.source, request.payload.outputPath, request.payload.options)
        return reply(request.id, true, { ok: true })
      case 'discover':
        return reply(request.id, true, await sdkWorker.discover())
      case 'shutdown':
        await sdkWorker.shutdown()
        reply(request.id, true, { ok: true })
        process.exit(0)
    }
  } catch (error) {
    reply(request.id, false, undefined, error instanceof Error ? error.message : String(error))
  }
})

function reply(id: string, ok: boolean, result?: unknown, error?: string): void {
  process.stdout.write(`${JSON.stringify({ id, ok, result, error })}\n`)
}

class HikvisionSdkWorker {
  private child: ChildProcessWithoutNullStreams | null = null
  private buffer = ''
  private readonly pending = new Map<string, { resolve: (value: unknown) => void; reject: (error: unknown) => void }>()
  private scriptPath: string | null = null

  async capture(source: HikvisionSdkCameraSource, outputPath: string, options: CaptureOptions): Promise<void> {
    await this.call('capture', { source, outputPath, options })
  }

  async discover(): Promise<DiscoveredCamera[]> {
    const result = await this.call('discover', {})
    return Array.isArray(result) ? result as DiscoveredCamera[] : []
  }

  async shutdown(): Promise<void> {
    if (!this.child) {
      return
    }
    try {
      await this.call('shutdown', {})
    } catch {}
    this.child.kill()
    this.child = null
  }

  private async call(action: WorkerRequestAction, payload: Record<string, unknown>): Promise<unknown> {
    const child = await this.ensureChild()
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const request: WorkerRequest = { id, action, payload }
    const promise = new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
    })
    child.stdin.write(`${JSON.stringify(request)}\n`)
    return promise
  }

  private async ensureChild(): Promise<ChildProcessWithoutNullStreams> {
    if (this.child && !this.child.killed) {
      return this.child
    }

    const script = buildPowerShellWorkerScript()
    const scriptPath = this.getWorkerScriptPath()
    writeFileSync(scriptPath, script, 'utf8')
    const child = spawn(
      POWERSHELL_PATH,
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptPath],
      {
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: process.env,
      },
    )

    this.child = child
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => this.handleStdout(chunk))
    child.stderr.on('data', () => undefined)
    child.on('exit', () => {
      for (const [, pending] of this.pending) {
        pending.reject(new Error('Hikvision SDK worker exited unexpectedly.'))
      }
      this.pending.clear()
      this.child = null
    })

    await this.waitForReady(child)
    return child
  }

  private getWorkerScriptPath(): string {
    if (this.scriptPath) {
      return this.scriptPath
    }

    const scriptDir = join(tmpdir(), 'ghost-camera-agent')
    mkdirSync(scriptDir, { recursive: true })
    this.scriptPath = join(scriptDir, 'hikvision-sdk-worker.ps1')
    return this.scriptPath
  }

  private async waitForReady(child: ChildProcessWithoutNullStreams): Promise<void> {
    const ready = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out while starting the Hikvision SDK worker.')), 15_000)
      const onData = (chunk: string | Buffer) => {
        const text = chunk.toString()
        if (!text.includes('__READY__')) {
          return
        }
        clearTimeout(timeout)
        child.stdout.off('data', onData)
        resolve()
      }
      child.stdout.on('data', onData)
      child.once('exit', () => {
        clearTimeout(timeout)
        reject(new Error('Hikvision SDK worker exited before becoming ready.'))
      })
    })
    await ready
  }

  private handleStdout(chunk: string): void {
    this.buffer += chunk
    const lines = this.buffer.split(/\r?\n/)
    this.buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed === '__READY__') {
        continue
      }
      const response = JSON.parse(trimmed) as WorkerResponse
      const pending = this.pending.get(response.id)
      if (!pending) {
        continue
      }
      this.pending.delete(response.id)
      if (response.ok) {
        pending.resolve(response.result)
      } else {
        pending.reject(new Error(response.error || 'Hikvision SDK worker request failed.'))
      }
    }
  }
}

const sdkWorker = new HikvisionSdkWorker()

function buildPowerShellWorkerScript(): string {
  return `
$ErrorActionPreference = 'Stop'
$script:SdkInitialized = $false
$script:SdkDir = $null
$script:SessionPool = @{}
$script:BackoffState = @{}
$script:MaxIdleMs = 300000
$script:TypeSignature = @"
using System;
using System.Runtime.InteropServices;
public struct NET_DVR_DEVICEINFO_V30 {
  [MarshalAs(UnmanagedType.ByValArray, SizeConst = 48)] public byte[] sSerialNumber;
  public byte byAlarmInPortNum;
  public byte byAlarmOutPortNum;
  public byte byDiskNum;
  public byte byDVRType;
  public byte byChanNum;
  public byte byStartChan;
  public byte byAudioChanNum;
  public byte byIPChanNum;
  [MarshalAs(UnmanagedType.ByValArray, SizeConst = 24)] public byte[] byRes1;
}
public struct NET_DVR_JPEGPARA {
  public ushort wPicSize;
  public ushort wPicQuality;
}
public static class HCNetSDKNative {
  [DllImport("HCNetSDK.dll")] public static extern bool NET_DVR_Init();
  [DllImport("HCNetSDK.dll")] public static extern bool NET_DVR_Cleanup();
  [DllImport("HCNetSDK.dll")] public static extern uint NET_DVR_GetLastError();
  [DllImport("HCNetSDK.dll", CharSet = CharSet.Ansi)] public static extern int NET_DVR_Login_V30(string ip, short port, string user, string password, ref NET_DVR_DEVICEINFO_V30 info);
  [DllImport("HCNetSDK.dll")] public static extern bool NET_DVR_Logout(int userId);
  [DllImport("HCNetSDK.dll", CharSet = CharSet.Ansi)] public static extern bool NET_DVR_CaptureJPEGPicture(int userId, int channel, ref NET_DVR_JPEGPARA jpegPara, string fileName);
}
public static class Kernel32Native {
  [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool SetDllDirectory(string lpPathName);
}
"@

function Send-Reply([string]$Id, [bool]$Ok, $Result, [string]$Error) {
  $payload = [ordered]@{
    id = $Id
    ok = $Ok
  }
  if ($null -ne $Result) {
    $payload.result = $Result
  }
  if ($Error) {
    $payload.error = $Error
  }
  [Console]::Out.WriteLine(($payload | ConvertTo-Json -Compress -Depth 8))
}

function Resolve-SdkDir {
  $candidates = New-Object System.Collections.Generic.List[string]
  if ($env:GHOST_HIKVISION_SDK_DIR) {
    $candidates.Add($env:GHOST_HIKVISION_SDK_DIR)
  }
  $candidates.Add((Get-Location).Path)
  $candidates.Add((Join-Path (Get-Location).Path 'hikvision-sdk'))
  if ($env:PORTABLE_EXECUTABLE_DIR) {
    $candidates.Add((Join-Path $env:PORTABLE_EXECUTABLE_DIR 'resources\\hikvision-sdk'))
  }
  $processDir = [System.AppContext]::BaseDirectory
  if ($processDir) {
    $candidates.Add((Join-Path $processDir 'resources\\hikvision-sdk'))
    $candidates.Add((Join-Path $processDir '..\\resources\\hikvision-sdk'))
  }

  foreach ($candidate in $candidates) {
    if (-not $candidate) {
      continue
    }
    if (Test-Path (Join-Path $candidate 'HCNetSDK.dll')) {
      return $candidate
    }
    $libDir = Join-Path $candidate 'lib'
    if (Test-Path (Join-Path $libDir 'HCNetSDK.dll')) {
      return $libDir
    }
  }

  return $null
}

function Ensure-SdkReady {
  if ($script:SdkInitialized) {
    return
  }
  $sdkDir = Resolve-SdkDir
  if (-not $sdkDir) {
    throw 'HCNetSDK.dll not found. Set GHOST_HIKVISION_SDK_DIR to the Hikvision SDK directory.'
  }
  $dllPath = Join-Path $sdkDir 'HCNetSDK.dll'
  $sdkComDir = Join-Path $sdkDir 'HCNetSDKCom'
  $clientDemoDllDir = Join-Path $sdkDir 'ClientDemoDll'
  $pathSegments = New-Object System.Collections.Generic.List[string]
  $pathSegments.Add($sdkDir)
  if (Test-Path $sdkComDir) {
    $pathSegments.Add($sdkComDir)
  }
  if (Test-Path $clientDemoDllDir) {
    $pathSegments.Add($clientDemoDllDir)
  }
  $pathSegments.Add($env:PATH)
  $env:PATH = ($pathSegments -join ';')
  Set-Location $sdkDir
  if (-not ('HCNetSDKNative' -as [type])) {
    Add-Type -TypeDefinition $script:TypeSignature
  }
  [Kernel32Native]::SetDllDirectory($sdkDir) | Out-Null
  if (-not [HCNetSDKNative]::NET_DVR_Init()) {
    $code = [HCNetSDKNative]::NET_DVR_GetLastError()
    throw (Map-HikvisionError 'init' $code)
  }
  $script:SdkDir = $sdkDir
  $script:SdkInitialized = $true
}

function Get-SessionKey($Source) {
  return "$($Source.host):$($Source.port):$($Source.username)"
}

function Get-NowMs {
  return [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
}

function Get-BackoffRemainingMs([string]$Key) {
  if (-not $script:BackoffState.ContainsKey($Key)) {
    return 0
  }
  $entry = $script:BackoffState[$Key]
  $remaining = [int]($entry.untilMs - (Get-NowMs))
  if ($remaining -le 0) {
    $script:BackoffState.Remove($Key)
    return 0
  }
  return $remaining
}

function Set-Backoff([string]$Key, [int]$Attempt) {
  $delayMs = [Math]::Min(15000, [Math]::Pow(2, [Math]::Max(0, $Attempt - 1)) * 1000)
  $script:BackoffState[$Key] = @{
    untilMs = (Get-NowMs) + [int]$delayMs
    attempt = $Attempt
  }
}

function Clear-Backoff([string]$Key) {
  if ($script:BackoffState.ContainsKey($Key)) {
    $script:BackoffState.Remove($Key)
  }
}

function Is-AuthError([uint32]$Code) {
  return @(
    1,
    47,
    153
  ) -contains $Code
}

function Is-TransientError([uint32]$Code) {
  return @(
    3,
    7,
    8,
    9,
    10,
    11,
    72,
    73,
    76,
    91
  ) -contains $Code
}

function Map-HikvisionError([string]$Phase, [uint32]$Code) {
  switch ($Phase) {
    'init' {
      return "Hikvision SDK initialization failed. Error code: $Code"
    }
    'login' {
      if (Is-AuthError $Code) {
        return 'Hikvision login failed: invalid username or password.'
      }
      if (Is-TransientError $Code) {
        return 'Hikvision login failed because the device is unreachable or timed out.'
      }
      return "Hikvision login failed. Error code: $Code"
    }
    'capture' {
      if (Is-AuthError $Code) {
        return 'Hikvision login failed: invalid username or password.'
      }
      if ($Code -eq 23) {
        return 'Hikvision device does not support JPEG snapshot for this channel.'
      }
      if ($Code -eq 29) {
        return 'Hikvision channel is unavailable.'
      }
      if (Is-TransientError $Code) {
        return 'Hikvision snapshot timed out.'
      }
      return "Hikvision snapshot failed. Error code: $Code"
    }
    default {
      return "Hikvision operation failed. Error code: $Code"
    }
  }
}

function Close-Session([string]$Key) {
  if (-not $script:SessionPool.ContainsKey($Key)) {
    return
  }
  $session = $script:SessionPool[$Key]
  try {
    [HCNetSDKNative]::NET_DVR_Logout([int]$session.userId) | Out-Null
  } catch {}
  $script:SessionPool.Remove($Key)
}

function Close-IdleSessions([int]$MaxIdleMs) {
  if (-not $script:SessionPool.Count) {
    return
  }
  $nowMs = Get-NowMs
  foreach ($key in @($script:SessionPool.Keys)) {
    $session = $script:SessionPool[$key]
    if (($nowMs - [int64]$session.lastUsedAtMs) -gt $MaxIdleMs) {
      Close-Session $key
    }
  }
}

function Close-AllSessions {
  foreach ($key in @($script:SessionPool.Keys)) {
    Close-Session $key
  }
  if ($script:SdkInitialized) {
    try {
      [HCNetSDKNative]::NET_DVR_Cleanup() | Out-Null
    } catch {}
    $script:SdkInitialized = $false
  }
}

function Get-OrCreateSession($Source) {
  Ensure-SdkReady
  $key = Get-SessionKey $Source
  if ($script:SessionPool.ContainsKey($key)) {
    $session = $script:SessionPool[$key]
    $session.lastUsedAtMs = Get-NowMs
    return $session
  }
  $info = New-Object NET_DVR_DEVICEINFO_V30
  $userId = [HCNetSDKNative]::NET_DVR_Login_V30($Source.host, [int16]$Source.port, $Source.username, $Source.password, [ref]$info)
  if ($userId -lt 0) {
    $code = [HCNetSDKNative]::NET_DVR_GetLastError()
    throw (Map-HikvisionError 'login' $code)
  }
  $session = @{
    key = $key
    userId = $userId
    host = $Source.host
    port = [int]$Source.port
    username = $Source.username
    lastUsedAtMs = Get-NowMs
  }
  $script:SessionPool[$key] = $session
  return $session
}

function Invoke-Capture($Payload) {
  $source = $Payload.source
  $outputPath = $Payload.outputPath
  $key = Get-SessionKey $source
  $remainingMs = Get-BackoffRemainingMs $key
  if ($remainingMs -gt 0) {
    throw "Hikvision snapshot backoff in progress. Retry in $remainingMs ms."
  }

  $attempt = 0
  while ($true) {
    try {
      Close-IdleSessions $script:MaxIdleMs
      $session = Get-OrCreateSession $source
      $jpeg = New-Object NET_DVR_JPEGPARA
      $jpeg.wPicQuality = [uint16]2
      $jpeg.wPicSize = [uint16]0
      $captured = [HCNetSDKNative]::NET_DVR_CaptureJPEGPicture([int]$session.userId, [int]$source.channel, [ref]$jpeg, $outputPath)
      if (-not $captured) {
        $code = [HCNetSDKNative]::NET_DVR_GetLastError()
        if (Is-AuthError $code) {
          Close-Session $key
        }
        if ((Is-TransientError $code) -and $attempt -lt 1) {
          $attempt += 1
          Set-Backoff $key $attempt
          Start-Sleep -Milliseconds 250
          continue
        }
        throw (Map-HikvisionError 'capture' $code)
      }
      $session.lastUsedAtMs = Get-NowMs
      Clear-Backoff $key
      return @{
        ok = $true
        reusedSession = $attempt -eq 0
      }
    } catch {
      if ($attempt -ge 1) {
        throw
      }
      $message = $_.Exception.Message
      if ($message -like 'Hikvision snapshot timed out.*' -or $message -like 'Hikvision login failed because the device is unreachable*') {
        $attempt += 1
        Set-Backoff $key $attempt
        Start-Sleep -Milliseconds 250
        continue
      }
      throw
    }
  }
}

function Test-PortOpen([string]$TargetHost, [int]$Port, [int]$TimeoutMs) {
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $async = $client.BeginConnect($TargetHost, $Port, $null, $null)
    $ok = $async.AsyncWaitHandle.WaitOne($TimeoutMs, $false)
    if (-not $ok) {
      return $false
    }
    $client.EndConnect($async) | Out-Null
    return $true
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

function Get-CandidateHosts {
  $results = New-Object System.Collections.Generic.List[string]
  $addresses = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object {
    $_.IPAddress -notlike '169.254.*' -and $_.IPAddress -ne '127.0.0.1'
  }
  foreach ($address in $addresses) {
    $parts = $address.IPAddress.Split('.')
    if ($parts.Length -ne 4) {
      continue
    }
    $prefix = "$($parts[0]).$($parts[1]).$($parts[2])"
    for ($octetHost = 1; $octetHost -le 64; $octetHost++) {
      if ($octetHost -eq [int]$parts[3]) {
        continue
      }
      $candidate = "$prefix.$octetHost"
      if (-not $results.Contains($candidate)) {
        $results.Add($candidate)
      }
    }
  }
  return $results
}

function Invoke-Discover {
  $found = New-Object System.Collections.Generic.List[object]
  foreach ($candidateHost in Get-CandidateHosts) {
    $port8000 = Test-PortOpen $candidateHost 8000 250
    $port554 = Test-PortOpen $candidateHost 554 250
    if (-not $port8000 -and -not $port554) {
      continue
    }
    $found.Add([ordered]@{
      id = "hikvision-$candidateHost"
      label = if ($port8000) { "Hikvision $candidateHost" } else { "Camera $candidateHost" }
      discoveryType = 'hikvision-sdk'
      sourceType = 'hikvision-sdk'
      host = $candidateHost
      port = if ($port8000) { 8000 } else { 554 }
      manufacturer = if ($port8000) { 'Hikvision' } else { $null }
      requiresCredentials = $true
      suggestedRtspUrls = @(
        "rtsp://$candidateHost:554/Streaming/Channels/101",
        "rtsp://$candidateHost:554/Streaming/Channels/102"
      )
      suggestedSource = [ordered]@{
        type = 'hikvision-sdk'
        host = $candidateHost
        port = if ($port8000) { 8000 } else { 8000 }
        channel = 1
      }
      status = if ($port8000) { 'found' } else { 'requires-auth' }
    })
  }
  return $found
}

[Console]::Out.WriteLine('__READY__')
while ($true) {
  $line = [Console]::In.ReadLine()
  if ($null -eq $line) {
    Close-AllSessions
    break
  }
  if (-not $line.Trim()) {
    continue
  }
  $request = $line | ConvertFrom-Json
  try {
    switch ($request.action) {
      'capture' {
        $result = Invoke-Capture $request.payload
        Send-Reply $request.id $true $result $null
      }
      'discover' {
        $result = Invoke-Discover
        Send-Reply $request.id $true $result $null
      }
      'shutdown' {
        Close-AllSessions
        Send-Reply $request.id $true @{ ok = $true } $null
        break
      }
      default {
        throw "Unsupported Hikvision worker action: $($request.action)"
      }
    }
  } catch {
    Send-Reply $request.id $false $null $_.Exception.Message
  }
}
`
}
