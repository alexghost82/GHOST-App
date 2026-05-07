import { copyFileSync, existsSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'
import { resolve } from 'node:path'
import { DEFAULT_API_BASE_URL, loadLocalConfig, saveLocalConfig } from './dist/local-store.js'
import { upsertCamera, resolveAgentSecrets } from './dist/cameras/camera-store.js'
import { GhostApiClient } from './dist/api-client.js'
import { buildConfigFromSaved } from './dist/config.js'
import { LocalCameraWorker } from './dist/worker.js'

const CAMERA_HOST = '10.0.0.10'
const CAMERA_PORT = 8000
const CAMERA_USERNAME = 'admin'
const CAMERA_PASSWORD = '05010108Zz'
const CAMERA_CHANNEL = 1
const DEVICE_NAME = 'GHOST Hikvision E2E Agent'
const HEALTH_PORT = 8791
const POLL_TIMEOUT_MS = 600_000

async function main() {
  backupLocalAgentFiles()

  const bootstrap = await postJson(`${DEFAULT_API_BASE_URL}/api/auth/ghost-access`, {})
  const bootstrapAccessToken = bootstrap.accessToken
  const organizations = await getJson(`${DEFAULT_API_BASE_URL}/api/admin/organizations`, bootstrapAccessToken)
  const activeOrganization = organizations.find((organization) => organization.status === 'active')
  if (!activeOrganization) {
    throw new Error('No active organization is available on the hosted backend.')
  }

  const now = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
  const channelName = `Hikvision E2E ${stamp}`
  const operationName = `Hikvision Snapshot ${stamp}`
  const tempUsername = `hik_e2e_${stamp}`.toLowerCase()
  const tempPassword = `E2E-${stamp}-Zz9`

  await postJson(
    `${DEFAULT_API_BASE_URL}/api/admin/users`,
    {
      organizationId: activeOrganization.id,
      username: tempUsername,
      firstName: 'Hikvision',
      lastName: 'E2E',
      password: tempPassword,
      role: 'system_manager',
      allowedChannelIds: [],
      blockedChannelIds: [],
    },
    bootstrapAccessToken,
  )

  const tenantAuth = await postJson(
    `${DEFAULT_API_BASE_URL}/api/auth/login`,
    {
      username: tempUsername,
      password: tempPassword,
    },
  )
  const tenantAccessToken = tenantAuth.accessToken
  const organizationName = tenantAuth.profile.organizationName

  const channel = await postJson(
    `${DEFAULT_API_BASE_URL}/api/channels`,
    {
      name: channelName,
      type: 'personal',
      subtitle: 'Automated Hikvision e2e validation',
      location: 'Local client lab',
      watchScope: 'Validate Hikvision SDK snapshot through local agent',
      description: 'Temporary end-to-end validation channel',
      memoryInterval: 30,
      rtspFeed: '',
      liveState: 'OFFLINE',
      cameraEnabled: false,
      captureMode: 'local_agent',
      linkedChannelIds: [],
      members: [],
      isBlocked: false,
    },
    tenantAccessToken,
  )

  const operation = await postJson(
    `${DEFAULT_API_BASE_URL}/api/channels/${encodeURIComponent(channel.id)}/operations`,
    {
      name: operationName,
      mode: 'report',
      schedule: 'Every 30 seconds',
      trigger: 'Run scheduled Hikvision snapshot validation.',
      action: 'Describe the visible scene in one short operational sentence.',
      modelOverride: 'gpt-4.1-mini',
      detailLevel: 'low',
      enabled: true,
      parsedSchedule: {
        type: 'interval',
        intervalMs: 30_000,
      },
    },
    tenantAccessToken,
  )

  const connectResponse = await GhostApiClient.connect(DEFAULT_API_BASE_URL, organizationName, DEVICE_NAME)
  const savedBase = {
    organizationId: connectResponse.organizationId,
    organizationName: connectResponse.organizationName,
    apiBaseUrl: DEFAULT_API_BASE_URL,
    accessToken: connectResponse.accessToken,
    refreshToken: connectResponse.refreshToken,
    username: connectResponse.profile.username,
    deviceId: connectResponse.deviceId,
    deviceName: DEVICE_NAME,
    cameras: [],
    bindings: [],
    channelId: channel.id,
    channelName: channel.name,
    cameraName: undefined,
    boundAtIso: new Date().toISOString(),
    defaultCameraId: undefined,
  }

  const cameraId = `hikvision-sdk-${stamp}`
  const camera = {
    cameraId,
    label: `Hikvision ${CAMERA_HOST}`,
    enabled: true,
    createdAtIso: new Date().toISOString(),
    updatedAtIso: new Date().toISOString(),
    source: {
      type: 'hikvision-sdk',
      host: CAMERA_HOST,
      port: CAMERA_PORT,
      username: CAMERA_USERNAME,
      password: CAMERA_PASSWORD,
      channel: CAMERA_CHANNEL,
    },
  }

  const savedWithCamera = await upsertCamera(savedBase, camera)
  const agentApi = new GhostApiClient({
    apiBaseUrl: DEFAULT_API_BASE_URL,
    accessToken: connectResponse.accessToken,
    refreshToken: connectResponse.refreshToken,
  })

  await agentApi.bindChannel({
    channelId: channel.id,
    deviceId: connectResponse.deviceId,
    deviceName: DEVICE_NAME,
    cameraId,
    cameraLabel: camera.label,
    cameraSourceType: 'hikvision-sdk',
  })

  const savedConfig = {
    ...savedWithCamera,
    accessToken: connectResponse.accessToken,
    refreshToken: connectResponse.refreshToken,
    username: connectResponse.profile.username,
    deviceId: connectResponse.deviceId,
    deviceName: DEVICE_NAME,
    channelId: channel.id,
    channelName: channel.name,
    boundAtIso: new Date().toISOString(),
    bindings: [{ channelId: channel.id, cameraId }],
    defaultCameraId: cameraId,
    cameraName: camera.label,
  }

  saveLocalConfig(savedConfig)
  const runtimeSaved = await resolveAgentSecrets(savedConfig)
  const config = buildConfigFromSaved(runtimeSaved)
  const state = {
    startedAtIso: new Date().toISOString(),
    status: 'starting',
    scannedOperations: 0,
  }

  const worker = new LocalCameraWorker(
    {
      ...config,
      pollIntervalMs: 5_000,
      healthPort: HEALTH_PORT,
    },
    state,
  )

  try {
    await worker.start()
    const result = await waitForScheduledMessage(channel.id, operationName, tenantAccessToken)
    console.log(JSON.stringify({
      ok: true,
      organizationName,
      organizationId: activeOrganization.id,
      channelId: channel.id,
      channelName: channel.name,
      operationId: operation.id,
      operationName,
      cameraId,
      deviceId: connectResponse.deviceId,
      tenantUsername: tempUsername,
      messageId: result.id ?? null,
      messageText: result.text,
      framePrefix: typeof result.frameDataUrl === 'string' ? result.frameDataUrl.slice(0, 32) : null,
      frameLength: typeof result.frameDataUrl === 'string' ? result.frameDataUrl.length : 0,
      runtimeStatus: state.status,
      scannedOperations: state.scannedOperations,
    }, null, 2))
  } finally {
    worker.stop()
  }
}

async function waitForScheduledMessage(channelId, operationName, accessToken) {
  const deadline = Date.now() + POLL_TIMEOUT_MS
  let lastPayload = null
  while (Date.now() < deadline) {
    const channel = await getJson(`${DEFAULT_API_BASE_URL}/api/channels/${encodeURIComponent(channelId)}`, accessToken)
    lastPayload = channel
    const message = Array.isArray(channel.messages)
      ? [...channel.messages].reverse().find((entry) =>
          entry?.author === 'system' &&
          typeof entry?.text === 'string' &&
          entry.text.includes(operationName) &&
          typeof entry?.frameDataUrl === 'string' &&
          entry.frameDataUrl.startsWith('data:image/jpeg;base64,'))
      : null
    if (message) {
      return message
    }
    await delay(3_000)
  }

  const agentState = lastPayload?.localAgentStatus?.state ?? 'unknown'
  const agentError = lastPayload?.localAgentStatus?.lastError ?? 'none'
  throw new Error(`Timed out waiting for scheduled operation message. localAgentStatus=${agentState}, lastError=${agentError}`)
}

function backupLocalAgentFiles() {
  const files = [
    'ghost-agent.runtime.json',
    'ghost-camera-secrets.runtime.json',
  ]
  for (const file of files) {
    const sourcePath = resolve(process.cwd(), file)
    if (!existsSync(sourcePath)) {
      continue
    }
    const backupPath = resolve(process.cwd(), `${file}.bak-e2e`)
    copyFileSync(sourcePath, backupPath)
  }
}

async function getJson(url, accessToken) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed: ${response.status}`)
  }
  return payload
}

async function postJson(url, body, accessToken) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed: ${response.status}`)
  }
  return payload
}

await main()
