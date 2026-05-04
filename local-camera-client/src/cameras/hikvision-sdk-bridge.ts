import type { CameraSource } from '../types.js'
import type { CaptureOptions } from './camera-source.js'
import type { HikvisionSdkBridge } from './adapters/hikvision-sdk-adapter.js'
import { hikvisionHelperClient } from './hikvision-helper-client.js'

export const hikvisionSdkBridge: HikvisionSdkBridge = {
  async captureJpegToFile(
    source: Extract<CameraSource, { type: 'hikvision-sdk' }>,
    outputPath: string,
    options: CaptureOptions,
  ): Promise<void> {
    await hikvisionHelperClient.captureJpegToFile(source, outputPath, options)
  },
}
