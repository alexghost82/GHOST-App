import { z } from 'zod'

const CaptureProfileSchema = z.enum(['scan-low', 'scan-standard', 'chat-high'])
const CapturePurposeSchema = z.enum(['chat', 'timeline', 'preview'])

export const LocalAgentConnectSchema = z.object({
  organizationName: z.string().min(1).max(200),
  deviceName: z.string().min(1).max(160),
  deviceId: z.string().min(1).max(120).optional(),
})

export const LocalAgentProvisioningCreateSchema = z.object({
  channelId: z.string().min(1),
})

export const LocalAgentProvisioningConsumeSchema = z.object({
  token: z.string().min(16).max(240),
  deviceName: z.string().min(1).max(160),
  deviceId: z.string().min(1).max(120).optional(),
})

export const LocalAgentBindSchema = z.object({
  channelId: z.string().min(1),
  deviceId: z.string().min(1).max(120),
  deviceName: z.string().min(1).max(160),
  cameraId: z.string().min(1).max(120),
  cameraLabel: z.string().min(1).max(180),
  cameraSourceType: z.enum(['usb-dshow', 'rtsp', 'hikvision-sdk']),
  cameraName: z.string().min(1).max(180).optional(),
})

export const LocalAgentUnbindSchema = z.object({
  channelId: z.string().min(1),
  deviceId: z.string().min(1).max(120),
  cameraId: z.string().min(1).max(120).optional(),
})

const LocalCameraHealthSchema = z.object({
  cameraId: z.string().min(1).max(120),
  cameraLabel: z.string().min(1).max(180),
  sourceType: z.enum(['usb-dshow', 'rtsp', 'hikvision-sdk']),
  status: z.enum(['online', 'degraded', 'offline']),
  lastCaptureAtIso: z.string().min(1).optional(),
  lastSuccessfulCaptureAtIso: z.string().min(1).optional(),
  lastError: z.string().max(500).optional(),
  latencyMs: z.number().int().min(0).optional(),
})

export const LocalAgentHeartbeatSchema = z.object({
  channelId: z.string().min(1),
  deviceId: z.string().min(1).max(120),
  deviceName: z.string().min(1).max(160),
  cameraId: z.string().min(1).max(120),
  cameraLabel: z.string().min(1).max(180),
  cameraSourceType: z.enum(['usb-dshow', 'rtsp', 'hikvision-sdk']),
  cameraName: z.string().min(1).max(180).optional(),
  status: z.enum(['online', 'scanning', 'degraded', 'offline']),
  message: z.string().max(500).optional(),
  cameras: z.array(LocalCameraHealthSchema).optional(),
})

export const LocalAgentCaptureRequestSchema = z.object({
  channelId: z.string().min(1),
  profile: CaptureProfileSchema.default('scan-standard'),
  purpose: CapturePurposeSchema.default('chat'),
  timeoutMs: z.number().int().min(5_000).max(60_000).default(25_000),
})

export const LocalAgentWorkPollSchema = z.object({
  deviceId: z.string().min(1).max(120),
  waitMs: z.number().int().min(1_000).max(30_000).default(20_000),
})

export const LocalAgentWorkResultSchema = z.object({
  deviceId: z.string().min(1).max(120),
  cameraId: z.string().min(1).max(120),
  frameDataUrl: z.string().startsWith('data:image/'),
  capturedAtIso: z.string().min(1),
})

export type LocalAgentConnectRequest = z.infer<typeof LocalAgentConnectSchema>
export type LocalAgentProvisioningCreateRequest = z.infer<typeof LocalAgentProvisioningCreateSchema>
export type LocalAgentProvisioningConsumeRequest = z.infer<typeof LocalAgentProvisioningConsumeSchema>
export type LocalAgentBindRequest = z.infer<typeof LocalAgentBindSchema>
export type LocalAgentUnbindRequest = z.infer<typeof LocalAgentUnbindSchema>
export type LocalAgentHeartbeat = z.infer<typeof LocalAgentHeartbeatSchema>
export type LocalAgentCaptureRequest = z.infer<typeof LocalAgentCaptureRequestSchema>
export type LocalAgentWorkPollRequest = z.infer<typeof LocalAgentWorkPollSchema>
