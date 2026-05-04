import net from 'node:net'
import os from 'node:os'
import type { DiscoveredCamera } from '../../types.js'

const DEFAULT_PORTS = [80, 443, 554, 8000, 8080]
const DEFAULT_TIMEOUT_MS = 350
const DEFAULT_LIMIT = 48

export async function discoverNetworkCameras(): Promise<DiscoveredCamera[]> {
  const hosts = collectCandidateHosts(DEFAULT_LIMIT)
  const discoveries = await Promise.all(hosts.map((host) => probeHost(host)))
  return discoveries.filter((item): item is DiscoveredCamera => Boolean(item))
}

async function probeHost(host: string): Promise<DiscoveredCamera | null> {
  for (const port of DEFAULT_PORTS) {
    const open = await isPortOpen(host, port, DEFAULT_TIMEOUT_MS)
    if (!open) {
      continue
    }
    return {
      id: `scan-${host}-${port}`,
      label: `${host}:${port}`,
      discoveryType: 'network-scan',
      sourceType: port === 8000 ? 'hikvision-sdk' : 'rtsp',
      host,
      port,
      requiresCredentials: true,
      status: 'found',
    }
  }
  return null
}

function isPortOpen(host: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    const finish = (result: boolean) => {
      socket.destroy()
      resolve(result)
    }
    socket.setTimeout(timeoutMs)
    socket.once('connect', () => finish(true))
    socket.once('timeout', () => finish(false))
    socket.once('error', () => finish(false))
    socket.connect(port, host)
  })
}

function collectCandidateHosts(limit: number): string[] {
  const results: string[] = []
  const interfaces = os.networkInterfaces()
  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses ?? []) {
      if (address.family !== 'IPv4' || address.internal) {
        continue
      }
      const octets = address.address.split('.').map(Number)
      if (octets.length !== 4 || octets.some((part) => Number.isNaN(part))) {
        continue
      }
      for (let host = 1; host <= 254 && results.length < limit; host += 1) {
        if (host === octets[3]) {
          continue
        }
        results.push(`${octets[0]}.${octets[1]}.${octets[2]}.${host}`)
      }
    }
  }
  return Array.from(new Set(results))
}
