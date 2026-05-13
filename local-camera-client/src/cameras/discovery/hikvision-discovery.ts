import type { DiscoveredCamera } from '../../types.js'

export async function discoverHikvisionCameras(): Promise<DiscoveredCamera[]> {
  try {
    const module = await import('../hikvision-discovery-bridge.js')
    return await module.discoverHikvisionCameras()
  } catch {
    return []
  }
}
