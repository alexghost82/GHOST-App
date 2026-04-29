import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

export interface SavedAgentConfig {
  organizationId: string
  organizationName: string
  apiBaseUrl: string
  accessToken: string
  refreshToken: string
  username: string
  deviceId: string
  deviceName: string
  channelId: string
  channelName: string
  cameraName: string
  boundAtIso: string
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
      typeof parsed.deviceId !== 'string' ||
      typeof parsed.channelId !== 'string' ||
      typeof parsed.cameraName !== 'string'
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

function normalizeSavedConfig(config: SavedAgentConfig): SavedAgentConfig {
  return {
    ...config,
    apiBaseUrl: DEFAULT_API_BASE_URL,
  }
}
