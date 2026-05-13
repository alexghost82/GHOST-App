import type { Channel, Operation, ParsedSchedule } from './types.js'

const TIMESLOT_WINDOW_MS = 12_000

export function getDueOperations(
  channels: Channel[],
  now: Date,
  lastRunByOperationId: Map<string, number>,
): Array<{ channel: Channel; operations: Operation[] }> {
  const nowMs = now.getTime()
  const dueByChannel: Array<{ channel: Channel; operations: Operation[] }> = []

  for (const channel of channels) {
    const operations = channel.operations.filter((operation) =>
      operation.enabled &&
      operation.parsedSchedule &&
      isScheduleDue(operation.parsedSchedule, now, lastRunByOperationId.get(operation.id) ?? 0, nowMs),
    )
    if (operations.length > 0) {
      dueByChannel.push({ channel, operations })
    }
  }

  return dueByChannel
}

export function markOperationsRan(operations: Operation[], ranAtMs: number, lastRunByOperationId: Map<string, number>): void {
  for (const operation of operations) {
    lastRunByOperationId.set(operation.id, ranAtMs)
  }
}

function isScheduleDue(schedule: ParsedSchedule, now: Date, lastRunMs: number, nowMs: number): boolean {
  if (schedule.type === 'interval') {
    return nowMs - lastRunMs >= schedule.intervalMs
  }

  const currentDay = now.getDay()
  const currentMs = now.getHours() * 3_600_000 + now.getMinutes() * 60_000 + now.getSeconds() * 1_000

  return schedule.slots.some((slot) => {
    if (slot.dayOfWeek !== null && slot.dayOfWeek !== currentDay) return false
    const slotMs = slot.hour * 3_600_000 + slot.minute * 60_000
    return Math.abs(currentMs - slotMs) < TIMESLOT_WINDOW_MS && nowMs - lastRunMs >= 60_000
  })
}

