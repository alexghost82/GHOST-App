import { existsSync, readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import type { LocalCameraConfig } from './config.js'

const DEFAULT_WIDTH = 640
const DEFAULT_HEIGHT = 360
const CAPTURE_TIMEOUT_MS = 10_000

export async function captureFrameDataUrl(config: LocalCameraConfig): Promise<string> {
  if (config.testFrame) {
    return readTestFrame(config.testFrame)
  }
  if (!config.cameraName) {
    throw new Error('GHOST_CAMERA_DSHOW_NAME must be configured when GHOST_CAMERA_TEST_FRAME is not set.')
  }

  const buffer = await captureJpegWithFfmpeg(config)
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

function captureJpegWithFfmpeg(config: LocalCameraConfig): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const errors: Buffer[] = []
    const args = [
      '-hide_banner',
      '-loglevel',
      'error',
      '-f',
      'dshow',
      '-video_size',
      `${DEFAULT_WIDTH}x${DEFAULT_HEIGHT}`,
      '-i',
      `video=${config.cameraName}`,
      '-frames:v',
      '1',
      '-f',
      'image2pipe',
      '-vcodec',
      'mjpeg',
      'pipe:1',
    ]

    const child = spawn(config.ffmpegPath, args, { windowsHide: true })
    const timeout = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error('FFmpeg camera capture timed out.'))
    }, CAPTURE_TIMEOUT_MS)

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
        if (/device already in use by other application|Could not run graph|I\/O error/i.test(message)) {
          reject(new Error(
            `Camera "${config.cameraName}" is busy. Close Zoom, browser tabs, Logitech apps, Windows Camera, OBS, or another GHOST capture that may still be using it, then try again. Original FFmpeg error: ${message}`,
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
