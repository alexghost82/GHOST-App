import type { LocalCameraConfig } from './config.js'
import { GhostApiClient } from './api-client.js'
import { captureFrameDataUrl } from './camera.js'
import type { AgentRuntimeState } from './health-server.js'
import { buildScanMessage } from './messages.js'
import { getDueOperations, markOperationsRan } from './scheduler.js'
import type { CameraRuntimeStatus, Channel, CaptureProfile } from './types.js'

export class LocalCameraWorker {
  private readonly api: GhostApiClient
  private readonly lastRunByOperationId = new Map<string, number>()
  private timer: ReturnType<typeof setInterval> | null = null
  private workLoopPromise: Promise<void> | null = null
  private stopped = false
  private runningTick = false
  private readonly cameraStatuses = new Map<string, CameraRuntimeStatus>()

  constructor(
    private readonly config: LocalCameraConfig,
    private readonly state: AgentRuntimeState,
  ) {
    this.api = new GhostApiClient(config)
  }

  async start(): Promise<void> {
    this.stopped = false
    this.initializeCameraStatuses()
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
        const frameDataUrl = await this.captureFrame(work.cameraId, work.profile)
        await this.api.submitCaptureResult(work.id, this.config.deviceId, work.cameraId, frameDataUrl, new Date().toISOString())
      } catch (error) {
        this.state.lastError = error instanceof Error ? error.message : String(error)
        await this.sendHeartbeatsSafe('degraded', this.state.lastError)
      }
    }
  }

  private async tick(): Promise<void> {
    if (this.runningTick || this.stopped) return
    this.runningTick = true

    try {
      const channels = await this.fetchBoundChannels()
      await this.sendHeartbeatsSafe('online')
      this.state.status = 'online'
      this.state.lastHeartbeatAtIso = new Date().toISOString()

      const now = new Date()
      const dueByChannel = getDueOperations(channels, now, this.lastRunByOperationId)
      for (const item of dueByChannel) {
        this.state.status = 'scanning'
        await this.sendHeartbeatSafe(item.channel.id, 'scanning')

        const cameraId = this.resolveCameraIdForChannel(item.channel)
        const frameDataUrl = await this.captureFrame(cameraId, 'scan-standard')
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
      await this.sendHeartbeatsSafe('degraded', message)
    } finally {
      this.runningTick = false
    }
  }

  private initializeCameraStatuses(): void {
    for (const camera of this.config.cameras) {
      this.cameraStatuses.set(camera.cameraId, {
        cameraId: camera.cameraId,
        label: camera.label,
        sourceType: camera.source.type,
        status: 'offline',
      })
    }
    this.state.cameraStatuses = Array.from(this.cameraStatuses.values())
  }

  private async captureFrame(cameraId: string, profile: CaptureProfile): Promise<string> {
    const startedAt = Date.now()
    try {
      const frameDataUrl = await captureFrameDataUrl(this.config, cameraId, profile)
      this.updateCameraStatus(cameraId, {
        status: 'online',
        lastCaptureAtIso: new Date().toISOString(),
        lastSuccessAtIso: new Date().toISOString(),
        lastError: undefined,
        lastLatencyMs: Date.now() - startedAt,
      })
      return frameDataUrl
    } catch (error) {
      this.updateCameraStatus(cameraId, {
        status: 'degraded',
        lastCaptureAtIso: new Date().toISOString(),
        lastError: error instanceof Error ? error.message : String(error),
        lastLatencyMs: Date.now() - startedAt,
      })
      throw error
    }
  }

  private updateCameraStatus(cameraId: string, update: Partial<CameraRuntimeStatus>): void {
    const current = this.cameraStatuses.get(cameraId)
    if (!current) return
    const next = { ...current, ...update }
    this.cameraStatuses.set(cameraId, next)
    this.state.cameraStatuses = Array.from(this.cameraStatuses.values())
  }

  private async fetchBoundChannels(): Promise<Channel[]> {
    const summaries = await this.api.fetchChannels()
    const boundIds = new Set(this.config.bindings.map((binding) => binding.channelId))
    const channels = await Promise.all(
      summaries
        .filter((channel) => boundIds.has(channel.id))
        .map((channel) => this.api.fetchChannel(channel.id)),
    )
    return channels
  }

  private resolveCameraIdForChannel(channel: Channel): string {
    return channel.localAgentBinding?.cameraId
      ?? this.config.bindings.find((binding) => binding.channelId === channel.id)?.cameraId
      ?? this.config.defaultCameraId
  }

  private async sendHeartbeatsSafe(status: 'online' | 'scanning' | 'degraded' | 'offline', message?: string): Promise<void> {
    await Promise.all(this.config.bindings.map((binding) => this.sendHeartbeatSafe(binding.channelId, status, message)))
  }

  private async sendHeartbeatSafe(
    channelId: string,
    status: 'online' | 'scanning' | 'degraded' | 'offline',
    message?: string,
  ): Promise<void> {
    try {
      const cameraId = this.config.bindings.find((binding) => binding.channelId === channelId)?.cameraId ?? this.config.defaultCameraId
      const camera = this.config.cameras.find((item) => item.cameraId === cameraId)
      if (!camera) {
        return
      }

      await this.api.sendHeartbeat({
        channelId,
        deviceId: this.config.deviceId,
        deviceName: this.config.deviceName,
        cameraId: camera.cameraId,
        cameraLabel: camera.label,
        cameraSourceType: camera.source.type,
        cameraName: camera.source.type === 'usb-dshow' ? camera.source.name : this.config.cameraName,
        status,
        message,
      })
    } catch (error) {
      this.state.lastError = error instanceof Error ? error.message : String(error)
    }
  }
}
