import dgram from 'node:dgram'
import { randomUUID } from 'node:crypto'
import type { DiscoveredCamera } from '../../types.js'

const ONVIF_DISCOVERY_PORT = 3702
const ONVIF_DISCOVERY_ADDRESS = '239.255.255.250'
const DEFAULT_TIMEOUT_MS = 2_500

export async function discoverOnvifCameras(timeoutMs = DEFAULT_TIMEOUT_MS): Promise<DiscoveredCamera[]> {
  return new Promise((resolve) => {
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
    const discovered = new Map<string, DiscoveredCamera>()

    const finish = () => {
      try {
        socket.close()
      } catch {}
      resolve(Array.from(discovered.values()))
    }

    socket.on('message', (message, remote) => {
      const xml = message.toString('utf8')
      const host = remote.address
      const endpoint = matchTag(xml, 'XAddrs')
      const manufacturer = matchAny(xml, ['Manufacturer', 'd:Manufacturer'])
      const model = matchAny(xml, ['Model', 'd:Model'])
      const serial = matchAny(xml, ['SerialNumber', 'd:SerialNumber'])
      discovered.set(host, {
        id: `onvif-${host}`,
        label: model || manufacturer || host,
        discoveryType: 'onvif',
        sourceType: 'rtsp',
        host,
        port: endpoint ? safePortFromUrl(endpoint) : 80,
        manufacturer: manufacturer || 'ONVIF',
        model: model || undefined,
        serial: serial || undefined,
        requiresCredentials: true,
        status: 'found',
      })
    })

    socket.on('error', finish)
    socket.bind(() => {
      const messageId = randomUUID()
      const probe = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<e:Envelope xmlns:e="http://www.w3.org/2003/05/soap-envelope"',
        ' xmlns:w="http://schemas.xmlsoap.org/ws/2004/08/addressing"',
        ' xmlns:d="http://schemas.xmlsoap.org/ws/2005/04/discovery"',
        ' xmlns:dn="http://www.onvif.org/ver10/network/wsdl">',
        '<e:Header>',
        `<w:MessageID>uuid:${messageId}</w:MessageID>`,
        '<w:To>urn:schemas-xmlsoap-org:ws:2005:04:discovery</w:To>',
        '<w:Action>http://schemas.xmlsoap.org/ws/2005/04/discovery/Probe</w:Action>',
        '</e:Header>',
        '<e:Body>',
        '<d:Probe><d:Types>dn:NetworkVideoTransmitter</d:Types></d:Probe>',
        '</e:Body>',
        '</e:Envelope>',
      ].join('')
      socket.send(Buffer.from(probe), ONVIF_DISCOVERY_PORT, ONVIF_DISCOVERY_ADDRESS, () => undefined)
      setTimeout(finish, timeoutMs)
    })
  })
}

function matchTag(xml: string, tagName: string): string | undefined {
  return matchAny(xml, [tagName])
}

function matchAny(xml: string, tagNames: string[]): string | undefined {
  for (const tagName of tagNames) {
    const match = xml.match(new RegExp(`<${tagName}[^>]*>([^<]+)</${tagName}>`, 'i'))
    if (match?.[1]) {
      return match[1].trim()
    }
  }
  return undefined
}

function safePortFromUrl(value: string): number | undefined {
  try {
    const parsed = new URL(value)
    return parsed.port ? Number(parsed.port) : parsed.protocol === 'https:' ? 443 : 80
  } catch {
    return undefined
  }
}
