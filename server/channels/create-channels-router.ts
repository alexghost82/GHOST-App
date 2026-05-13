import { Router } from 'express'
import { requireAuth } from '../middleware/auth-guard'
import { extractTenantContext } from '../middleware/tenant-context'
import type { IAdminRepository } from '../db/repository-types'
import type { IRealtimeHub } from '../realtime/realtime-hub-types'
import { syncOrganizationUsage } from '../admin/sync-org-usage'
import { normalizeChannelLocalAgentState } from '../local-agent/channel-state'
import {
  CreateChannelSchema,
  CreateMessageSchema,
  CreateOperationSchema,
  UpdateChannelSchema,
  UpdateOperationSchema,
} from './schemas'

interface ChannelsRouterDeps {
  store: IAdminRepository
  realtimeHub: IRealtimeHub
}

function userCanAccessChannel(
  user: { isActive: boolean; allowedChannelIds: string[]; blockedChannelIds: string[] },
  channelId: string,
): boolean {
  if (!user.isActive) {
    return false
  }
  if (user.blockedChannelIds.includes(channelId)) {
    return false
  }
  return user.allowedChannelIds.length === 0 || user.allowedChannelIds.includes(channelId)
}

function resolveMessageRecipientIds(
  store: IAdminRepository,
  organizationId: string,
  channelId: string,
  author: 'user' | 'ghost' | 'system',
  senderUserId: string,
): string[] {
  if (author !== 'system') {
    return [senderUserId]
  }

  const recipients = store
    .listUsersByOrganization(organizationId)
    .filter((user) => userCanAccessChannel(user, channelId))
    .map((user) => user.id)

  return recipients.length > 0 ? recipients : [senderUserId]
}

function publishUsageUpdated(realtimeHub: IRealtimeHub, organizationId: string, detail: Record<string, unknown> = {}): void {
  realtimeHub.publish({
    eventType: 'usage.updated',
    organizationId,
    severity: 'info',
    timestampIso: new Date().toISOString(),
    payload: detail,
  })
}

export function createChannelsRouter({ store, realtimeHub }: ChannelsRouterDeps): Router {
  const router = Router()
  router.use(requireAuth)

  router.get('/', async (req, res) => {
    try {
      const { organizationId, userId } = extractTenantContext(req)
      const channels = await store.listFullChannels(organizationId)
      const enriched = await Promise.all(
        channels.map(async (channel) => {
          const messages = await store.listMessages(organizationId, userId, channel.id)
          const operations = await store.listChannelOperations(organizationId, channel.id)
          return { ...normalizeChannelLocalAgentState(channel), messages, operations }
        }),
      )
      return res.json(enriched)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'שגיאה פנימית.'
      return res.status(500).json({ error: message })
    }
  })

  router.get('/:id', async (req, res) => {
    try {
      const { organizationId, userId } = extractTenantContext(req)
      const channel = await store.getFullChannel(organizationId, req.params.id)
      if (!channel) return res.status(404).json({ error: 'הערוץ לא נמצא.' })
      const messages = await store.listMessages(organizationId, userId, channel.id)
      const operations = await store.listChannelOperations(organizationId, channel.id)
      return res.json({ ...normalizeChannelLocalAgentState(channel), messages, operations })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'שגיאה פנימית.'
      return res.status(500).json({ error: message })
    }
  })

  router.post('/', async (req, res) => {
    try {
      const { organizationId } = extractTenantContext(req)
      const parsed = CreateChannelSchema.safeParse(req.body)
      if (!parsed.success) return res.status(400).json({ error: 'קלט לא תקין.', details: parsed.error.flatten() })
      const channel = await store.createFullChannel(organizationId, {
        ...parsed.data,
        captureMode: parsed.data.captureMode ?? 'browser',
      })
      await syncOrganizationUsage(store, organizationId)
      publishUsageUpdated(realtimeHub, organizationId, { action: 'channel.created', channelId: channel.id })
      return res.status(201).json(normalizeChannelLocalAgentState(channel))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'שגיאה פנימית.'
      return res.status(500).json({ error: message })
    }
  })

  router.patch('/:id', async (req, res) => {
    try {
      const { organizationId } = extractTenantContext(req)
      const parsed = UpdateChannelSchema.safeParse(req.body)
      if (!parsed.success) return res.status(400).json({ error: 'קלט לא תקין.', details: parsed.error.flatten() })
      const channel = await store.updateChannelData(organizationId, req.params.id, {
        ...parsed.data,
        localAgentBinding:
          parsed.data.localAgentBinding === null ? undefined : parsed.data.localAgentBinding,
        localAgentStatus:
          parsed.data.localAgentStatus === null ? undefined : parsed.data.localAgentStatus,
      })
      return res.json(normalizeChannelLocalAgentState(channel))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'שגיאה פנימית.'
      return res.status(500).json({ error: message })
    }
  })

  router.delete('/:id', async (req, res) => {
    try {
      const { organizationId } = extractTenantContext(req)
      await store.deleteFullChannel(organizationId, req.params.id)
      await syncOrganizationUsage(store, organizationId)
      publishUsageUpdated(realtimeHub, organizationId, { action: 'channel.deleted', channelId: req.params.id })
      return res.status(204).send()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'שגיאה פנימית.'
      return res.status(500).json({ error: message })
    }
  })

  router.post('/:id/messages', async (req, res) => {
    try {
      const { organizationId, userId } = extractTenantContext(req)
      const parsed = CreateMessageSchema.safeParse(req.body)
      if (!parsed.success) return res.status(400).json({ error: 'קלט לא תקין.', details: parsed.error.flatten() })

      const channel = await store.getFullChannel(organizationId, req.params.id)
      if (!channel) return res.status(404).json({ error: 'הערוץ לא נמצא.' })

      const recipientIds = resolveMessageRecipientIds(
        store,
        organizationId,
        channel.id,
        parsed.data.author,
        userId,
      )

      let record = null
      for (const recipientId of recipientIds) {
        const saved = await store.addMessage(organizationId, recipientId, channel.id, parsed.data)
        if (recipientId === userId || record === null) {
          record = saved
        }
      }

      await syncOrganizationUsage(store, organizationId)
      publishUsageUpdated(realtimeHub, organizationId, { action: 'message.created', channelId: req.params.id })
      return res.status(201).json(record)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'שגיאה פנימית.'
      return res.status(500).json({ error: message })
    }
  })

  router.post('/:id/operations', async (req, res) => {
    try {
      const { organizationId } = extractTenantContext(req)
      const parsed = CreateOperationSchema.safeParse(req.body)
      if (!parsed.success) return res.status(400).json({ error: 'קלט לא תקין.', details: parsed.error.flatten() })
      const record = await store.createChannelOperation(organizationId, req.params.id, parsed.data)
      await syncOrganizationUsage(store, organizationId)
      publishUsageUpdated(realtimeHub, organizationId, { action: 'operation.created', channelId: req.params.id })
      return res.status(201).json(record)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'שגיאה פנימית.'
      return res.status(500).json({ error: message })
    }
  })

  router.patch('/:id/operations/:opId', async (req, res) => {
    try {
      const { organizationId } = extractTenantContext(req)
      const parsed = UpdateOperationSchema.safeParse(req.body)
      if (!parsed.success) return res.status(400).json({ error: 'קלט לא תקין.', details: parsed.error.flatten() })
      const record = await store.updateChannelOperation(organizationId, req.params.id, req.params.opId, parsed.data)
      return res.json(record)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'שגיאה פנימית.'
      return res.status(500).json({ error: message })
    }
  })

  router.delete('/:id/operations/:opId', async (req, res) => {
    try {
      const { organizationId } = extractTenantContext(req)
      await store.deleteChannelOperation(organizationId, req.params.id, req.params.opId)
      await syncOrganizationUsage(store, organizationId)
      publishUsageUpdated(realtimeHub, organizationId, { action: 'operation.deleted', channelId: req.params.id })
      return res.status(204).send()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'שגיאה פנימית.'
      return res.status(500).json({ error: message })
    }
  })

  return router
}
