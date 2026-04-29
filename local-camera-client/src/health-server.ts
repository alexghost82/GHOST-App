import { createServer, type Server } from 'node:http'

export interface AgentRuntimeState {
  startedAtIso: string
  lastHeartbeatAtIso?: string
  lastScanAtIso?: string
  lastError?: string
  status: 'starting' | 'online' | 'scanning' | 'degraded' | 'offline'
  scannedOperations: number
}

export function startHealthServer(port: number, state: AgentRuntimeState): Server {
  const server = createServer((req, res) => {
    if (req.url !== '/health') {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found' }))
      return
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      ok: state.status !== 'offline',
      ...state,
      uptimeSeconds: Math.round((Date.now() - Date.parse(state.startedAtIso)) / 1000),
    }))
  })

  server.listen(port, '127.0.0.1')
  return server
}

