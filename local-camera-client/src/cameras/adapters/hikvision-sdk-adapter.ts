import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { CameraSource } from '../../types.js'
import type { CameraAdapter } from './camera-adapter.js'
import type { CaptureOptions } from '../camera-source.js'

export interface HikvisionSdkBridge {
  captureJpegToFile(
    source: Extract<CameraSource, { type: 'hikvision-sdk' }>,
    outputPath: string,
    options: CaptureOptions,
  ): Promise<void>
}

export type HikvisionBridgeLoader = () => Promise<HikvisionSdkBridge | null>

export class HikvisionSdkAdapter implements CameraAdapter<Extract<CameraSource, { type: 'hikvision-sdk' }>> {
  constructor(private readonly loadBridge: HikvisionBridgeLoader = loadOptionalHikvisionBridge) {}

  supports(source: CameraSource): source is Extract<CameraSource, { type: 'hikvision-sdk' }> {
    return source.type === 'hikvision-sdk'
  }

  async captureJpeg(source: Extract<CameraSource, { type: 'hikvision-sdk' }>, options: CaptureOptions): Promise<Buffer> {
    const bridge = await this.loadBridge()
    if (!bridge) {
      throw new Error('Hikvision SDK DLL missing or bridge not installed.')
    }

    const tempDir = await mkdtemp(join(tmpdir(), 'ghost-hikvision-'))
    const outputPath = join(tempDir, `snapshot-${Date.now()}.jpg`)
    try {
      await bridge.captureJpegToFile(source, outputPath, options)
      return await readFile(outputPath)
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error))
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  }
}

async function loadOptionalHikvisionBridge(): Promise<HikvisionSdkBridge | null> {
  try {
    const module = await import('../hikvision-sdk-bridge.js')
    return module.hikvisionSdkBridge ?? null
  } catch {
    return null
  }
}
