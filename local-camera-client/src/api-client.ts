import type { LocalCameraConfig } from './config.js'
import type {
  AgentChannelSummary,
  CaptureWorkItem,
  Channel,
  LocalAgentConnectResponse,
  MessagePayload,
  Operation,
  OperationScanResult,
} from './types.js'

interface AuthResponse {
  accessToken?: string
  refreshToken?: string
  error?: string
}

export class GhostApiClient {
  private accessToken: string
  private refreshToken: string

  constructor(private readonly config: Pick<LocalCameraConfig, 'apiBaseUrl' | 'accessToken' | 'refreshToken'>) {
    this.accessToken = config.accessToken
    this.refreshToken = config.refreshToken
  }

  static async connect(
    apiBaseUrl: string,
    organizationName: string,
    deviceName: string,
    deviceId?: string,
  ): Promise<LocalAgentConnectResponse> {
    const response = await fetch(`${apiBaseUrl.replace(/\/+$/, '')}/api/local-agent/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationName, deviceName, deviceId }),
    })
    const payload = await response.json() as LocalAgentConnectResponse & { error?: string }
    if (!response.ok) {
      throw new Error(payload.error || `Connect failed with HTTP ${response.status}`)
    }
    return payload
  }

  getSession(): { accessToken: string; refreshToken: string } {
    return { accessToken: this.accessToken, refreshToken: this.refreshToken }
  }

  async fetchChannels(): Promise<Channel[]> {
    return this.request<Channel[]>('/api/channels')
  }

  async fetchChannel(channelId: string): Promise<Channel> {
    return this.request<Channel>(`/api/channels/${encodeURIComponent(channelId)}`)
  }

  async bindChannel(input: {
    channelId: string
    deviceId: string
    deviceName: string
    cameraId: string
    cameraLabel: string
    cameraSourceType: 'usb-dshow' | 'rtsp-ffmpeg' | 'hikvision-sdk'
    cameraName?: string
  }): Promise<{ channel: AgentChannelSummary }> {
    return this.post('/api/local-agent/bind', input)
  }

  async unbindChannel(channelId: string, deviceId: string): Promise<void> {
    await this.post('/api/local-agent/unbind', { channelId, deviceId })
  }

  async sendHeartbeat(input: {
    channelId: string
    deviceId: string
    deviceName: string
    cameraId: string
    cameraLabel: string
    cameraSourceType: 'usb-dshow' | 'rtsp-ffmpeg' | 'hikvision-sdk'
    cameraName?: string
    status: 'online' | 'scanning' | 'degraded' | 'offline'
    message?: string
  }): Promise<void> {
    await this.post('/api/local-agent/heartbeat', input)
  }

  async waitForNextWork(deviceId: string, waitMs: number): Promise<CaptureWorkItem | null> {
    const response = await this.request<{ work: CaptureWorkItem | null }>(
      `/api/local-agent/work/next?deviceId=${encodeURIComponent(deviceId)}&waitMs=${waitMs}`,
    )
    return response.work ?? null
  }

  async submitCaptureResult(
    workId: string,
    deviceId: string,
    cameraId: string,
    frameDataUrl: string,
    capturedAtIso: string,
  ): Promise<void> {
    await this.post(`/api/local-agent/work/${encodeURIComponent(workId)}/result`, {
      deviceId,
      cameraId,
      frameDataUrl,
      capturedAtIso,
    })
  }

  async scanOperations(channel: Channel, frameDataUrl: string, operations: Operation[]): Promise<OperationScanResult[]> {
    const payload = await this.post<{ results?: OperationScanResult[] }>('/api/operation-scan', {
      channel: {
        id: channel.id,
        name: channel.name,
        type: channel.type,
        watchScope: channel.watchScope,
        location: channel.location,
        members: channel.members,
      },
      frameDataUrl,
      operations: operations.map((op) => ({
        id: op.id,
        name: op.name,
        schedule: op.schedule,
        mode: op.mode,
        alertTrigger: op.trigger,
        action: op.action,
        modelOverride: op.modelOverride,
        detailLevel: op.detailLevel,
      })),
    })
    return payload.results ?? []
  }

  async saveMessage(channelId: string, message: MessagePayload): Promise<void> {
    await this.post(`/api/channels/${encodeURIComponent(channelId)}/messages`, message)
  }

  private async post<T = unknown>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await this.fetchOnce(path, init)
    if (response.status !== 401 || !this.refreshToken) {
      return this.readJson<T>(response)
    }

    await this.refreshAccessToken()
    return this.readJson<T>(await this.fetchOnce(path, init))
  }

  private async fetchOnce(path: string, init: RequestInit): Promise<Response> {
    const headers = new Headers(init.headers)
    if (!headers.has('Content-Type') && init.body != null) {
      headers.set('Content-Type', 'application/json')
    }
    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`)
    }
    return fetch(`${this.config.apiBaseUrl}${path}`, { ...init, headers })
  }

  private async refreshAccessToken(): Promise<void> {
    const response = await fetch(`${this.config.apiBaseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    })
    const payload = await response.json() as AuthResponse
    if (!response.ok || !payload.accessToken) {
      throw new Error(payload.error || 'Failed to refresh access token.')
    }
    this.accessToken = payload.accessToken
  }

  private async readJson<T>(response: Response): Promise<T> {
    const text = await response.text()
    const payload = text ? JSON.parse(text) as T & { error?: string } : undefined
    if (!response.ok) {
      throw new Error(payload?.error || `GHOST API request failed with HTTP ${response.status}.`)
    }
    return payload as T
  }
}
