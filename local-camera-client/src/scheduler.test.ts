// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { getDueOperations, markOperationsRan } from './scheduler'
import type { Channel, Operation } from './types'

function channelWith(operation: Operation): Channel {
  return {
    id: 'channel-1',
    name: 'Gate',
    type: 'personal',
    location: 'North',
    watchScope: 'Entrance',
    members: [],
    liveState: 'LIVE',
    operations: [operation],
  }
}

describe('local camera scheduler', () => {
  it('returns interval operations when their interval has elapsed', () => {
    const operation: Operation = {
      id: 'op-1',
      name: 'Person check',
      mode: 'alert',
      schedule: 'every minute',
      trigger: 'person',
      action: '',
      enabled: true,
      parsedSchedule: { type: 'interval', intervalMs: 60_000 },
    }
    const lastRun = new Map<string, number>([['op-1', Date.parse('2026-04-26T09:00:00.000Z')]])

    const due = getDueOperations([channelWith(operation)], new Date('2026-04-26T09:01:01.000Z'), lastRun)

    expect(due).toHaveLength(1)
    expect(due[0].operations[0].id).toBe('op-1')
  })

  it('does not return disabled or not-yet-due operations', () => {
    const operation: Operation = {
      id: 'op-1',
      name: 'Person check',
      mode: 'alert',
      schedule: 'every minute',
      trigger: 'person',
      action: '',
      enabled: true,
      parsedSchedule: { type: 'interval', intervalMs: 60_000 },
    }
    const lastRun = new Map<string, number>([['op-1', Date.parse('2026-04-26T09:00:30.000Z')]])

    const due = getDueOperations([channelWith(operation)], new Date('2026-04-26T09:00:45.000Z'), lastRun)

    expect(due).toHaveLength(0)
  })

  it('records successful operation runs', () => {
    const operation = { id: 'op-1' } as Operation
    const lastRun = new Map<string, number>()

    markOperationsRan([operation], 123, lastRun)

    expect(lastRun.get('op-1')).toBe(123)
  })
})

