// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { normalizeSavedConfig } from './local-store.js'

describe('local store migration', () => {
  it('migrates legacy cameraName/channelId into cameras and bindings', () => {
    const result = normalizeSavedConfig({
      organizationId: 'org-1',
      organizationName: 'Org',
      apiBaseUrl: 'https://example.com',
      accessToken: 'a',
      refreshToken: 'r',
      username: 'user',
      deviceId: 'device-1',
      deviceName: 'Desk Agent',
      channelId: 'channel-1',
      channelName: 'Front Gate',
      cameraName: 'Integrated Webcam',
      boundAtIso: '2026-05-03T10:00:00.000Z',
      cameras: [],
      bindings: [],
    })

    expect(result.cameras).toHaveLength(1)
    expect(result.cameras[0].source).toEqual({ type: 'usb-dshow', name: 'Integrated Webcam' })
    expect(result.bindings).toEqual([{ channelId: 'channel-1', cameraId: result.cameras[0].cameraId }])
    expect(result.defaultCameraId).toBe(result.cameras[0].cameraId)
  })

  it('normalizes legacy rtsp-ffmpeg cameras to rtsp', () => {
    const result = normalizeSavedConfig({
      organizationId: 'org-1',
      organizationName: 'Org',
      apiBaseUrl: 'https://example.com',
      accessToken: 'a',
      refreshToken: 'r',
      username: 'user',
      deviceId: 'device-1',
      deviceName: 'Desk Agent',
      cameras: [
        {
          cameraId: 'rtsp-1',
          label: 'Yard',
          source: {
            type: 'rtsp-ffmpeg',
            url: 'rtsp://cam.local/stream',
          } as any,
          createdAtIso: '2026-05-03T10:00:00.000Z',
          updatedAtIso: '2026-05-03T10:00:00.000Z',
        },
      ],
      bindings: [{ channelId: 'channel-1', cameraId: 'rtsp-1' }],
    })

    expect(result.cameras[0].source).toEqual({
      type: 'rtsp',
      url: 'rtsp://cam.local/stream',
      transport: undefined,
      username: undefined,
      password: undefined,
    })
    expect(result.cameras[0].enabled).toBe(true)
  })
})
