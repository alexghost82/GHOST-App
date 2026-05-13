import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MessageRecord } from '../../admin/types'

const MESSAGE_ROWS: MessageRecord[] = []

function buildMessagesQuery() {
  let beforeIso: string | undefined
  let limitValue: number | undefined

  const query = {
    orderBy: vi.fn(() => query),
    where: vi.fn((_field: string, _operator: string, value: string) => {
      beforeIso = value
      return query
    }),
    limit: vi.fn((value: number) => {
      limitValue = value
      return query
    }),
    get: vi.fn(async () => {
      let rows = [...MESSAGE_ROWS].sort((left, right) => right.createdAtIso.localeCompare(left.createdAtIso))
      if (beforeIso) {
        rows = rows.filter((row) => row.createdAtIso < beforeIso)
      }
      if (limitValue != null) {
        rows = rows.slice(0, limitValue)
      }
      return {
        docs: rows.map((row) => ({
          data: () => row,
        })),
      }
    }),
  }
  return query
}

function createAdminDbMock() {
  return {
    collection: vi.fn((name: string) => {
      if (name !== 'organizations') {
        throw new Error(`Unexpected collection: ${name}`)
      }
      return {
        doc: vi.fn(() => ({
          collection: vi.fn((childName: string) => {
            if (childName !== 'users') {
              throw new Error(`Unexpected child collection: ${childName}`)
            }
            return {
              doc: vi.fn(() => ({
                collection: vi.fn((grandChildName: string) => {
                  if (grandChildName !== 'channel_data') {
                    throw new Error(`Unexpected grandchild collection: ${grandChildName}`)
                  }
                  return {
                    doc: vi.fn(() => ({
                      collection: vi.fn((messagesName: string) => {
                        if (messagesName !== 'messages') {
                          throw new Error(`Unexpected nested collection: ${messagesName}`)
                        }
                        return buildMessagesQuery()
                      }),
                    })),
                  }
                }),
              })),
            }
          }),
        })),
      }
    }),
  }
}

describe('FirestoreAdminRepository listMessages', () => {
  beforeEach(() => {
    MESSAGE_ROWS.length = 0
    vi.resetModules()
  })

  it('מחזיר את כל ההיסטוריה כאשר לא מוגדר limit', async () => {
    const baseTime = Date.parse('2026-05-11T10:00:00.000Z')
    for (let index = 0; index < 205; index += 1) {
      MESSAGE_ROWS.push({
        id: `m${index + 1}`,
        organizationId: 'org-1',
        userId: 'user-1',
        channelId: 'channel-1',
        author: 'user',
        text: `message-${index + 1}`,
        time: `10:${String(index).padStart(2, '0')}`,
        createdAtIso: new Date(baseTime + index * 1_000).toISOString(),
      })
    }

    vi.doMock('../../lib/firebase-admin', () => ({
      adminDb: createAdminDbMock(),
    }))

    const { FirestoreAdminRepository } = await import('./firestore-repository')
    const repo = new FirestoreAdminRepository()

    const messages = await repo.listMessages('org-1', 'user-1', 'channel-1')

    expect(messages).toHaveLength(205)
    expect(messages[0].text).toBe('message-1')
    expect(messages.at(-1)?.text).toBe('message-205')
  })

  it('מכבד limit מפורש ועדיין מחזיר סדר כרונולוגי עולה', async () => {
    MESSAGE_ROWS.push(
      {
        id: 'm1',
        organizationId: 'org-1',
        userId: 'user-1',
        channelId: 'channel-1',
        author: 'user',
        text: 'first',
        time: '10:00',
        createdAtIso: '2026-05-11T10:00:00.000Z',
      },
      {
        id: 'm2',
        organizationId: 'org-1',
        userId: 'user-1',
        channelId: 'channel-1',
        author: 'user',
        text: 'second',
        time: '10:01',
        createdAtIso: '2026-05-11T10:01:00.000Z',
      },
      {
        id: 'm3',
        organizationId: 'org-1',
        userId: 'user-1',
        channelId: 'channel-1',
        author: 'user',
        text: 'third',
        time: '10:02',
        createdAtIso: '2026-05-11T10:02:00.000Z',
      },
    )

    vi.doMock('../../lib/firebase-admin', () => ({
      adminDb: createAdminDbMock(),
    }))

    const { FirestoreAdminRepository } = await import('./firestore-repository')
    const repo = new FirestoreAdminRepository()

    const messages = await repo.listMessages('org-1', 'user-1', 'channel-1', { limit: 2 })

    expect(messages.map((message) => message.text)).toEqual(['second', 'third'])
  })
})
