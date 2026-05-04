import { randomBytes, randomUUID } from 'node:crypto'
import { Router } from 'express'
import type { AuthAccessPayload } from '../auth/jwt-service'
import { signAccessToken, signRefreshToken } from '../auth/jwt-service'
import type { FullChannelRecord, UserRecord } from '../admin/types'
import type { IAdminRepository } from '../db/repository-types'
import { requireAuth } from '../middleware/auth-guard'
import { extractTenantContext } from '../middleware/tenant-context'
import type { IRealtimeHub } from '../realtime/realtime-hub-types'
import { hashPassword } from '../security/crypto-utils'
import { LocalAgentCaptureBroker } from './capture-broker'
import { isChannelBoundToConnectedLocalAgent, normalizeChannelLocalAgentState } from './channel-state'
import {
  LocalAgentBindSchema,
  LocalAgentCaptureRequestSchema,
  LocalAgentConnectSchema,
  LocalAgentHeartbeatSchema,
  LocalAgentWorkResultSchema,
  LocalAgentWorkPollSchema,
  LocalAgentUnbindSchema,
  type LocalAgentHeartbeat,
} from './schemas'

interface LocalAgentRouterDeps {
  store: IAdminRepository
  realtimeHub: IRealtimeHub
  captureBroker: LocalAgentCaptureBroker
}

type LiveState = 'LIVE' | 'SYNC' | 'DEGRADED' | 'OFFLINE'

function buildAuthPayload(user: UserRecord, store: IAdminRepository): AuthAccessPayload {
  const org = store.getOrganizationById(user.organizationId)
  return {
    userId: user.id,
    organizationId: user.organizationId,
    organizationName: org?.name ?? '',
    role: user.role,
    username: user.username,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
  }
}

export function mapAgentStatusToLiveState(status: LocalAgentHeartbeat['status']): LiveState {
  switch (status) {
    case 'online':
    case 'scanning':
      return 'LIVE'
    case 'degraded':
      return 'DEGRADED'
    case 'offline':
      return 'OFFLINE'
  }
}

function publishLocalAgentEvent(
  realtimeHub: IRealtimeHub,
  organizationId: string,
  payload: Record<string, unknown>,
  severity: 'info' | 'warning' | 'error' = 'info',
): void {
  realtimeHub.publish({
    eventType: 'org.health.changed',
    organizationId,
    severity,
    timestampIso: new Date().toISOString(),
    payload,
  })
}

function buildChannelSummary(channel: FullChannelRecord) {
  const normalized = normalizeChannelLocalAgentState(channel)
  return {
    id: normalized.id,
    name: normalized.name,
    type: normalized.type,
    liveState: normalized.liveState,
    cameraEnabled: normalized.cameraEnabled,
    captureMode: normalized.captureMode ?? 'browser',
    localAgentBinding: normalized.localAgentBinding,
    localAgentStatus: normalized.localAgentStatus,
  }
}

async function findBoundChannelByDeviceId(
  store: IAdminRepository,
  organizationId: string,
  deviceId: string,
): Promise<FullChannelRecord | undefined> {
  const channels = await store.listFullChannels(organizationId)
  return channels.find((channel) => channel.localAgentBinding?.deviceId === deviceId)
}

async function hasBoundChannelForDeviceId(
  store: IAdminRepository,
  organizationId: string,
  deviceId: string,
): Promise<boolean> {
  return Boolean(await findBoundChannelByDeviceId(store, organizationId, deviceId))
}

async function issueAgentSession(
  store: IAdminRepository,
  organizationName: string,
  deviceName: string,
  deviceId?: string,
): Promise<{
  organizationId: string
  organizationName: string
  accessToken: string
  refreshToken: string
  profile: AuthAccessPayload
  deviceId: string
  channels: ReturnType<typeof buildChannelSummary>[]
  priorBinding?: FullChannelRecord['localAgentBinding']
}> {
  const org = store
    .listOrganizations()
    .find((candidate) => candidate.name.toLowerCase() === organizationName.trim().toLowerCase())
  if (!org) {
    throw new Error(`Organization "${organizationName}" not found.`)
  }
  if (org.status !== 'active') {
    throw new Error(`Organization "${org.name}" is suspended.`)
  }

  const resolvedDeviceId = deviceId?.trim() || `ghost-agent-${randomUUID().substring(0, 8)}`
  const agentUsername = `agent_${resolvedDeviceId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24)}_${randomUUID().substring(0, 6)}`
  const user = store.createUser({
    organizationId: org.id,
    username: agentUsername,
    firstName: 'Local',
    lastName: deviceName,
    passwordHash: hashPassword(randomBytes(24).toString('hex')),
    role: 'regular_user',
    allowedChannelIds: [],
    blockedChannelIds: [],
  })

  const tokenId = randomUUID()
  const accessToken = signAccessToken(buildAuthPayload(user, store))
  const { token: refreshToken, expiresAtUnix } = signRefreshToken({ tokenId, userId: user.id })
  store.storeRefreshToken({ tokenId, userId: user.id, expiresAtUnix })
  store.updateUserLastLogin(user.id, new Date().toISOString())

  const channels = (await store.listFullChannels(org.id)).map(buildChannelSummary)
  const priorBinding = channels.find((channel) => channel.localAgentBinding?.deviceId === resolvedDeviceId)?.localAgentBinding

  return {
    organizationId: org.id,
    organizationName: org.name,
    accessToken,
    refreshToken,
    profile: buildAuthPayload(user, store),
    deviceId: resolvedDeviceId,
    channels,
    priorBinding,
  }
}

export function createLocalAgentRouter({ store, realtimeHub, captureBroker }: LocalAgentRouterDeps): Router {
  const router = Router()

  router.post('/connect', async (req, res) => {
    try {
      const parsed = LocalAgentConnectSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid local agent connect request.', details: parsed.error.flatten() })
      }

      const payload = await issueAgentSession(
        store,
        parsed.data.organizationName,
        parsed.data.deviceName,
        parsed.data.deviceId,
      )
      return res.status(201).json(payload)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Local agent connect failed.'
      const code = message.includes('not found') ? 404 : message.includes('suspended') ? 403 : 500
      return res.status(code).json({ error: message })
    }
  })

  router.use(requireAuth)

  router.post('/bind', async (req, res) => {
    try {
      const { organizationId } = extractTenantContext(req)
      const parsed = LocalAgentBindSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid local agent bind request.', details: parsed.error.flatten() })
      }

      const channel = await store.getFullChannel(organizationId, parsed.data.channelId)
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found.' })
      }
      if (channel.type !== 'personal') {
        return res.status(400).json({ error: 'Only personal channels can be bound to a local client.' })
      }

      const boundAtIso = new Date().toISOString()
      const updated = await store.updateChannelData(organizationId, channel.id, {
        captureMode: 'local_agent',
        cameraEnabled: false,
        liveState: 'OFFLINE',
        localAgentBinding: {
          deviceId: parsed.data.deviceId,
          deviceName: parsed.data.deviceName,
          cameraId: parsed.data.cameraId,
          cameraLabel: parsed.data.cameraLabel,
          cameraSourceType: parsed.data.cameraSourceType,
          cameraName: parsed.data.cameraName,
          channelId: channel.id,
          boundAtIso,
        },
        localAgentStatus: {
          state: 'offline',
          lastHeartbeatAtIso: boundAtIso,
        },
      })

      publishLocalAgentEvent(realtimeHub, organizationId, {
        action: 'local-agent.bound',
        channelId: updated.id,
        deviceId: parsed.data.deviceId,
        deviceName: parsed.data.deviceName,
        cameraId: parsed.data.cameraId,
        cameraLabel: parsed.data.cameraLabel,
        cameraSourceType: parsed.data.cameraSourceType,
      })

      return res.json({ ok: true, channel: buildChannelSummary(updated) })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Local agent bind failed.'
      return res.status(500).json({ error: message })
    }
  })

  router.post('/unbind', async (req, res) => {
    try {
      const { organizationId } = extractTenantContext(req)
      const parsed = LocalAgentUnbindSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid local agent unbind request.', details: parsed.error.flatten() })
      }

      const channel = await store.getFullChannel(organizationId, parsed.data.channelId)
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found.' })
      }
      if (channel.localAgentBinding?.deviceId !== parsed.data.deviceId) {
        return res.status(409).json({ error: 'This channel is not bound to the specified device.' })
      }
      if (
        parsed.data.cameraId
        && channel.localAgentBinding?.cameraId
        && channel.localAgentBinding.cameraId !== parsed.data.cameraId
      ) {
        return res.status(409).json({ error: 'This channel is not bound to the specified camera.' })
      }

      const updated = await store.updateChannelData(organizationId, channel.id, {
        captureMode: 'browser',
        cameraEnabled: false,
        localAgentBinding: undefined,
        localAgentStatus: undefined,
        liveState: 'OFFLINE',
      })

      publishLocalAgentEvent(realtimeHub, organizationId, {
        action: 'local-agent.unbound',
        channelId: updated.id,
        deviceId: parsed.data.deviceId,
      }, 'warning')

      return res.json({ ok: true, channel: buildChannelSummary(updated) })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Local agent unbind failed.'
      return res.status(500).json({ error: message })
    }
  })

  router.post('/heartbeat', async (req, res) => {
    try {
      const { organizationId } = extractTenantContext(req)
      const parsed = LocalAgentHeartbeatSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Local agent heartbeat payload is invalid.', details: parsed.error.flatten() })
      }

      const channel = await store.getFullChannel(organizationId, parsed.data.channelId)
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found.' })
      }
      if (channel.localAgentBinding?.deviceId !== parsed.data.deviceId) {
        return res.status(409).json({ error: 'This channel is not bound to the specified device.' })
      }
      if (
        channel.localAgentBinding?.cameraId
        && channel.localAgentBinding.cameraId !== parsed.data.cameraId
      ) {
        return res.status(409).json({ error: 'This channel is not bound to the specified camera.' })
      }

      const heartbeatAtIso = new Date().toISOString()
      const liveState = mapAgentStatusToLiveState(parsed.data.status)
      const updated = await store.updateChannelData(organizationId, channel.id, {
        cameraEnabled: parsed.data.status === 'online' || parsed.data.status === 'scanning',
        liveState,
        localAgentBinding: {
          deviceId: parsed.data.deviceId,
          deviceName: parsed.data.deviceName,
          cameraId: parsed.data.cameraId,
          cameraLabel: parsed.data.cameraLabel,
          cameraSourceType: parsed.data.cameraSourceType,
          cameraName: parsed.data.cameraName,
          channelId: channel.id,
          boundAtIso: channel.localAgentBinding?.boundAtIso ?? heartbeatAtIso,
        },
        localAgentStatus: {
          state:
            parsed.data.status === 'degraded'
              ? 'degraded'
              : parsed.data.status === 'offline'
                ? 'offline'
                : 'connected',
          lastHeartbeatAtIso: heartbeatAtIso,
          cameras: parsed.data.cameras,
          ...(parsed.data.message ? { lastError: parsed.data.message } : {}),
        },
      })

      publishLocalAgentEvent(realtimeHub, organizationId, {
        action: 'local-agent.heartbeat',
        channelId: updated.id,
        deviceId: parsed.data.deviceId,
        deviceName: parsed.data.deviceName,
        cameraId: parsed.data.cameraId,
        cameraLabel: parsed.data.cameraLabel,
        cameraSourceType: parsed.data.cameraSourceType,
        state: updated.localAgentStatus?.state ?? 'offline',
        liveState,
        message: parsed.data.message,
        cameras: parsed.data.cameras,
      }, parsed.data.status === 'degraded' || parsed.data.status === 'offline' ? 'warning' : 'info')

      return res.json({
        ok: true,
        channel: buildChannelSummary(updated),
        heartbeatAtIso,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Local agent heartbeat failed.'
      return res.status(500).json({ error: message })
    }
  })

  router.post('/capture-request', async (req, res) => {
    try {
      const { organizationId } = extractTenantContext(req)
      const parsed = LocalAgentCaptureRequestSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid local agent capture request.', details: parsed.error.flatten() })
      }

      const channel = await store.getFullChannel(organizationId, parsed.data.channelId)
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found.' })
      }

      const normalized = normalizeChannelLocalAgentState(channel)
      if (normalized.captureMode !== 'local_agent' || !normalized.localAgentBinding) {
        return res.status(409).json({ error: 'This channel is not configured to use a local client.' })
      }
      if (!isChannelBoundToConnectedLocalAgent(normalized)) {
        return res.status(409).json({ error: 'The bound local client is offline. Please reconnect that client.' })
      }

      const result = await captureBroker.requestCapture({
        organizationId,
        channelId: normalized.id,
        deviceId: normalized.localAgentBinding.deviceId,
        cameraId: normalized.localAgentBinding.cameraId,
        profile: parsed.data.profile,
        purpose: parsed.data.purpose,
        timeoutMs: parsed.data.timeoutMs,
      })

      return res.json({
        ok: true,
        frameDataUrl: result.frameDataUrl,
        capturedAtIso: result.capturedAtIso,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Local agent capture request failed.'
      const code = message.includes('timed out') ? 504 : 500
      return res.status(code).json({ error: message })
    }
  })

  router.get('/work/next', async (req, res) => {
    try {
      const { organizationId } = extractTenantContext(req)
      const parsed = LocalAgentWorkPollSchema.safeParse({
        deviceId: req.query.deviceId,
        waitMs: req.query.waitMs ? Number(req.query.waitMs) : undefined,
      })
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid local agent work poll request.', details: parsed.error.flatten() })
      }

      if (!await hasBoundChannelForDeviceId(store, organizationId, parsed.data.deviceId)) {
        return res.status(403).json({ error: 'This device is not currently bound to any channel.' })
      }

      const work = await captureBroker.waitForWork(parsed.data.deviceId, parsed.data.waitMs)
      return res.json({ work })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Local agent work poll failed.'
      return res.status(500).json({ error: message })
    }
  })

  router.post('/work/:workId/result', async (req, res) => {
    try {
      const { organizationId } = extractTenantContext(req)
      const parsed = LocalAgentWorkResultSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid local agent work result payload.', details: parsed.error.flatten() })
      }

      if (!await hasBoundChannelForDeviceId(store, organizationId, parsed.data.deviceId)) {
        return res.status(403).json({ error: 'This device is not currently bound to any channel.' })
      }

      captureBroker.submitResult(
        req.params.workId,
        parsed.data.deviceId,
        parsed.data.cameraId,
        parsed.data.frameDataUrl,
        parsed.data.capturedAtIso,
      )

      return res.json({ ok: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Local agent work result failed.'
      return res.status(500).json({ error: message })
    }
  })

  return router
}
