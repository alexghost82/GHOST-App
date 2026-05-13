// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { captureFrameDataUrl } from './camera.js'
import type { LocalCameraConfig } from './config.js'

describe('captureFrameDataUrl', () => {
  it('preserves the data url contract for test frames', async () => {
    const config = {
      apiBaseUrl: 'http://localhost:3000',
      accessToken: 'a',
      refreshToken: 'b',
      username: 'user',
      deviceId: 'device-1',
      deviceName: 'Device',
      channelId: 'channel-1',
      channelName: 'Channel',
      cameras: [],
      bindings: [],
      defaultCameraId: 'cam-1',
      ffmpegPath: 'ffmpeg',
      pollIntervalMs: 15000,
      healthPort: 8791,
      maxParallelCaptures: 4,
      maxParallelFfmpegCaptures: 3,
      maxParallelHikvisionCaptures: 6,
      maxParallelPerCamera: 1,
      maxParallelPerHost: 1,
      testFrame: Buffer.from('jpeg-binary').toString('base64'),
    } as LocalCameraConfig

    const result = await captureFrameDataUrl({
      ...config,
      testFrame: `data:image/jpeg;base64,${config.testFrame}`,
    })

    expect(result.startsWith('data:image/jpeg;base64,')).toBe(true)
  })
})
