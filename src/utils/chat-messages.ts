import type { Channel, Message } from '../types'

export function isVisibleAlertMessage(message: Message): boolean {
  return message.author === 'system' && message.alertLevel === 'critical'
}

export function isVisibleChatMessage(message: Message): boolean {
  return ['user', 'ghost', 'system'].includes(message.author)
}

export function getVisibleChannelMessages(channel: Pick<Channel, 'type' | 'messages'>): Message[] {
  return channel.messages.filter(isVisibleChatMessage)
}

export function getLastVisibleChannelMessage(channel: Pick<Channel, 'type' | 'messages'>): Message | undefined {
  const visibleMessages = getVisibleChannelMessages(channel)
  return visibleMessages.at(-1)
}
