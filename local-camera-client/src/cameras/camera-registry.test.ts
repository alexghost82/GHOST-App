// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { CameraRegistry } from './camera-registry.js'
import type { LocalCameraConfig } from '../config.js'

function buildConfig(): LocalCameraConfig {
  return {
    apiBaseUrl: 'http://localhost:3000',
    accessToken: 'a',
    refreshToken: 'r',
    username: 'user',
    deviceId: 'device-1',
    deviceName: 'Desk Agent',
    channelId: 'channel-1',
    channelName: 'Channel',
    cameras: [
      {
        cameraId: 'usb-1',
        label: 'USB One',
        source: { type: 'usb-dshow', name: 'USB One' },
        createdAtIso: '2026-05-03T10:00:00.000Z',
        updatedAtIso: '2026-05-03T10:00:00.000Z',
      },
      {
        cameraId: 'rtsp-1',
        label: 'RTSP One',
        source: { type: 'rtsp', url: 'rtsp://cam.local/stream' },
        createdAtIso: '2026-05-03T10:00:00.000Z',
        updatedAtIso: '2026-05-03T10:00:00.000Z',
      },
    ],
    bindings: [{ channelId: 'channel-1', cameraId: 'usb-1' }],
    defaultCameraId: 'usb-1',
    ffmpegPath: 'ffmpeg',
    pollIntervalMs: 15000,
    healthPort: 8791,
    maxParallelCaptures: 4,
    maxParallelFfmpegCaptures: 3,
    maxParallelHikvisionCaptures: 6,
    maxParallelPerCamera: 1,
    maxParallelPerHost: 1,
  }
}

describe('camera registry', () => {
  it('selects the correct adapter for usb and rtsp sources', () => {
    const registry = new CameraRegistry(buildConfig())
    expect(registry.resolveAdapter(registry.getCamera('usb-1').source).constructor.name).toBe('UsbDshowFfmpegAdapter')
    expect(registry.resolveAdapter(registry.getCamera('rtsp-1').source).constructor.name).toBe('RtspFfmpegAdapter')
  })
})
