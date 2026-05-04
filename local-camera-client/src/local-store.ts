import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { LocalAgentBinding, SavedCameraConfig } from './types.js'

export interface SavedAgentConfig {
  organizationId: string
  organizationName: string
  apiBaseUrl: string
  accessToken: string
  refreshToken: string
  username: string
  deviceId: string
  deviceName: string
  cameras: SavedCameraConfig[]
  bindings: Array<{
    channelId: string
    cameraId: string
  }>
  channelId?: string
  channelName?: string
  cameraName?: string
  boundAtIso?: string
  defaultCameraId?: string
}

export const DEFAULT_API_BASE_URL = 'https://ghost-test-app-b906c.web.app'
const CONFIG_FILENAME = 'ghost-agent.runtime.json'

function configPath(): string {
  return resolve(process.cwd(), CONFIG_FILENAME)
}

export function loadLocalConfig(): SavedAgentConfig | null {
  const path = configPath()
  if (!existsSync(path)) {
    return null
  }

  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
    if (
      typeof parsed.organizationId !== 'string' ||
      typeof parsed.apiBaseUrl !== 'string' ||
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.refreshToken !== 'string' ||
      typeof parsed.deviceId !== 'string'
    ) {
      return null
    }

    return normalizeSavedConfig(parsed as unknown as SavedAgentConfig)
  } catch {
    return null
  }
}

export function saveLocalConfig(config: SavedAgentConfig): void {
  writeFileSync(configPath(), JSON.stringify(normalizeSavedConfig(config), null, 2), 'utf8')
}

export function clearLocalConfig(): void {
  const path = configPath()
  if (existsSync(path)) {
    unlinkSync(path)
  }
}

export function normalizeSavedConfig(config: SavedAgentConfig): SavedAgentConfig {
  const legacyCameraName = config.cameraName?.trim()
  const legacyChannelId = config.channelId?.trim()
  const legacyChannelName = config.channelName?.trim()
  const boundAtIso = config.boundAtIso ?? new Date().toISOString()
  const cameras = Array.isArray(config.cameras) ? config.cameras.filter(Boolean).map(normalizeCameraConfig) : []
  const bindings = Array.isArray(config.bindings) ? config.bindings.filter(Boolean) : []

  if (cameras.length === 0 && legacyCameraName) {
    const legacyCameraId = `legacy-${slugify(legacyCameraName)}`
    cameras.push({
      cameraId: legacyCameraId,
      label: legacyCameraName,
      source: {
        type: 'usb-dshow',
        name: legacyCameraName,
      },
      enabled: true,
      createdAtIso: boundAtIso,
      updatedAtIso: boundAtIso,
    })

    if (legacyChannelId) {
      bindings.push({
        channelId: legacyChannelId,
        cameraId: legacyCameraId,
      })
    }
  }

  const defaultCameraId = config.defaultCameraId
    ?? bindings[0]?.cameraId
    ?? cameras[0]?.cameraId

  return {
    ...config,
    apiBaseUrl: DEFAULT_API_BASE_URL,
    cameras,
    bindings,
    defaultCameraId,
    channelId: legacyChannelId ?? bindings[0]?.channelId,
    channelName: legacyChannelName,
    cameraName: legacyCameraName ?? cameras[0]?.label,
  }
}

export function resolveBindingDetails(
  saved: SavedAgentConfig,
): Array<LocalAgentBinding & { channelName?: string }> {
  const resolved: Array<LocalAgentBinding & { channelName?: string }> = []
  for (const binding of saved.bindings) {
    const camera = saved.cameras.find((item) => item.cameraId === binding.cameraId)
    if (!camera) {
      continue
    }
    resolved.push({
      deviceId: saved.deviceId,
      deviceName: saved.deviceName,
      cameraId: camera.cameraId,
      cameraLabel: camera.label,
      cameraSourceType: camera.source.type,
      cameraName: camera.source.type === 'usb-dshow' ? camera.source.name : undefined,
      channelId: binding.channelId,
      boundAtIso: saved.boundAtIso ?? camera.updatedAtIso,
      channelName: binding.channelId === saved.channelId ? saved.channelName : undefined,
    })
  }
  return resolved
}

function normalizeCameraConfig(camera: SavedCameraConfig): SavedCameraConfig {
  const source = normalizeCameraSource(camera.source as SavedCameraConfig['source'])
  return {
    ...camera,
    source,
    enabled: camera.enabled ?? true,
  }
}

function normalizeCameraSource(source: SavedCameraConfig['source']): SavedCameraConfig['source'] {
  if ((source as { type?: string }).type === 'rtsp-ffmpeg') {
    const legacy = source as unknown as { url: string; transport?: 'tcp' | 'udp'; username?: string; password?: string }
    return {
      type: 'rtsp',
      url: legacy.url,
      transport: legacy.transport,
      username: legacy.username,
      password: legacy.password,
    }
  }
  return source
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'camera'
}
