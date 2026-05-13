import type { Channel, Message } from '../types'

const BOOTSTRAP_SYSTEM_MESSAGE_PATTERNS = [
  /^ערוץ חדש נוצר ומוכן לשיחה\./,
  /^קבוצה חדשה נוצרה עם \d+ צ׳אטים מצורפים:/,
  /^נוצרה קבוצה «.*» עם \d+ ערוצים:/,
]

export function isVisibleAlertMessage(message: Message): boolean {
  return message.author === 'system' && message.alertLevel === 'critical'
}

export function isVisibleChatMessage(message: Message): boolean {
  if (!['user', 'ghost', 'system'].includes(message.author)) {
    return false
  }

  if (message.author !== 'system') {
    return true
  }

  return !BOOTSTRAP_SYSTEM_MESSAGE_PATTERNS.some((pattern) => pattern.test(message.text))
}

export function getVisibleChannelMessages(channel: Pick<Channel, 'type' | 'messages'>): Message[] {
  return channel.messages.filter(isVisibleChatMessage)
}

export function getLastVisibleChannelMessage(channel: Pick<Channel, 'type' | 'messages'>): Message | undefined {
  const visibleMessages = getVisibleChannelMessages(channel)
  return visibleMessages.at(-1)
}
