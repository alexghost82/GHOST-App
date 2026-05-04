import { buildConfigFromSaved } from './config.js'
import { startHealthServer, type AgentRuntimeState } from './health-server.js'
import { loadLocalConfig } from './local-store.js'
import { LocalCameraWorker } from './worker.js'

async function main(): Promise<void> {
  const saved = loadLocalConfig()
  if (!saved) {
    throw new Error('No saved local-agent binding found. Start the Electron app and complete setup first.')
  }

  const config = buildConfigFromSaved(saved)
  const state: AgentRuntimeState = {
    startedAtIso: new Date().toISOString(),
    status: 'starting',
    scannedOperations: 0,
  }
  const healthServer = startHealthServer(config.healthPort, state)
  const worker = new LocalCameraWorker(config, state)

  const shutdown = () => {
    state.status = 'offline'
    worker.stop()
    healthServer.close()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  await worker.start()
  console.log(`[GHOST] Local camera worker running for ${config.bindings.length} channel binding(s). Health: http://127.0.0.1:${config.healthPort}/health`)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[GHOST] Local camera worker failed: ${message}`)
  process.exit(1)
})
