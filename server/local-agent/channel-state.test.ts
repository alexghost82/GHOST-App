import { describe, expect, it } from 'vitest'
import type { FullChannelRecord } from '../admin/types'
import { isChannelBoundToConnectedLocalAgent, normalizeChannelLocalAgentState } from './channel-state'

function buildChannel(overrides: Partial<FullChannelRecord> = {}): FullChannelRecord {
  return {
    id: 'channel-1',
    organizationId: 'org-1',
    name: 'Channel',
    type: 'personal',
    subtitle: '',
    location: '',
    watchScope: '',
    description: '',
    memoryInterval: 30,
    rtspFeed: 'rtsp://',
    liveState: 'OFFLINE',
    cameraEnabled: false,
    captureMode: 'local_agent',
    localAgentBinding: {
      deviceId: 'device-1',
      deviceName: 'Device',
      cameraId: 'camera-1',
      cameraLabel: 'Camera',
      cameraSourceType: 'usb-dshow',
      cameraName: 'Camera',
      channelId: 'channel-1',
      boundAtIso: '2026-04-26T18:00:00.000Z',
    },
    localAgentStatus: {
      state: 'degraded',
      lastHeartbeatAtIso: '2026-04-26T18:00:30.000Z',
      lastError: 'scan failed',
    },
    linkedChannelIds: [],
    members: [],
    isBlocked: false,
    createdAtIso: '2026-04-26T18:00:00.000Z',
    updatedAtIso: '2026-04-26T18:00:00.000Z',
    ...overrides,
  }
}

describe('local agent channel state', () => {
  it('keeps degraded local-agent channels available for capture while heartbeat is fresh', () => {
    const channel = buildChannel({
      localAgentStatus: {
        state: 'degraded',
        lastHeartbeatAtIso: '2026-04-26T18:00:58.000Z',
        lastError: 'scan failed',
      },
    })
    expect(normalizeChannelLocalAgentState(channel, Date.parse('2026-04-26T18:01:20.000Z'))).toMatchObject({
      captureMode: 'local_agent',
      localAgentStatus: { state: 'degraded' },
    })
    expect(isChannelBoundToConnectedLocalAgent(channel, Date.parse('2026-04-26T18:01:20.000Z'))).toBe(true)
  })

  it('treats stale local-agent channels as offline', () => {
    const channel = buildChannel()
    expect(isChannelBoundToConnectedLocalAgent(channel, Date.parse('2026-04-26T18:02:00.000Z'))).toBe(false)
  })
})
