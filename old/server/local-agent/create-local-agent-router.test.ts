import { describe, expect, it } from 'vitest'
import { mapAgentStatusToLiveState } from './create-local-agent-router'

describe('mapAgentStatusToLiveState', () => {
  it('maps healthy local agent states to LIVE', () => {
    expect(mapAgentStatusToLiveState('online')).toBe('LIVE')
    expect(mapAgentStatusToLiveState('scanning')).toBe('LIVE')
  })

  it('maps failed local agent states to channel health states', () => {
    expect(mapAgentStatusToLiveState('degraded')).toBe('DEGRADED')
    expect(mapAgentStatusToLiveState('offline')).toBe('OFFLINE')
  })
})

