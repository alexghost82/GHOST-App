import type { LocalCameraConfig } from './config.js'
import { GhostApiClient } from './api-client.js'
import { captureFrameDataUrl } from './camera.js'
import type { AgentRuntimeState } from './health-server.js'
import { buildScanMessage } from './messages.js'
import { getDueOperations, markOperationsRan } from './scheduler.js'

export class LocalCameraWorker {
  private readonly api: GhostApiClient
  private readonly lastRunByOperationId = new Map<string, number>()
  private timer: ReturnType<typeof setInterval> | null = null
  private workLoopPromise: Promise<void> | null = null
  private captureQueue: Promise<void> = Promise.resolve()
  private stopped = false
  private runningTick = false

  constructor(
    private readonly config: LocalCameraConfig,
    private readonly state: AgentRuntimeState,
  ) {
    this.api = new GhostApiClient(config)
  }

  async start(): Promise<void> {
    this.stopped = false
    await this.tick()
    this.timer = setInterval(() => void this.tick(), this.config.pollIntervalMs)
    this.workLoopPromise = this.runWorkLoop()
  }

  stop(): void {
    this.stopped = true
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  snapshotSession(): { accessToken: string; refreshToken: string } {
    return this.api.getSession()
  }

  private async runWorkLoop(): Promise<void> {
    while (!this.stopped) {
      try {
        const work = await this.api.waitForNextWork(this.config.deviceId, 20_000)
        if (!work) {
          continue
        }
        const frameDataUrl = await this.captureFrameSerially()
        await this.api.submitCaptureResult(work.id, this.config.deviceId, frameDataUrl, new Date().toISOString())
      } catch (error) {
        this.state.lastError = error instanceof Error ? error.message : String(error)
        await this.sendHeartbeatSafe('degraded', this.state.lastError)
      }
    }
  }

  private async tick(): Promise<void> {
    if (this.runningTick || this.stopped) return
    this.runningTick = true

    try {
      const channel = await this.api.fetchChannel(this.config.channelId)
      await this.sendHeartbeatSafe('online')
      this.state.status = 'online'
      this.state.lastHeartbeatAtIso = new Date().toISOString()

      const now = new Date()
      const dueByChannel = getDueOperations([channel], now, this.lastRunByOperationId)
      for (const item of dueByChannel) {
        this.state.status = 'scanning'
        await this.sendHeartbeatSafe('scanning')

        const frameDataUrl = await this.captureFrameSerially()
        const results = await this.api.scanOperations(item.channel, frameDataUrl, item.operations)
        const resultByOperationId = new Map(results.map((result) => [result.operationId, result]))

        for (const operation of item.operations) {
          const result = resultByOperationId.get(operation.id)
          if (!result) continue
          await this.api.saveMessage(item.channel.id, buildScanMessage(operation, result, frameDataUrl, new Date()))
          this.state.scannedOperations += 1
        }

        markOperationsRan(item.operations, now.getTime(), this.lastRunByOperationId)
        this.state.lastScanAtIso = new Date().toISOString()
      }

      this.state.status = 'online'
      this.state.lastError = undefined
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.state.status = 'degraded'
      this.state.lastError = message
      await this.sendHeartbeatSafe('degraded', message)
    } finally {
      this.runningTick = false
    }
  }

  private captureFrameSerially(): Promise<string> {
    const runCapture = async () => captureFrameDataUrl(this.config)
    const capturePromise = this.captureQueue.then(runCapture, runCapture)
    this.captureQueue = capturePromise.then(
      () => undefined,
      () => undefined,
    )
    return capturePromise
  }

  private async sendHeartbeatSafe(status: 'online' | 'scanning' | 'degraded' | 'offline', message?: string): Promise<void> {
    try {
      await this.api.sendHeartbeat({
        channelId: this.config.channelId,
        deviceId: this.config.deviceId,
        deviceName: this.config.deviceName,
        cameraName: this.config.cameraName,
        status,
        message,
      })
    } catch (error) {
      this.state.lastError = error instanceof Error ? error.message : String(error)
    }
  }
}
