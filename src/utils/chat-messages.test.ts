import { describe, expect, it } from 'vitest'
import type { Channel, Message } from '../types'
import { getLastVisibleChannelMessage, getVisibleChannelMessages, isVisibleChatMessage } from './chat-messages'

function buildMessage(partial: Partial<Message> & Pick<Message, 'id' | 'author' | 'text' | 'time'>): Message {
  return {
    ...partial,
  }
}

function buildChannel(messages: Message[], type: Channel['type'] = 'personal'): Pick<Channel, 'type' | 'messages'> {
  return { type, messages }
}

describe('chat message visibility helpers', () => {
  it('keeps system messages visible in the chat stream', () => {
    expect(
      isVisibleChatMessage(buildMessage({ id: '1', author: 'system', text: 'scan ok', time: '10:00', alertLevel: 'routine' })),
    ).toBe(true)
    expect(
      isVisibleChatMessage(buildMessage({ id: '2', author: 'system', text: 'critical', time: '10:01', alertLevel: 'critical' })),
    ).toBe(true)
  })

  it('hides bootstrap system messages so a fresh channel can render the empty state', () => {
    expect(
      isVisibleChatMessage(
        buildMessage({
          id: 'intro-1',
          author: 'system',
          text: 'ערוץ חדש נוצר ומוכן לשיחה. אפשר לעדכן RTSP, זיכרון ומבצעים בפאנל הימני.',
          time: '10:00',
        }),
      ),
    ).toBe(false)

    expect(
      isVisibleChatMessage(
        buildMessage({
          id: 'intro-2',
          author: 'system',
          text: 'קבוצה חדשה נוצרה עם 2 צ׳אטים מצורפים: ערוץ א · ערוץ ב. אפשר לעדכן RTSP, זיכרון ומבצעים בפאנל הימני.',
          time: '10:01',
        }),
      ),
    ).toBe(false)
  })

  it('keeps all ghost replies in personal channels', () => {
    const messages = [
      buildMessage({ id: 'u1', author: 'user', text: 'hello', time: '10:00' }),
      buildMessage({ id: 'g1', author: 'ghost', text: 'old', time: '10:01', replyToMessageId: 'u1' }),
      buildMessage({ id: 'g2', author: 'ghost', text: 'new', time: '10:02', replyToMessageId: 'u1' }),
    ]

    const visible = getVisibleChannelMessages(buildChannel(messages))
    expect(visible.map((message) => message.id)).toEqual(['u1', 'g1', 'g2'])
  })

  it('does not dedupe ghost replies in group channels', () => {
    const messages = [
      buildMessage({ id: 'u1', author: 'user', text: 'hello', time: '10:00' }),
      buildMessage({ id: 'g1', author: 'ghost', text: 'camera a', time: '10:01', replyToMessageId: 'u1' }),
      buildMessage({ id: 'g2', author: 'ghost', text: 'camera b', time: '10:02', replyToMessageId: 'u1' }),
    ]

    const visible = getVisibleChannelMessages(buildChannel(messages, 'group'))
    expect(visible.map((message) => message.id)).toEqual(['u1', 'g1', 'g2'])
  })

  it('returns the last raw system message when it is the latest chat event', () => {
    const lastMessage = getLastVisibleChannelMessage(
      buildChannel([
        buildMessage({ id: 'u1', author: 'user', text: 'hi', time: '10:00' }),
        buildMessage({ id: 's1', author: 'system', text: 'scan ok', time: '10:01', alertLevel: 'routine' }),
      ]),
    )

    expect(lastMessage?.id).toBe('s1')
  })
})
