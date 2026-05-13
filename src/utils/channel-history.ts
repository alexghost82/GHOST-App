import type { Message } from '../types'

export function sortMessagesChronologically(messages: Message[]): Message[] {
  return [...messages].sort((left, right) => {
    if (left.createdAtIso && right.createdAtIso && left.createdAtIso !== right.createdAtIso) {
      return left.createdAtIso.localeCompare(right.createdAtIso)
    }
    if (left.time === right.time) {
      return left.id.localeCompare(right.id)
    }
    return left.time.localeCompare(right.time)
  })
}

export function mergeServerMessagesWithPending(
  serverMessages: Message[],
  pendingMessages: Message[],
  currentMessages: Message[] = [],
): Message[] {
  const mergedById = new Map<string, Message>()

  for (const serverMessage of serverMessages) {
    mergedById.set(serverMessage.id, {
      ...serverMessage,
      syncStatus: 'confirmed',
    })
  }

  for (const currentMessage of currentMessages) {
    if (!mergedById.has(currentMessage.id)) {
      mergedById.set(currentMessage.id, currentMessage)
    }
  }

  for (const pendingMessage of pendingMessages) {
    if (!mergedById.has(pendingMessage.id)) {
      mergedById.set(pendingMessage.id, pendingMessage)
    }
  }

  return sortMessagesChronologically([...mergedById.values()])
}
