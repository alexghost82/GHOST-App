import type { LocalCameraConfig } from '../config.js'
import type { SavedCameraConfig, CameraSource, CaptureProfile } from '../types.js'
import { CaptureQueue } from './capture-queue.js'
import { getCameraSourceHost, type CaptureOptions } from './camera-source.js'
import type { CameraAdapter } from './adapters/camera-adapter.js'
import { HikvisionSdkAdapter } from './adapters/hikvision-sdk-adapter.js'
import { RtspFfmpegAdapter } from './adapters/rtsp-ffmpeg-adapter.js'
import { UsbDshowFfmpegAdapter } from './adapters/usb-dshow-ffmpeg-adapter.js'

export class CameraRegistry {
  private readonly adapters: CameraAdapter[]
  private readonly camerasById: Map<string, SavedCameraConfig>
  private readonly queue: CaptureQueue

  constructor(private readonly config: LocalCameraConfig) {
    this.adapters = [
      new UsbDshowFfmpegAdapter(config.ffmpegPath),
      new RtspFfmpegAdapter(config.ffmpegPath),
      new HikvisionSdkAdapter(),
    ]
    this.camerasById = new Map(config.cameras.map((camera) => [camera.cameraId, camera]))
    this.queue = new CaptureQueue({
      maxParallelCaptures: config.maxParallelCaptures,
      maxParallelFfmpegCaptures: config.maxParallelFfmpegCaptures,
      maxParallelHikvisionCaptures: config.maxParallelHikvisionCaptures,
      maxParallelPerCamera: config.maxParallelPerCamera,
      maxParallelPerHost: config.maxParallelPerHost,
    })
  }

  getCamera(cameraId: string): SavedCameraConfig {
    const camera = this.camerasById.get(cameraId)
    if (!camera) {
      throw new Error(`Camera "${cameraId}" is not configured in the local agent.`)
    }
    return camera
  }

  resolveAdapter(source: CameraSource): CameraAdapter {
    const adapter = this.adapters.find((candidate) => candidate.supports(source))
    if (!adapter) {
      throw new Error(`No camera adapter available for source type "${source.type}".`)
    }
    return adapter
  }

  captureJpeg(cameraId: string, profile: CaptureProfile, timeoutMs = 10_000): Promise<Buffer> {
    const camera = this.getCamera(cameraId)
    const adapter = this.resolveAdapter(camera.source)
    const host = getCameraSourceHost(camera.source)
    const kind = camera.source.type === 'hikvision-sdk' ? 'hikvision' : camera.source.type === 'usb-dshow' || camera.source.type === 'rtsp-ffmpeg' ? 'ffmpeg' : 'other'
    const options: CaptureOptions = { profile, timeoutMs }

    return this.queue.enqueue(
      { cameraId, host, kind },
      () => adapter.captureJpeg(camera.source as never, options),
      profile === 'preview' ? 50 : 10,
    )
  }
}
