import type { FullChannelRecord, LocalAgentStatusRecord } from '../admin/types'

export const LOCAL_AGENT_HEARTBEAT_INTERVAL_MS = 15_000
export const LOCAL_AGENT_OFFLINE_AFTER_MS = 45_000

export function normalizeLocalAgentStatus(
  status?: LocalAgentStatusRecord,
  nowMs = Date.now(),
): LocalAgentStatusRecord | undefined {
  if (!status) {
    return undefined
  }

  const lastHeartbeatMs = Date.parse(status.lastHeartbeatAtIso)
  if (!Number.isFinite(lastHeartbeatMs) || nowMs - lastHeartbeatMs > LOCAL_AGENT_OFFLINE_AFTER_MS) {
    return {
      state: 'offline',
      lastHeartbeatAtIso: status.lastHeartbeatAtIso,
      lastError: status.lastError,
    }
  }

  return status
}

export function normalizeChannelLocalAgentState(
  channel: FullChannelRecord,
  nowMs = Date.now(),
): FullChannelRecord {
  const normalizedStatus = normalizeLocalAgentStatus(channel.localAgentStatus, nowMs)
  const captureMode = channel.captureMode ?? 'browser'
  if (captureMode !== 'local_agent') {
    return {
      ...channel,
      captureMode: 'browser',
      cameraEnabled: channel.cameraEnabled ?? false,
    }
  }

  const isConnected = normalizedStatus?.state === 'connected'
  return {
    ...channel,
    captureMode,
    localAgentStatus: normalizedStatus,
    cameraEnabled: isConnected,
    liveState:
      normalizedStatus?.state === 'degraded'
        ? 'DEGRADED'
        : normalizedStatus?.state === 'offline'
          ? 'OFFLINE'
          : channel.liveState,
  }
}

export function isChannelBoundToConnectedLocalAgent(channel: FullChannelRecord, nowMs = Date.now()): boolean {
  const normalized = normalizeChannelLocalAgentState(channel, nowMs)
  return (
    normalized.captureMode === 'local_agent' &&
    normalized.localAgentStatus?.state !== 'offline' &&
    Boolean(normalized.localAgentBinding)
  )
}
