import type { DiscoveredCamera } from '../../types.js'

export function createManualRtspDiscovery(url: string, label?: string): DiscoveredCamera {
  let host: string | undefined
  let port: number | undefined
  try {
    const parsed = new URL(url)
    host = parsed.hostname
    port = parsed.port ? Number(parsed.port) : 554
  } catch {
    host = undefined
  }

  return {
    id: `rtsp-${host ?? 'manual'}`,
    label: label?.trim() || host || 'Manual RTSP camera',
    discoveryType: 'manual',
    sourceType: 'rtsp',
    host,
    port,
    requiresCredentials: true,
    suggestedRtspUrls: [url],
    suggestedSource: {
      type: 'rtsp',
      url,
    },
    status: 'requires-auth',
  }
}
