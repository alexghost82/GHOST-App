import { spawn } from 'node:child_process'
import type { CameraDevice } from './types.js'

/**
 * Перечисляет доступные DShow видеоустройства через ffmpeg
 * и возвращает их как device-объекты для GUI.
 */
export function listDShowCameras(ffmpegPath = 'ffmpeg'): Promise<CameraDevice[]> {
  return new Promise((resolve) => {
    const stderr: Buffer[] = []
    const child = spawn(ffmpegPath, [
      '-hide_banner',
      '-list_devices', 'true',
      '-f', 'dshow',
      '-i', 'dummy',
    ], { windowsHide: true })

    child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk))
    child.on('error', () => resolve([]))
    child.on('close', () => {
      const output = Buffer.concat(stderr).toString('utf8')
      resolve(parseDShowDevices(output))
    })
  })
}

function parseDShowDevices(output: string): CameraDevice[] {
  const lines = output.split(/\r?\n/)
  const cameras: CameraDevice[] = []
  const seen = new Set<string>()
  let inVideoSection = false

  for (const line of lines) {
    const typedMatch = line.match(/\]\s+"(.+?)"\s+\((video|audio)\)/i)
    if (typedMatch?.[1] && typedMatch?.[2]) {
      if (typedMatch[2].toLowerCase() === 'video') {
        pushCamera(cameras, seen, typedMatch[1])
      }
      continue
    }

    if (/DirectShow video devices/i.test(line)) {
      inVideoSection = true
      continue
    }
    if (/DirectShow audio devices/i.test(line)) {
      inVideoSection = false
      continue
    }
    if (!inVideoSection) continue

    const match = line.match(/\]\s+"(.+?)"/)
    if (match?.[1]) {
      pushCamera(cameras, seen, match[1])
    }
  }

  return cameras
}

function pushCamera(target: CameraDevice[], seen: Set<string>, rawName: string): void {
  const name = rawName.trim()
  if (!name || name.startsWith('@device')) {
    return
  }

  const key = name.toLowerCase()
  if (seen.has(key)) {
    return
  }
  seen.add(key)

  target.push({
    id: toDeviceId(name),
    name,
    label: name,
    kind: 'video-input',
  })
}

function toDeviceId(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase() || 'camera-device'
}
