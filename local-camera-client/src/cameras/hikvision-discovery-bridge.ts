import type { DiscoveredCamera } from '../types.js'
import { hikvisionHelperClient } from './hikvision-helper-client.js'

export async function discoverHikvisionCameras(): Promise<DiscoveredCamera[]> {
  return hikvisionHelperClient.discover()
}
