export type CaptureProfile = 'scan-low' | 'scan-standard' | 'chat-high'

interface CaptureProfileConfig {
  width: number
  height: number
  quality: number
}

const CAPTURE_PROFILE_CONFIG: Record<CaptureProfile, CaptureProfileConfig> = {
  'scan-low': {
    width: 512,
    height: 288,
    quality: 0.65,
  },
  'scan-standard': {
    width: 640,
    height: 360,
    quality: 0.75,
  },
  'chat-high': {
    width: 1024,
    height: 576,
    quality: 0.85,
  },
}

let sharedStream: MediaStream | null = null
let captureVideoElement: HTMLVideoElement | null = null
let captureCanvasElement: HTMLCanvasElement | null = null

function ensureCanvas(width: number, height: number): HTMLCanvasElement {
  if (!captureCanvasElement) {
    captureCanvasElement = document.createElement('canvas')
  }

  captureCanvasElement.width = width
  captureCanvasElement.height = height
  return captureCanvasElement
}

async function getOrCreateStream(): Promise<MediaStream> {
  if (sharedStream) {
    return sharedStream
  }

  sharedStream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      width: { ideal: CAPTURE_PROFILE_CONFIG['scan-standard'].width },
      height: { ideal: CAPTURE_PROFILE_CONFIG['scan-standard'].height },
      facingMode: 'user',
    },
  })

  return sharedStream
}

async function getReadyVideoElement(stream: MediaStream): Promise<HTMLVideoElement> {
  if (!captureVideoElement) {
    captureVideoElement = document.createElement('video')
    captureVideoElement.playsInline = true
    captureVideoElement.muted = true
    captureVideoElement.autoplay = true
  }

  if (captureVideoElement.srcObject !== stream) {
    captureVideoElement.srcObject = stream
  }

  if (captureVideoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => {
        cleanup()
        resolve()
      }
      const onError = () => {
        cleanup()
        reject(new Error('Failed to load camera stream.'))
      }
      const cleanup = () => {
        captureVideoElement?.removeEventListener('loadeddata', onLoaded)
        captureVideoElement?.removeEventListener('error', onError)
      }

      captureVideoElement?.addEventListener('loadeddata', onLoaded, { once: true })
      captureVideoElement?.addEventListener('error', onError, { once: true })
    })
  }

  if (captureVideoElement.paused) {
    await captureVideoElement.play()
  }

  return captureVideoElement
}

export async function captureLatestCameraFrame(profile: CaptureProfile = 'scan-standard'): Promise<string> {
  const selectedProfile = CAPTURE_PROFILE_CONFIG[profile]
  const stream = await getOrCreateStream()
  const video = await getReadyVideoElement(stream)
  const sourceWidth = video.videoWidth || selectedProfile.width
  const sourceHeight = video.videoHeight || selectedProfile.height

  const ratio = Math.min(selectedProfile.width / sourceWidth, selectedProfile.height / sourceHeight)
  const width = Math.max(1, Math.round(sourceWidth * ratio))
  const height = Math.max(1, Math.round(sourceHeight * ratio))

  const canvas = ensureCanvas(width, height)
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Failed to initialize capture canvas.')
  }

  context.drawImage(video, 0, 0, width, height)
  return canvas.toDataURL('image/webp', selectedProfile.quality)
}

export function createFallbackCameraFrame(profile: CaptureProfile = 'scan-standard'): string {
  const selectedProfile = CAPTURE_PROFILE_CONFIG[profile]
  const canvas = ensureCanvas(selectedProfile.width, selectedProfile.height)
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Failed to initialize fallback capture canvas.')
  }

  const gradient = context.createLinearGradient(0, 0, selectedProfile.width, selectedProfile.height)
  gradient.addColorStop(0, '#08111f')
  gradient.addColorStop(1, '#1f3f67')
  context.fillStyle = gradient
  context.fillRect(0, 0, selectedProfile.width, selectedProfile.height)

  context.fillStyle = 'rgba(255, 255, 255, 0.92)'
  context.font = 'bold 28px Segoe UI'
  context.fillText('GHOST CAMERA UNAVAILABLE', 28, 54)
  context.font = '20px Segoe UI'
  context.fillText('Using fallback frame for chat continuity', 28, 92)
  context.strokeStyle = 'rgba(255, 255, 255, 0.22)'
  context.lineWidth = 2
  context.strokeRect(18, 18, selectedProfile.width - 36, selectedProfile.height - 36)

  return canvas.toDataURL('image/jpeg', 0.82)
}

export function releaseCameraResources() {
  if (sharedStream) {
    sharedStream.getTracks().forEach((track) => track.stop())
    sharedStream = null
  }

  if (captureVideoElement) {
    try {
      captureVideoElement.pause()
    } catch {
      // JSDOM does not implement pause(); browsers do.
    }
    captureVideoElement.srcObject = null
  }
}
