import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { CameraSource, DiscoveredCamera } from '../types.js'

export const HIKVISION_RTSP_MAIN_PATH = '/Streaming/Channels/101'
export const HIKVISION_SDK_PORT = 8000
export const HIKVISION_RTSP_PORT = 554
export const REQUIRED_HIKVISION_DLLS = ['HCNetSDK.dll']

export interface RtspProvisioningInput {
  host: string
  username: string
  password: string
  discovery?: Pick<DiscoveredCamera, 'sourceType' | 'discoveryType' | 'manufacturer' | 'port' | 'suggestedSource'>
}

export function normalizeCameraHost(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error('Camera IP address is required.')
  }
  if (/^rtsp:\/\//i.test(trimmed)) {
    return new URL(trimmed).hostname
  }
  return trimmed.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0]
}

export function buildHikvisionMainRtspUrl(input: { host: string; username: string; password: string }): string {
  const host = normalizeCameraHost(input.host)
  const url = new URL(`rtsp://${host}:${HIKVISION_RTSP_PORT}${HIKVISION_RTSP_MAIN_PATH}`)
  url.username = input.username.trim()
  url.password = input.password
  return url.toString()
}

export function isHikvisionDiscovery(discovery?: RtspProvisioningInput['discovery']): boolean {
  if (!discovery) {
    return false
  }
  if (discovery.sourceType === 'hikvision-sdk' || discovery.discoveryType === 'hikvision-sdk') {
    return true
  }
  return /hikvision/i.test(discovery.manufacturer ?? '')
}

export function buildSourceFromRtspProvisioning(input: RtspProvisioningInput): CameraSource {
  const host = normalizeCameraHost(input.host)
  const username = input.username.trim()
  if (!username) {
    throw new Error('Camera username is required.')
  }
  if (!input.password) {
    throw new Error('Camera password is required.')
  }

  if (isHikvisionDiscovery(input.discovery)) {
    const suggested = input.discovery?.suggestedSource as { port?: unknown; channel?: unknown } | undefined
    return {
      type: 'hikvision-sdk',
      host,
      port: typeof suggested?.port === 'number' ? suggested.port : HIKVISION_SDK_PORT,
      username,
      password: input.password,
      channel: typeof suggested?.channel === 'number' ? suggested.channel : 1,
      useHttps: false,
    }
  }

  return {
    type: 'rtsp',
    url: buildHikvisionMainRtspUrl({ host, username, password: input.password }),
    transport: 'tcp',
    username,
    password: input.password,
  }
}

export function resolveHikvisionSdkDir(env: NodeJS.ProcessEnv = process.env): string | null {
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath
  const candidates = [
    env.GHOST_HIKVISION_SDK_DIR,
    join(process.cwd(), 'hikvision-sdk'),
    join(process.cwd(), 'sdk', 'hikvision'),
    resourcesPath ? join(resourcesPath, 'hikvision-sdk') : undefined,
  ].filter((value): value is string => Boolean(value))

  for (const candidate of candidates) {
    if (hasRequiredHikvisionDlls(candidate)) {
      return candidate
    }
    const libDir = join(candidate, 'lib')
    if (hasRequiredHikvisionDlls(libDir)) {
      return libDir
    }
  }

  return null
}

export function hasRequiredHikvisionDlls(sdkDir: string): boolean {
  return REQUIRED_HIKVISION_DLLS.every((dll) => existsSync(join(sdkDir, dll)))
}

export function assertHikvisionSdkAvailable(env: NodeJS.ProcessEnv = process.env): string {
  const sdkDir = resolveHikvisionSdkDir(env)
  if (!sdkDir) {
    throw new Error('Hikvision SDK is required for Hikvision cameras. Set GHOST_HIKVISION_SDK_DIR to a folder containing HCNetSDK.dll.')
  }
  return sdkDir
}
