import { describe, expect, it, vi } from 'vitest'
import type { Channel } from '../types'
import { requestVisionReply, shouldAllowHistoryRecall } from './vision-chat'

const TEST_CHANNEL: Channel = {
  id: 'test-1',
  name: 'ערוץ בדיקה',
  type: 'personal',
  subtitle: 'מצלמה אישית',
  location: 'קומה 1',
  watchScope: 'תנועת אנשים',
  description: 'ערוץ בדיקות',
  memoryInterval: 30,
  rtspFeed: 'rtsp://',
  unread: 0,
  liveState: 'LIVE',
  members: ['ערוץ בדיקה'],
  messages: [],
  operations: [],
}

describe('requestVisionReply', () => {
  it('מחזיר תשובה תקינה מהשרת', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          text: 'זו תשובה אמיתית',
          sources: ['ערוץ בדיקה'],
        }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const reply = await requestVisionReply(TEST_CHANNEL, 'מה רואים?', 'data:image/webp;base64,AAAA')
    expect(reply.text).toBe('זו תשובה אמיתית')
    expect(reply.sources).toEqual(['ערוץ בדיקה'])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, requestInit] = fetchMock.mock.calls[0]
    const payload = JSON.parse(String(requestInit?.body)) as { allowHistoryRecall?: boolean }
    expect(payload.allowHistoryRecall).toBe(false)
  })

  it('זורק שגיאה כשהשרת מחזיר כישלון', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        text: async () =>
          JSON.stringify({
            error: 'כשל שרת',
          }),
      }),
    )

    await expect(requestVisionReply(TEST_CHANNEL, 'בדיקה', 'data:image/webp;base64,AAAA')).rejects.toThrow(
      'כשל שרת',
    )
  })

  it('מסמן allowHistoryRecall עבור בקשת זיכרון מפורשת', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          text: 'סיכום',
          sources: ['ערוץ בדיקה'],
        }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await requestVisionReply(TEST_CHANNEL, 'вспомни, что было раньше в этом чате', 'data:image/webp;base64,AAAA')

    const [, requestInit] = fetchMock.mock.calls[0]
    const payload = JSON.parse(String(requestInit?.body)) as { allowHistoryRecall?: boolean }
    expect(payload.allowHistoryRecall).toBe(true)
  })
})

describe('shouldAllowHistoryRecall', () => {
  it('מזהה בקשות זכירה מפורשות בכמה שפות', () => {
    expect(shouldAllowHistoryRecall('Please summarize the earlier chat history')).toBe(true)
    expect(shouldAllowHistoryRecall('вспомни, что было раньше')).toBe(true)
    expect(shouldAllowHistoryRecall('תסכם מה היה לפני זה')).toBe(true)
  })

  it('אינו מפעיל recall עבור בקשה רגילה', () => {
    expect(shouldAllowHistoryRecall('מה רואים עכשיו במצלמה?')).toBe(false)
  })
})
