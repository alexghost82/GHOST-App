import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { existsSync, mkdirSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { createChannelsRouter } from './create-channels-router'
import { SQLiteAdminRepository } from '../db/sqlite/sqlite-repository'

const TEST_DB_PATH = resolve(tmpdir(), 'ghost_test_channels_router.db')

function createTestRepo(): SQLiteAdminRepository {
  if (existsSync(TEST_DB_PATH)) unlinkSync(TEST_DB_PATH)
  mkdirSync(tmpdir(), { recursive: true })
  return new SQLiteAdminRepository(TEST_DB_PATH)
}

describe('GET /api/channels', () => {
  let repo: SQLiteAdminRepository

  beforeEach(() => {
    repo = createTestRepo()
  })

  afterEach(() => {
    repo.close()
    if (existsSync(TEST_DB_PATH)) unlinkSync(TEST_DB_PATH)
  })

  it('מחזיר את כל היסטוריית ההודעות של הערוץ ולא רק 50 אחרונות', async () => {
    const org = repo.createOrganization({
      name: 'Test Org',
      limits: {
        maxChannels: 20,
        maxMessagesPerChannelPerMonth: 10000,
        monthlyChargeAmount: 499,
        maxAgentsTotalCost: 2000,
        maxAiTotalCost: 5000,
        maxApiTotalCost: 2500,
      },
    })
    const user = repo.createUser({
      organizationId: org.id,
      username: 'operator',
      passwordHash: 'hash',
      role: 'regular_user',
      allowedChannelIds: [],
      blockedChannelIds: [],
    })
    const channel = await repo.createFullChannel(org.id, {
      name: 'ערוץ בדיקה',
      type: 'personal',
      subtitle: '',
      location: '',
      watchScope: '',
      description: '',
      memoryInterval: 30,
      rtspFeed: 'rtsp://',
      liveState: 'LIVE',
      cameraEnabled: false,
      linkedChannelIds: [],
      members: [],
      isBlocked: false,
    })

    for (let index = 0; index < 55; index += 1) {
      await repo.addMessage(org.id, user.id, channel.id, {
        author: 'user',
        text: `message-${index + 1}`,
        time: `10:${String(index).padStart(2, '0')}`,
      })
    }

    const router = createChannelsRouter({ store: repo, realtimeHub: { publish: () => undefined } })
    const getRootHandler = router.stack.find((layer) => layer.route?.path === '/' && layer.route.methods.get)?.route?.stack[0]?.handle
    expect(getRootHandler).toBeTypeOf('function')

    const jsonSpy = vi.fn()
    const statusSpy = vi.fn(() => ({ json: jsonSpy }))
    const response = {
      json: jsonSpy,
      status: statusSpy,
    }

    await getRootHandler({
      auth: {
        userId: user.id,
        organizationId: org.id,
        organizationName: org.name,
        role: user.role,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      params: {},
      body: {},
      query: {},
      header: () => undefined,
    }, response, vi.fn())

    expect(statusSpy).not.toHaveBeenCalled()
    expect(jsonSpy).toHaveBeenCalledTimes(1)
    const payload = jsonSpy.mock.calls[0][0] as Array<{ id: string; messages: Array<{ text: string }> }>
    expect(payload).toHaveLength(1)
    expect(payload[0].id).toBe(channel.id)
    expect(payload[0].messages).toHaveLength(55)
    expect(payload[0].messages[0].text).toBe('message-1')
    expect(payload[0].messages.at(-1)?.text).toBe('message-55')
  })
})
