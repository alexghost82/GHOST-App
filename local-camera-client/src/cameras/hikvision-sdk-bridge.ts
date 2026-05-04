import type { CameraSource } from '../types.js'
import type { CaptureOptions } from './camera-source.js'
import type { HikvisionSdkBridge } from './adapters/hikvision-sdk-adapter.js'

export const hikvisionSdkBridge: HikvisionSdkBridge = {
  async captureJpegToFile(
    _source: Extract<CameraSource, { type: 'hikvision-sdk' }>,
    _outputPath: string,
    _options: CaptureOptions,
  ): Promise<void> {
    throw new Error('Hikvision SDK bridge is not wired yet. Install the native helper to enable SDK snapshots.')
  },
}
