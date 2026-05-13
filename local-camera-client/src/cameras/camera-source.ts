import type { CameraSource, CaptureProfile } from '../types.js'
import { maskRtspUrl } from './security/mask-url.js'
export { maskRtspUrl } from './security/mask-url.js'

export interface CaptureOptions {
  profile: CaptureProfile
  timeoutMs: number
  width?: number
  height?: number
}

export interface CameraTestResult {
  ok: boolean
  latencyMs?: number
  message?: string
}

export interface CaptureProfileDimensions {
  width: number
  height: number
}

export const CAPTURE_PROFILE_DIMENSIONS: Record<CaptureProfile, CaptureProfileDimensions> = {
  'scan-low': { width: 640, height: 360 },
  'scan-standard': { width: 960, height: 540 },
  'chat-high': { width: 1280, height: 720 },
  preview: { width: 640, height: 360 },
}

export function getCaptureDimensions(options: CaptureOptions): CaptureProfileDimensions {
  const fallback = CAPTURE_PROFILE_DIMENSIONS[options.profile]
  return {
    width: options.width ?? fallback.width,
    height: options.height ?? fallback.height,
  }
}

export function getCameraSourceHost(source: CameraSource): string | undefined {
  if (source.type === 'hikvision-sdk') {
    return source.host
  }
  if (source.type !== 'rtsp') {
    return undefined
  }

  try {
    return new URL(source.url).hostname || undefined
  } catch {
    return undefined
  }
}

export function describeCameraSource(source: CameraSource): string {
  switch (source.type) {
    case 'usb-dshow':
      return `USB camera "${source.name}"`
    case 'rtsp':
      return `RTSP camera ${maskRtspUrl(source.url)}`
    case 'hikvision-sdk':
      return `Hikvision camera ${source.username}@${source.host}:${source.port}/channel/${source.channel}`
  }
}
