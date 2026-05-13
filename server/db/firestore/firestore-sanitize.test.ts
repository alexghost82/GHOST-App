import { describe, expect, it } from 'vitest'
import { stripUndefinedDeep } from './firestore-sanitize'

describe('stripUndefinedDeep', () => {
  it('removes undefined fields from nested firestore payloads', () => {
    const result = stripUndefinedDeep({
      liveState: 'LIVE',
      localAgentStatus: {
        state: 'connected',
        lastHeartbeatAtIso: '2026-04-27T00:00:00.000Z',
        lastError: undefined,
      },
      localAgentBinding: {
        deviceId: 'device-1',
        cameraId: 'camera-1',
        cameraLabel: 'Integrated Webcam',
        cameraSourceType: 'usb-dshow',
        cameraName: 'Integrated Webcam',
        deviceName: 'Office Gateway',
        channelId: 'channel-1',
        boundAtIso: '2026-04-27T00:00:00.000Z',
      },
    })

    expect(result).toEqual({
      liveState: 'LIVE',
      localAgentStatus: {
        state: 'connected',
        lastHeartbeatAtIso: '2026-04-27T00:00:00.000Z',
      },
      localAgentBinding: {
        deviceId: 'device-1',
        cameraId: 'camera-1',
        cameraLabel: 'Integrated Webcam',
        cameraSourceType: 'usb-dshow',
        cameraName: 'Integrated Webcam',
        deviceName: 'Office Gateway',
        channelId: 'channel-1',
        boundAtIso: '2026-04-27T00:00:00.000Z',
      },
    })
  })
})
