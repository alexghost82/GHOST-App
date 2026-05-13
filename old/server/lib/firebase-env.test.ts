import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  hasFirebaseProjectConfig,
  readFirebaseRuntimeConfig,
  resolveFirebaseDatabaseUrl,
  resolveFirebaseProjectId,
} from './firebase-env'

const firebaseEnvKeys = [
  'FIREBASE_CONFIG',
  'FIREBASE_PROJECT_ID',
  'GCLOUD_PROJECT',
  'GOOGLE_CLOUD_PROJECT',
  'FIREBASE_DATABASE_URL',
] as const

function resetFirebaseEnv() {
  for (const key of firebaseEnvKeys) {
    delete process.env[key]
  }
}

afterEach(() => {
  resetFirebaseEnv()
  vi.restoreAllMocks()
})

describe('firebase-env', () => {
  it('resolves project and database URL from FIREBASE_CONFIG', () => {
    resetFirebaseEnv()
    process.env.FIREBASE_CONFIG = JSON.stringify({
      projectId: 'ghost-test-app-b906c',
      databaseURL: 'https://ghost-test-app-b906c-default-rtdb.firebaseio.com',
    })

    expect(readFirebaseRuntimeConfig()).toEqual({
      projectId: 'ghost-test-app-b906c',
      databaseURL: 'https://ghost-test-app-b906c-default-rtdb.firebaseio.com',
    })
    expect(resolveFirebaseProjectId()).toBe('ghost-test-app-b906c')
    expect(resolveFirebaseDatabaseUrl()).toBe('https://ghost-test-app-b906c-default-rtdb.firebaseio.com')
    expect(hasFirebaseProjectConfig()).toBe(true)
  })

  it('prefers explicit env vars over FIREBASE_CONFIG', () => {
    resetFirebaseEnv()
    process.env.FIREBASE_CONFIG = JSON.stringify({
      projectId: 'from-config',
      databaseURL: 'https://from-config.firebaseio.com',
    })
    process.env.FIREBASE_PROJECT_ID = 'from-env'
    process.env.FIREBASE_DATABASE_URL = 'https://from-env.firebaseio.com'

    expect(resolveFirebaseProjectId()).toBe('from-env')
    expect(resolveFirebaseDatabaseUrl()).toBe('https://from-env.firebaseio.com')
  })

  it('falls back to Google Cloud project env vars', () => {
    resetFirebaseEnv()
    process.env.GOOGLE_CLOUD_PROJECT = 'from-google-cloud'

    expect(resolveFirebaseProjectId()).toBe('from-google-cloud')
    expect(hasFirebaseProjectConfig()).toBe(true)
  })

  it('handles missing or malformed config without enabling Firebase mode', () => {
    resetFirebaseEnv()
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    expect(hasFirebaseProjectConfig()).toBe(false)

    process.env.FIREBASE_CONFIG = '{bad-json'

    expect(readFirebaseRuntimeConfig()).toEqual({})
    expect(hasFirebaseProjectConfig()).toBe(false)
  })
})
