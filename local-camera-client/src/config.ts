import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { SavedAgentConfig } from './local-store.js'
import { resolveFfmpegPath } from './ffmpeg-resolver.js'
import type { SavedCameraConfig } from './types.js'

export interface LocalCameraConfig {
  apiBaseUrl: string
  accessToken: string
  refreshToken: string
  username: string
  deviceId: string
  deviceName: string
  channelId: string
  channelName: string
  cameraName?: string
  cameras: SavedCameraConfig[]
  bindings: Array<{
    channelId: string
    cameraId: string
  }>
  defaultCameraId: string
  ffmpegPath: string
  pollIntervalMs: number
  healthPort: number
  maxParallelCaptures: number
  maxParallelFfmpegCaptures: number
  maxParallelHikvisionCaptures: number
  maxParallelPerCamera: number
  maxParallelPerHost: number
  testFrame?: string
}

function loadDotEnv(): void {
  const envPath = resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) return

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index <= 0) continue
    const key = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim()
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim()
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function buildConfigFromSaved(saved: SavedAgentConfig): LocalCameraConfig {
  loadDotEnv()
  const firstBinding = saved.bindings[0]
  const defaultCameraId = saved.defaultCameraId ?? firstBinding?.cameraId ?? saved.cameras[0]?.cameraId
  if (!defaultCameraId) {
    throw new Error('At least one camera must be configured for the local agent.')
  }
  if (!firstBinding?.channelId && !saved.channelId) {
    throw new Error('At least one channel binding must be configured for the local agent.')
  }

  return {
    apiBaseUrl: saved.apiBaseUrl.replace(/\/+$/, ''),
    accessToken: saved.accessToken,
    refreshToken: saved.refreshToken,
    username: saved.username,
    deviceId: saved.deviceId,
    deviceName: saved.deviceName,
    channelId: saved.channelId ?? firstBinding?.channelId ?? '',
    channelName: saved.channelName ?? 'Local agent channel',
    cameraName: saved.cameraName,
    cameras: saved.cameras,
    bindings: saved.bindings,
    defaultCameraId,
    ffmpegPath: resolveFfmpegPath(),
    pollIntervalMs: readPositiveInt('GHOST_POLL_INTERVAL_MS', 15_000),
    healthPort: readPositiveInt('GHOST_HEALTH_PORT', 8791),
    maxParallelCaptures: readPositiveInt('GHOST_MAX_PARALLEL_CAPTURES', 4),
    maxParallelFfmpegCaptures: readPositiveInt('GHOST_MAX_PARALLEL_FFMPEG_CAPTURES', 3),
    maxParallelHikvisionCaptures: readPositiveInt('GHOST_MAX_PARALLEL_HIKVISION_CAPTURES', 6),
    maxParallelPerCamera: readPositiveInt('GHOST_MAX_PARALLEL_PER_CAMERA', 1),
    maxParallelPerHost: readPositiveInt('GHOST_MAX_PARALLEL_PER_HOST', 1),
    testFrame: process.env.GHOST_CAMERA_TEST_FRAME?.trim() || undefined,
  }
}
