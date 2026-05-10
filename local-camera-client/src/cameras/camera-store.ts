import type { SavedAgentConfig } from '../local-store.js'
import type { CameraSource, HikvisionSdkCameraSource, RtspCameraSource, SavedCameraConfig } from '../types.js'
import { clearLocalConfig, loadLocalConfig, normalizeSavedConfig, saveLocalConfig } from '../local-store.js'
import { createSecretRef, deleteSecrets, loadSecret, saveSecret, clearSecretStore } from './security/secret-store.js'

export function loadMaskedAgentConfig(): SavedAgentConfig | null {
  return loadLocalConfig()
}

export async function loadRuntimeAgentConfig(): Promise<SavedAgentConfig | null> {
  const saved = loadLocalConfig()
  if (!saved) {
    return null
  }
  return resolveAgentSecrets(saved)
}

export async function resolveAgentSecrets(saved: SavedAgentConfig): Promise<SavedAgentConfig> {
  const cameras = await Promise.all(saved.cameras.map(resolveCameraSecrets))
  return normalizeSavedConfig({
    ...saved,
    cameras,
  })
}

export async function upsertCamera(saved: SavedAgentConfig, camera: SavedCameraConfig): Promise<SavedAgentConfig> {
  const sanitizedCamera = await sanitizeCameraForStorage(camera)
  const next = normalizeSavedConfig({
    ...saved,
    cameras: [
      ...saved.cameras.filter((item) => item.cameraId !== sanitizedCamera.cameraId),
      sanitizedCamera,
    ],
    defaultCameraId: saved.defaultCameraId ?? sanitizedCamera.cameraId,
  })
  saveLocalConfig(next)
  return next
}

export function deleteCamera(saved: SavedAgentConfig, cameraId: string): SavedAgentConfig {
  const camera = saved.cameras.find((item) => item.cameraId === cameraId)
  if (camera) {
    deleteSecrets(extractSecretRefs(camera.source))
  }
  const nextCameras = saved.cameras.filter((item) => item.cameraId !== cameraId)
  const nextBindings = saved.bindings.filter((binding) => binding.cameraId !== cameraId)
  const next = normalizeSavedConfig({
    ...saved,
    cameras: nextCameras,
    bindings: nextBindings,
    defaultCameraId: saved.defaultCameraId === cameraId ? nextCameras[0]?.cameraId : saved.defaultCameraId,
  })
  saveLocalConfig(next)
  return next
}

export function clearAgentStorage(): void {
  clearLocalConfig()
  clearSecretStore()
}

export async function sanitizeCameraForStorage(camera: SavedCameraConfig): Promise<SavedCameraConfig> {
  switch (camera.source.type) {
    case 'usb-dshow':
      return {
        ...camera,
        enabled: camera.enabled ?? true,
      }
    case 'rtsp':
      return {
        ...camera,
        enabled: camera.enabled ?? true,
        source: await sanitizeRtspSource(camera.cameraId, camera.source),
      }
    case 'hikvision-sdk':
      return {
        ...camera,
        enabled: camera.enabled ?? true,
        source: await sanitizeHikvisionSource(camera.cameraId, camera.source),
      }
  }
}

async function sanitizeRtspSource(cameraId: string, source: RtspCameraSource): Promise<RtspCameraSource> {
  const normalizedUrl = new URL(source.url)
  const username = source.username?.trim() || normalizedUrl.username || undefined
  const password = source.password || normalizedUrl.password || undefined
  normalizedUrl.password = ''

  let passwordRef = source.passwordRef
  if (password) {
    passwordRef = source.passwordRef || await createSecretRef(`camera-${cameraId}-rtsp-password`)
    await saveSecret(passwordRef, password)
  }

  return {
    type: 'rtsp',
    url: normalizedUrl.toString(),
    transport: source.transport ?? 'tcp',
    username,
    passwordRef,
  }
}

async function sanitizeHikvisionSource(
  cameraId: string,
  source: HikvisionSdkCameraSource,
): Promise<HikvisionSdkCameraSource> {
  let passwordRef = source.passwordRef
  if (source.password) {
    passwordRef = source.passwordRef || await createSecretRef(`camera-${cameraId}-hikvision-password`)
    await saveSecret(passwordRef, source.password)
  }

  return {
    ...source,
    password: undefined,
    passwordRef,
  }
}

async function resolveCameraSecrets(camera: SavedCameraConfig): Promise<SavedCameraConfig> {
  switch (camera.source.type) {
    case 'usb-dshow':
      return camera
    case 'rtsp':
      return {
        ...camera,
        source: {
          ...camera.source,
          password: await loadSecret(camera.source.passwordRef),
        },
      }
    case 'hikvision-sdk':
      return {
        ...camera,
        source: {
          ...camera.source,
          password: await loadSecret(camera.source.passwordRef),
        },
      }
  }
}

function extractSecretRefs(source: CameraSource): string[] {
  switch (source.type) {
    case 'rtsp':
      return [source.passwordRef].filter((value): value is string => Boolean(value))
    case 'hikvision-sdk':
      return [source.passwordRef].filter((value): value is string => Boolean(value))
    case 'usb-dshow':
      return []
  }
}
