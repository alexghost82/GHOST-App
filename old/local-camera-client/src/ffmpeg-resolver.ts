import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import ffmpegStatic from 'ffmpeg-static'

function isExecutableCandidateValid(candidate: string): boolean {
  const check = spawnSync(candidate, ['-version'], {
    windowsHide: true,
    stdio: 'ignore',
  })
  return !check.error && check.status === 0
}

function normalizeBundledPath(candidate: string): string {
  if (candidate.includes('app.asar\\')) {
    return candidate.replace('app.asar\\', 'app.asar.unpacked\\')
  }
  return candidate
}

export function resolveFfmpegPath(): string {
  const envPath = process.env.GHOST_FFMPEG_PATH?.trim()
  if (envPath) {
    if (existsSync(envPath) || isExecutableCandidateValid(envPath)) {
      return envPath
    }
  }

  if (ffmpegStatic) {
    const bundledPath = normalizeBundledPath(ffmpegStatic)
    if (existsSync(bundledPath) || isExecutableCandidateValid(bundledPath)) {
      return bundledPath
    }
  }

  return 'ffmpeg'
}

