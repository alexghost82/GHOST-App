import type { CameraDevice, DiscoveredCamera } from '../../types.js'
import { discoverHikvisionCameras } from './hikvision-discovery.js'
import { discoverNetworkCameras } from './network-scan-discovery.js'
import { discoverOnvifCameras } from './onvif-discovery.js'

export async function discoverCameras(input?: { usbCameras?: CameraDevice[] }): Promise<DiscoveredCamera[]> {
  const [hikvision, onvif, network] = await Promise.all([
    discoverHikvisionCameras(),
    discoverOnvifCameras().catch(() => []),
    discoverNetworkCameras().catch(() => []),
  ])

  const usb = (input?.usbCameras ?? []).map<DiscoveredCamera>((camera) => ({
    id: camera.id,
    label: camera.label,
    discoveryType: 'usb-dshow',
    sourceType: 'usb-dshow',
    status: 'found',
    suggestedSource: {
      type: 'usb-dshow',
      name: camera.name,
    },
  }))

  return dedupeDiscovered([...usb, ...hikvision, ...onvif, ...network])
}

function dedupeDiscovered(cameras: DiscoveredCamera[]): DiscoveredCamera[] {
  const byKey = new Map<string, DiscoveredCamera>()
  for (const camera of cameras) {
    const key = camera.host ? `${camera.sourceType}:${camera.host}:${camera.port ?? ''}` : `${camera.sourceType}:${camera.id}`
    if (!byKey.has(key)) {
      byKey.set(key, camera)
    }
  }
  return Array.from(byKey.values())
}
