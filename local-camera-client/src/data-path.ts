import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { homedir } from 'node:os'

const DATA_DIR_ENV_KEY = 'GHOST_AGENT_DATA_DIR'

function defaultDataDir(): string {
  const roamingAppData = process.env.APPDATA?.trim()
  if (roamingAppData) {
    return join(roamingAppData, 'ghost-local-camera-client')
  }
  return join(homedir(), '.ghost-local-camera-client')
}

export function resolveAgentDataDir(): string {
  const configured = process.env[DATA_DIR_ENV_KEY]?.trim()
  return configured ? resolve(configured) : defaultDataDir()
}

export function resolveAgentDataPath(filename: string): string {
  const dataPath = join(resolveAgentDataDir(), filename)
  mkdirSync(dirname(dataPath), { recursive: true })
  return dataPath
}

export function resolveLegacyAgentDataPath(filename: string): string {
  return resolve(process.cwd(), filename)
}

export function ensureAgentDataFileMigrated(filename: string): string {
  const targetPath = resolveAgentDataPath(filename)
  const legacyPath = resolveLegacyAgentDataPath(filename)
  if (!existsSync(targetPath) && existsSync(legacyPath)) {
    copyFileSync(legacyPath, targetPath)
  }
  return targetPath
}
