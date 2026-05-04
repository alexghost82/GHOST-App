export type OperationMode = 'alert' | 'report' | 'rating' | 'assessment'
export type LiveState = 'LIVE' | 'SYNC' | 'DEGRADED' | 'OFFLINE'
export type CaptureMode = 'browser' | 'local_agent'
export type CameraSourceType = 'usb-dshow' | 'rtsp-ffmpeg' | 'hikvision-sdk'
export type CaptureProfile = 'scan-low' | 'scan-standard' | 'chat-high' | 'preview'

export type CameraSource =
  | {
      type: 'usb-dshow'
      name: string
    }
  | {
      type: 'rtsp-ffmpeg'
      url: string
      transport?: 'tcp' | 'udp'
      label?: string
    }
  | {
      type: 'hikvision-sdk'
      host: string
      port: number
      username: string
      passwordRef?: string
      password?: string
      channel: number
      label?: string
    }

export interface CameraDevice {
  id: string
  name: string
  label: string
  kind: 'video-input'
}

export interface IntervalSchedule {
  type: 'interval'
  intervalMs: number
}

export interface TimeSlot {
  dayOfWeek: number | null
  hour: number
  minute: number
}

export interface TimeSlotsSchedule {
  type: 'time-slots'
  slots: TimeSlot[]
}

export type ParsedSchedule = IntervalSchedule | TimeSlotsSchedule

export interface Operation {
  id: string
  name: string
  mode: OperationMode
  schedule: string
  trigger: string
  action: string
  modelOverride?: 'gpt-4.1' | 'gpt-4.1-mini'
  detailLevel?: 'low' | 'auto' | 'high'
  enabled: boolean
  parsedSchedule?: ParsedSchedule
}

export interface LocalAgentBinding {
  deviceId: string
  deviceName: string
  cameraId: string
  cameraLabel: string
  cameraSourceType: CameraSourceType
  cameraName?: string
  channelId: string
  boundAtIso: string
}

export interface LocalAgentStatus {
  state: 'connected' | 'degraded' | 'offline'
  lastHeartbeatAtIso: string
  lastError?: string
}

export interface CameraRuntimeStatus {
  cameraId: string
  label: string
  sourceType: CameraSourceType
  status: 'online' | 'degraded' | 'offline'
  lastCaptureAtIso?: string
  lastSuccessAtIso?: string
  lastError?: string
  lastLatencyMs?: number
}

export interface SavedCameraConfig {
  cameraId: string
  label: string
  source: CameraSource
  createdAtIso: string
  updatedAtIso: string
}

export interface DiscoveredCamera {
  id: string
  label: string
  sourceType: CameraSourceType
  host?: string
  port?: number
  model?: string
  serial?: string
  manufacturer?: string
  suggestedSource?: Partial<CameraSource>
  status: 'found' | 'requires-auth' | 'tested' | 'unreachable'
}

export interface Channel {
  id: string
  name: string
  type: 'personal' | 'group'
  location: string
  watchScope: string
  members: string[]
  liveState: LiveState
  captureMode?: CaptureMode
  cameraEnabled?: boolean
  localAgentBinding?: LocalAgentBinding
  localAgentStatus?: LocalAgentStatus
  operations: Operation[]
}

export interface OperationScanResult {
  operationId: string
  mode: OperationMode
  critical?: boolean
  score?: number
  summary: string
}

export interface MessagePayload {
  author: 'user' | 'ghost' | 'system'
  text: string
  time: string
  alertLevel?: 'critical' | 'routine' | 'report' | 'rating' | 'assessment'
  score?: number
  frameDataUrl?: string
  sources?: string[]
}

export interface AgentChannelSummary {
  id: string
  name: string
  type: 'personal' | 'group'
  liveState: LiveState
  captureMode?: CaptureMode
  cameraEnabled?: boolean
  localAgentBinding?: LocalAgentBinding
  localAgentStatus?: LocalAgentStatus
}

export interface LocalAgentConnectResponse {
  organizationId: string
  organizationName: string
  accessToken: string
  refreshToken: string
  profile: {
    username: string
  }
  deviceId: string
  channels: AgentChannelSummary[]
  priorBinding?: LocalAgentBinding
}

export interface CaptureWorkItem {
  id: string
  organizationId: string
  channelId: string
  deviceId: string
  cameraId: string
  profile: 'scan-low' | 'scan-standard' | 'chat-high'
  purpose: 'chat' | 'timeline' | 'preview'
  createdAtIso: string
  timeoutMs: number
}
