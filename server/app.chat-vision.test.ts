import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { existsSync, mkdirSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { SQLiteAdminRepository } from './db/sqlite/sqlite-repository'

const TEST_DB_PATH = resolve(tmpdir(), 'ghost_test_chat_vision.db')
const ORIGINAL_OPENAI_API_KEY = process.env.OPENAI_API_KEY

function createTestRepo(): SQLiteAdminRepository {
  if (existsSync(TEST_DB_PATH)) unlinkSync(TEST_DB_PATH)
  mkdirSync(tmpdir(), { recursive: true })
  return new SQLiteAdminRepository(TEST_DB_PATH)
}

describe('/api/chat-vision history recall', () => {
  let repo: SQLiteAdminRepository

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-openai-key'
    repo = createTestRepo()
  })

  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.doUnmock('./queue-manager')
    process.env.OPENAI_API_KEY = ORIGINAL_OPENAI_API_KEY
    repo.close()
    if (existsSync(TEST_DB_PATH)) unlinkSync(TEST_DB_PATH)
  })

  async function bootstrapChannel() {
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
      location: 'קומה 1',
      watchScope: 'תנועה',
      description: '',
      memoryInterval: 30,
      rtspFeed: 'rtsp://',
      liveState: 'LIVE',
      cameraEnabled: false,
      linkedChannelIds: [],
      members: ['Operator'],
      isBlocked: false,
    })

    return { org, user, channel }
  }

  async function createTestApp() {
    const enqueueVisionChatMock = vi.fn(async (payload: unknown) => ({
      text: 'ok',
      sources: ['ערוץ בדיקה'],
      model: 'gpt-4.1-mini',
      detail: 'low',
    }))
    vi.doMock('./queue-manager', () => ({
      JobPriority: { CRITICAL: 1, NORMAL: 5, LOW: 10 },
      enqueueVisionChat: enqueueVisionChatMock,
      enqueueOperationScan: vi.fn(),
      getQueueHealth: vi.fn(async () => ({ mode: 'direct', counts: null, circuitBreaker: null, config: null })),
    }))
    const { createApp } = await import('./app')
    return { createApp, enqueueVisionChatMock }
  }

  function getChatVisionHandler(app: { router: { stack: Array<{ route?: { path?: string; methods?: Record<string, boolean>; stack?: Array<{ handle: Function }> } }> } }) {
    const routeLayer = app.router.stack.find((layer) => layer.route?.path === '/api/chat-vision' && layer.route.methods.post)
    const routeStack = routeLayer?.route?.stack ?? []
    return routeStack.at(-1)?.handle
  }

  it('לא מצרף history ל-AI כאשר allowHistoryRecall כבוי', async () => {
    const { org, user, channel } = await bootstrapChannel()
    const { createApp, enqueueVisionChatMock } = await createTestApp()
    const app = createApp(repo, { publish: () => undefined })
    const handler = getChatVisionHandler(app)
    expect(handler).toBeTypeOf('function')

    const jsonSpy = vi.fn()
    const statusSpy = vi.fn(() => ({ json: jsonSpy }))

    await handler({
      auth: {
        userId: user.id,
        organizationId: org.id,
        organizationName: org.name,
        role: user.role,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      body: {
        channel: {
          id: channel.id,
          name: channel.name,
          type: channel.type,
          watchScope: channel.watchScope,
          location: channel.location,
          members: channel.members,
        },
        prompt: 'מה רואים עכשיו?',
        frameDataUrl: 'data:image/webp;base64,AAAA',
        allowHistoryRecall: false,
      },
      params: {},
      query: {},
      header: () => undefined,
    }, {
      json: jsonSpy,
      status: statusSpy,
    }, vi.fn())

    expect(statusSpy).not.toHaveBeenCalled()
    expect(jsonSpy).toHaveBeenCalled()
    expect(enqueueVisionChatMock).toHaveBeenCalledTimes(1)
    const payload = enqueueVisionChatMock.mock.calls[0][0] as { conversationHistory?: unknown[] }
    expect(payload.conversationHistory).toBeUndefined()
  })

  it('טוען היסטוריית ערוץ מהשרת רק עבור בקשת recall מפורשת', async () => {
    const { org, user, channel } = await bootstrapChannel()
    await repo.addMessage(org.id, user.id, channel.id, {
      author: 'user',
      text: 'message-1',
      time: '10:00',
      frameDataUrl: 'data:image/png;base64,FRAME',
      sources: ['camera-a'],
    })
    await repo.addMessage(org.id, user.id, channel.id, {
      author: 'ghost',
      text: 'message-2',
      time: '10:01',
    })

    const { createApp, enqueueVisionChatMock } = await createTestApp()
    const app = createApp(repo, { publish: () => undefined })
    const handler = getChatVisionHandler(app)
    expect(handler).toBeTypeOf('function')

    const jsonSpy = vi.fn()
    const statusSpy = vi.fn(() => ({ json: jsonSpy }))

    await handler({
      auth: {
        userId: user.id,
        organizationId: org.id,
        organizationName: org.name,
        role: user.role,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      body: {
        channel: {
          id: channel.id,
          name: channel.name,
          type: channel.type,
          watchScope: channel.watchScope,
          location: channel.location,
          members: channel.members,
        },
        prompt: 'вспомни, что было раньше',
        frameDataUrl: 'data:image/webp;base64,AAAA',
        allowHistoryRecall: true,
      },
      params: {},
      query: {},
      header: () => undefined,
    }, {
      json: jsonSpy,
      status: statusSpy,
    }, vi.fn())

    expect(statusSpy).not.toHaveBeenCalled()
    expect(jsonSpy).toHaveBeenCalled()
    const payload = enqueueVisionChatMock.mock.calls[0][0] as {
      conversationHistory?: Array<Record<string, unknown>>
    }
    expect(payload.conversationHistory).toHaveLength(2)
    expect(payload.conversationHistory?.[0]).toMatchObject({
      author: 'user',
      text: 'message-1',
      time: '10:00',
    })
    expect(payload.conversationHistory?.[0]).not.toHaveProperty('frameDataUrl')
    expect(payload.conversationHistory?.[0]).not.toHaveProperty('sources')
  })
})
