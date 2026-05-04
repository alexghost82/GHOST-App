import type { CameraSource, RtspCameraSource } from '../../types.js'
import type { CameraAdapter } from './camera-adapter.js'
import { getCaptureDimensions, type CaptureOptions } from '../camera-source.js'
import { maskRtspUrl } from '../security/mask-url.js'
import { runFfmpegCapture } from './usb-dshow-ffmpeg-adapter.js'

export class RtspFfmpegAdapter implements CameraAdapter<RtspCameraSource> {
  constructor(private readonly ffmpegPath: string) {}

  supports(source: CameraSource): source is RtspCameraSource {
    return source.type === 'rtsp'
  }

  async captureJpeg(source: RtspCameraSource, options: CaptureOptions): Promise<Buffer> {
    const { width, height } = getCaptureDimensions(options)
    const inputUrl = buildRtspInputUrl(source)
    const args = [
      '-hide_banner',
      '-loglevel',
      'error',
      '-rtsp_transport',
      source.transport ?? 'tcp',
      '-timeout',
      `${Math.max(1, Math.floor(options.timeoutMs / 2)) * 1000}`,
      '-i',
      inputUrl,
      '-frames:v',
      '1',
      '-vf',
      `scale=${width}:${height}`,
      '-f',
      'image2pipe',
      '-vcodec',
      'mjpeg',
      'pipe:1',
    ]

    try {
      return await runFfmpegCapture(this.ffmpegPath, args, options.timeoutMs)
    } catch (error) {
      throw new Error(mapRtspCaptureError(inputUrl, error))
    }
  }
}

function buildRtspInputUrl(source: RtspCameraSource): string {
  try {
    const url = new URL(source.url)
    if (source.username) {
      url.username = source.username
    }
    if (source.password) {
      url.password = source.password
    }
    return url.toString()
  } catch {
    return source.url
  }
}

export function mapRtspCaptureError(url: string, error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  const masked = maskRtspUrl(url)
  if (/401 Unauthorized|authorization failed|auth failed|invalid credentials/i.test(message)) {
    return `RTSP authentication failed for ${masked}.`
  }
  if (/timed out/i.test(message)) {
    return `RTSP connection timeout for ${masked}.`
  }
  if (/No route to host|host unreachable|Network is unreachable/i.test(message)) {
    return `RTSP host unreachable for ${masked}.`
  }
  if (/Invalid data found|invalid.*rtsp|Protocol not found/i.test(message)) {
    return `Invalid RTSP URL for ${masked}.`
  }
  if (/Output file is empty|could not find codec parameters|End of file/i.test(message)) {
    return `No frame received from ${masked}.`
  }
  return `RTSP capture failed for ${masked}: ${message}`
}
