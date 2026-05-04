import { spawn } from 'node:child_process'
import type { CameraSource } from '../../types.js'
import type { CameraAdapter } from './camera-adapter.js'
import { getCaptureDimensions, type CaptureOptions } from '../camera-source.js'

export class UsbDshowFfmpegAdapter implements CameraAdapter<Extract<CameraSource, { type: 'usb-dshow' }>> {
  constructor(private readonly ffmpegPath: string) {}

  supports(source: CameraSource): source is Extract<CameraSource, { type: 'usb-dshow' }> {
    return source.type === 'usb-dshow'
  }

  async captureJpeg(source: Extract<CameraSource, { type: 'usb-dshow' }>, options: CaptureOptions): Promise<Buffer> {
    const { width, height } = getCaptureDimensions(options)
    return runFfmpegCapture(this.ffmpegPath, [
      '-hide_banner',
      '-loglevel',
      'error',
      '-f',
      'dshow',
      '-video_size',
      `${width}x${height}`,
      '-i',
      `video=${source.name}`,
      '-frames:v',
      '1',
      '-f',
      'image2pipe',
      '-vcodec',
      'mjpeg',
      'pipe:1',
    ], options.timeoutMs, source.name)
  }
}

export function runFfmpegCapture(
  ffmpegPath: string,
  args: string[],
  timeoutMs: number,
  cameraNameForBusyHint?: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const errors: Buffer[] = []
    const child = spawn(ffmpegPath, args, { windowsHide: true })
    const timeout = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error('FFmpeg camera capture timed out.'))
    }, timeoutMs)

    child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk))
    child.stderr.on('data', (chunk: Buffer) => errors.push(chunk))
    child.on('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })
    child.on('close', (code) => {
      clearTimeout(timeout)
      const buffer = Buffer.concat(chunks)
      if (code !== 0 || buffer.length === 0) {
        const message = Buffer.concat(errors).toString('utf8').trim()
        if (
          cameraNameForBusyHint &&
          /device already in use by other application|Could not run graph|I\/O error/i.test(message)
        ) {
          reject(new Error(
            `Camera "${cameraNameForBusyHint}" is busy. Close Zoom, browser tabs, Logitech apps, Windows Camera, OBS, or another GHOST capture that may still be using it, then try again. Original FFmpeg error: ${message}`,
          ))
          return
        }
        reject(new Error(message || `FFmpeg exited with code ${code}.`))
        return
      }
      resolve(buffer)
    })
  })
}
