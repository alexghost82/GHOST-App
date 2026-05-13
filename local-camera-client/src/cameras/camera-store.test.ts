// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SavedAgentConfig } from '../local-store.js'

const mocks = vi.hoisted(() => ({
  saveLocalConfig: vi.fn(),
  clearLocalConfig: vi.fn(),
  createSecretRef: vi.fn(),
  deleteSecrets: vi.fn(),
  loadSecret: vi.fn(),
  saveSecret: vi.fn(),
  clearSecretStore: vi.fn(),
}))

vi.mock('../local-store.js', async () => {
  const actual = await vi.importActual<typeof import('../local-store.js')>('../local-store.js')
  return {
    ...actual,
    loadLocalConfig: vi.fn(),
    saveLocalConfig: mocks.saveLocalConfig,
    clearLocalConfig: mocks.clearLocalConfig,
  }
})

vi.mock('./security/secret-store.js', () => ({
  createSecretRef: mocks.createSecretRef,
  deleteSecrets: mocks.deleteSecrets,
  loadSecret: mocks.loadSecret,
  saveSecret: mocks.saveSecret,
  clearSecretStore: mocks.clearSecretStore,
}))

import { deleteCamera, resolveAgentSecrets, upsertCamera } from './camera-store.js'

function buildSavedConfig(): SavedAgentConfig {
  return {
    organizationId: 'org-1',
    organizationName: 'Org',
    apiBaseUrl: 'https://example.com',
    accessToken: 'access',
    refreshToken: 'refresh',
    username: 'user',
    deviceId: 'device-1',
    deviceName: 'Desk Agent',
    cameras: [],
    bindings: [],
    defaultCameraId: undefined,
  }
}

describe('camera store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createSecretRef.mockResolvedValue('secret-ref-1')
    mocks.loadSecret.mockResolvedValue('restored-password')
  })

  it('stores RTSP passwords in the secret store and strips them from the saved URL', async () => {
    const result = await upsertCamera(buildSavedConfig(), {
      cameraId: 'rtsp-1',
      label: 'Yard Cam',
      enabled: true,
      createdAtIso: '2026-05-04T10:00:00.000Z',
      updatedAtIso: '2026-05-04T10:00:00.000Z',
      source: {
        type: 'rtsp',
        url: 'rtsp://admin:supersecret@10.0.0.8:554/Streaming/Channels/101',
      },
    })

    expect(mocks.createSecretRef).toHaveBeenCalledWith('camera-rtsp-1-rtsp-password')
    expect(mocks.saveSecret).toHaveBeenCalledWith('secret-ref-1', 'supersecret')
    expect(result.cameras[0].source).toEqual({
      type: 'rtsp',
      url: 'rtsp://admin@10.0.0.8:554/Streaming/Channels/101',
      transport: 'tcp',
      username: 'admin',
      passwordRef: 'secret-ref-1',
    })
    expect(mocks.saveLocalConfig).toHaveBeenCalledTimes(1)
  })

  it('restores secrets only for runtime camera resolution', async () => {
    const resolved = await resolveAgentSecrets({
      ...buildSavedConfig(),
      cameras: [
        {
          cameraId: 'hik-1',
          label: 'Gate Hikvision',
          enabled: true,
          createdAtIso: '2026-05-04T10:00:00.000Z',
          updatedAtIso: '2026-05-04T10:00:00.000Z',
          source: {
            type: 'hikvision-sdk',
            host: '10.0.0.40',
            port: 8000,
            username: 'admin',
            passwordRef: 'hik-secret',
            channel: 1,
          },
        },
      ],
    })

    expect(mocks.loadSecret).toHaveBeenCalledWith('hik-secret')
    expect(resolved.cameras[0].source).toEqual({
      type: 'hikvision-sdk',
      host: '10.0.0.40',
      port: 8000,
      username: 'admin',
      passwordRef: 'hik-secret',
      password: 'restored-password',
      channel: 1,
    })
  })

  it('removes secret refs when deleting a saved camera', () => {
    const result = deleteCamera(
      {
        ...buildSavedConfig(),
        cameras: [
          {
            cameraId: 'hik-1',
            label: 'Gate Hikvision',
            enabled: true,
            createdAtIso: '2026-05-04T10:00:00.000Z',
            updatedAtIso: '2026-05-04T10:00:00.000Z',
            source: {
              type: 'hikvision-sdk',
              host: '10.0.0.40',
              port: 8000,
              username: 'admin',
              passwordRef: 'hik-secret',
              channel: 1,
            },
          },
        ],
        bindings: [{ channelId: 'channel-1', cameraId: 'hik-1' }],
        defaultCameraId: 'hik-1',
      },
      'hik-1',
    )

    expect(mocks.deleteSecrets).toHaveBeenCalledWith(['hik-secret'])
    expect(result.cameras).toEqual([])
    expect(result.bindings).toEqual([])
    expect(result.defaultCameraId).toBeUndefined()
  })
})
