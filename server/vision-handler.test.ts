import { describe, expect, it } from 'vitest'
import { formatConversationHistoryForPrompt } from './vision-handler'

describe('formatConversationHistoryForPrompt', () => {
  it('מסדר היסטוריה לפי author/time/text בלי שדות UI מקומיים', () => {
    const formatted = formatConversationHistoryForPrompt([
      {
        author: 'user',
        text: 'שלום',
        time: '10:00',
        createdAtIso: '2026-05-11T10:00:00.000Z',
      },
      {
        author: 'ghost',
        text: 'היי',
        time: '10:01',
      },
    ])

    expect(formatted).toContain('[2026-05-11T10:00:00.000Z] user: שלום')
    expect(formatted).toContain('[10:01] ghost: היי')
    expect(formatted).not.toContain('frameDataUrl')
    expect(formatted).not.toContain('syncStatus')
  })
})
