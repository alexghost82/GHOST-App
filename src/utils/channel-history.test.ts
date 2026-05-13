import { describe, expect, it } from 'vitest'
import type { Message } from '../types'
import { mergeServerMessagesWithPending } from './channel-history'

function buildMessage(overrides: Partial<Message> & Pick<Message, 'id' | 'text' | 'time'>): Message {
  return {
    id: overrides.id,
    author: overrides.author ?? 'user',
    text: overrides.text,
    time: overrides.time,
    createdAtIso: overrides.createdAtIso,
    syncStatus: overrides.syncStatus,
    replyToMessageId: overrides.replyToMessageId,
    sources: overrides.sources,
    alertLevel: overrides.alertLevel,
    score: overrides.score,
    frameDataUrl: overrides.frameDataUrl,
  }
}

describe('mergeServerMessagesWithPending', () => {
  it('שומר היסטוריה מקומית ארוכה יותר כאשר רענון השרת חוזר מקוצר יותר', () => {
    const currentMessages = [
      buildMessage({ id: 'm1', text: 'first', time: '10:00', createdAtIso: '2026-05-11T10:00:00.000Z' }),
      buildMessage({ id: 'm2', text: 'second', time: '10:01', createdAtIso: '2026-05-11T10:01:00.000Z' }),
      buildMessage({ id: 'm3', text: 'third', time: '10:02', createdAtIso: '2026-05-11T10:02:00.000Z' }),
    ]
    const serverMessages = currentMessages.slice(1)

    const merged = mergeServerMessagesWithPending(serverMessages, [], currentMessages)

    expect(merged.map((message) => message.id)).toEqual(['m1', 'm2', 'm3'])
  })
})
