import { existsSync, readFileSync } from 'node:fs'
import type { LocalCameraConfig } from './config.js'
import type { CaptureProfile } from './types.js'
import { CameraRegistry } from './cameras/camera-registry.js'

const CAPTURE_TIMEOUT_MS = 10_000

export async function captureFrameDataUrl(
  config: LocalCameraConfig,
  cameraId = config.defaultCameraId,
  profile: CaptureProfile = 'scan-standard',
): Promise<string> {
  if (config.testFrame) {
    return readTestFrame(config.testFrame)
  }

  const registry = new CameraRegistry(config)
  const buffer = await registry.captureJpeg(cameraId, profile, CAPTURE_TIMEOUT_MS)
  return `data:image/jpeg;base64,${buffer.toString('base64')}`
}

function readTestFrame(source: string): string {
  if (source.startsWith('data:image/')) {
    return source
  }
  if (!existsSync(source)) {
    throw new Error(`GHOST_CAMERA_TEST_FRAME file does not exist: ${source}`)
  }
  const buffer = readFileSync(source)
  return `data:image/jpeg;base64,${buffer.toString('base64')}`
}
