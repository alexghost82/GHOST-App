import type { LocalCameraConfig } from '../config.js'
import type { CaptureProfile, SavedCameraConfig } from '../types.js'
import { CameraRegistry } from './camera-registry.js'

const CAPTURE_TIMEOUT_MS = 10_000

export class CaptureService {
  private readonly registry: CameraRegistry

  constructor(private readonly config: LocalCameraConfig) {
    this.registry = new CameraRegistry(config)
  }

  getCamera(cameraId: string): SavedCameraConfig {
    return this.registry.getCamera(cameraId)
  }

  async captureFrameDataUrl(camera: SavedCameraConfig, profile: CaptureProfile): Promise<string> {
    const buffer = await this.registry.captureJpeg(camera.cameraId, profile, CAPTURE_TIMEOUT_MS)
    return `data:image/jpeg;base64,${buffer.toString('base64')}`
  }
}
