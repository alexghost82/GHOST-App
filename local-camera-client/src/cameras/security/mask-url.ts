import type { CameraSource } from '../../types.js'

export function maskRtspUrl(value: string): string {
  try {
    const url = new URL(value)
    if (url.password) {
      url.password = '***'
    }
    if (url.username && !url.password) {
      url.username = `${url.username.slice(0, 2)}***`
    }
    return url.toString()
  } catch {
    return value.replace(/:\/\/([^:/?#]+):([^@/?#]+)@/, '://$1:***@')
  }
}

export function maskCameraSource(source: CameraSource): string {
  switch (source.type) {
    case 'usb-dshow':
      return source.name
    case 'rtsp':
      return maskRtspUrl(source.url)
    case 'hikvision-sdk':
      return `${source.username}@${source.host}:${source.port}/channel/${source.channel}`
  }
}
