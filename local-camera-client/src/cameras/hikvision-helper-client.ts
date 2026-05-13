import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import type { HikvisionSdkCameraSource, DiscoveredCamera } from '../types.js'
import type { CaptureOptions } from './camera-source.js'

interface HelperRequest {
  id: string
  action: 'capture' | 'discover' | 'shutdown'
  payload?: Record<string, unknown>
}

interface HelperResponse {
  id: string
  ok: boolean
  result?: unknown
  error?: string
}

class HikvisionHelperClient {
  private child: ChildProcessWithoutNullStreams | null = null
  private readonly pending = new Map<string, { resolve: (value: unknown) => void; reject: (error: unknown) => void }>()
  private buffer = ''

  async captureJpegToFile(source: HikvisionSdkCameraSource, outputPath: string, options: CaptureOptions): Promise<void> {
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

  private async call(action: HelperRequest['action'], payload: Record<string, unknown>): Promise<unknown> {
    const child = await this.ensureChild()
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const request: HelperRequest = { id, action, payload }
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

    const helperEntry = resolveHelperEntry()
    const child = spawn(process.execPath, [helperEntry], {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
    })
    this.child = child
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => this.handleStdout(chunk))
    child.stderr.on('data', () => undefined)
    child.on('exit', () => {
      for (const [, pending] of this.pending) {
        pending.reject(new Error('Hikvision helper exited unexpectedly.'))
      }
      this.pending.clear()
      this.child = null
    })
    await this.waitForReady(child)
    return child
  }

  private async waitForReady(child: ChildProcessWithoutNullStreams): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out while starting the Hikvision helper process.')), 15_000)
      const onData = (chunk: string | Buffer) => {
        if (!chunk.toString().includes('__READY__')) {
          return
        }
        clearTimeout(timeout)
        child.stdout.off('data', onData)
        resolve()
      }
      child.stdout.on('data', onData)
      child.once('exit', () => {
        clearTimeout(timeout)
        reject(new Error('Hikvision helper exited before becoming ready.'))
      })
    })
  }

  private handleStdout(chunk: string): void {
    this.buffer += chunk
    const lines = this.buffer.split(/\r?\n/)
    this.buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        continue
      }
      if (trimmed === '__READY__') {
        continue
      }
      const response = JSON.parse(trimmed) as HelperResponse
      const pending = this.pending.get(response.id)
      if (!pending) {
        continue
      }
      this.pending.delete(response.id)
      if (response.ok) {
        pending.resolve(response.result)
      } else {
        pending.reject(new Error(response.error || 'Hikvision helper request failed.'))
      }
    }
  }
}

export const hikvisionHelperClient = new HikvisionHelperClient()

function resolveHelperEntry(): string {
  const currentDir = fileURLToPath(new URL('.', import.meta.url))
  const directPath = join(currentDir, '..', 'hikvision-helper.cjs')
  if (directPath.includes('app.asar')) {
    return directPath.replace('app.asar', 'app.asar.unpacked')
  }
  return directPath
}
