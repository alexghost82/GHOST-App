import { describe, expect, it } from 'vitest'
import { LocalAgentCaptureBroker } from './capture-broker'

describe('LocalAgentCaptureBroker', () => {
  it('preserves cameraId on queued work and validates result camera identity', async () => {
    const broker = new LocalAgentCaptureBroker()
    const pending = broker.requestCapture({
      organizationId: 'org-1',
      channelId: 'channel-1',
      deviceId: 'device-1',
      cameraId: 'camera-7',
      profile: 'scan-low',
      purpose: 'chat',
      timeoutMs: 5000,
    })

    const work = await broker.waitForWork('device-1', 1000)
    expect(work?.cameraId).toBe('camera-7')
    expect(() => broker.submitResult(work!.id, 'device-1', 'other-camera', 'data:image/jpeg;base64,abc', new Date().toISOString()))
      .toThrow('Capture result camera mismatch.')

    broker.submitResult(work!.id, 'device-1', 'camera-7', 'data:image/jpeg;base64,abc', new Date().toISOString())
    await expect(pending).resolves.toEqual(expect.objectContaining({
      frameDataUrl: 'data:image/jpeg;base64,abc',
    }))
  })
})
