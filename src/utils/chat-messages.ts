import type { Channel, Message } from '../types'

<<<<<<< HEAD
const BOOTSTRAP_SYSTEM_MESSAGE_PATTERNS = [
  /^ערוץ חדש נוצר ומוכן לשיחה\./,
  /^קבוצה חדשה נוצרה עם \d+ צ׳אטים מצורפים:/,
  /^נוצרה קבוצה «.*» עם \d+ ערוצים:/,
]

=======
>>>>>>> bc6fd7897cf748544dfe79db1218b867c9b6c83d
export function isVisibleAlertMessage(message: Message): boolean {
  return message.author === 'system' && message.alertLevel === 'critical'
}

export function isVisibleChatMessage(message: Message): boolean {
<<<<<<< HEAD
  if (!['user', 'ghost', 'system'].includes(message.author)) {
    return false
  }

  if (message.author !== 'system') {
    return true
  }

  return !BOOTSTRAP_SYSTEM_MESSAGE_PATTERNS.some((pattern) => pattern.test(message.text))
=======
  return ['user', 'ghost', 'system'].includes(message.author)
>>>>>>> bc6fd7897cf748544dfe79db1218b867c9b6c83d
}

export function getVisibleChannelMessages(channel: Pick<Channel, 'type' | 'messages'>): Message[] {
  return channel.messages.filter(isVisibleChatMessage)
}

export function getLastVisibleChannelMessage(channel: Pick<Channel, 'type' | 'messages'>): Message | undefined {
  const visibleMessages = getVisibleChannelMessages(channel)
  return visibleMessages.at(-1)
}
