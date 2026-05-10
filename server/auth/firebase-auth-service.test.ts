import { afterEach, describe, expect, it } from 'vitest'
import { readFirebaseWebApiKey } from './firebase-auth-service'

const envKeys = [
  'GHOST_FIREBASE_WEB_API_KEY',
  'FIREBASE_WEB_API_KEY',
  'VITE_FIREBASE_API_KEY',
  'FIREBASE_PROJECT_ID',
  'GCLOUD_PROJECT',
  'GOOGLE_CLOUD_PROJECT',
] as const

function resetEnv() {
  for (const key of envKeys) {
    delete process.env[key]
  }
}

afterEach(() => {
  resetEnv()
})

describe('readFirebaseWebApiKey', () => {
  it('prefers the explicit backend key when it is present', () => {
    process.env.GHOST_FIREBASE_WEB_API_KEY = 'backend-key'
    process.env.GOOGLE_CLOUD_PROJECT = 'ghost-test-app-b906c'

    expect(readFirebaseWebApiKey()).toBe('backend-key')
  })

  it('falls back to the known project api key for ghost-test-app-b906c', () => {
    process.env.GOOGLE_CLOUD_PROJECT = 'ghost-test-app-b906c'

    expect(readFirebaseWebApiKey()).toBe('AIzaSyBuF9AcPj7W4iRhVuQAuyW00026i4NlhKs')
  })

  it('throws when no supported key source is available', () => {
    expect(() => readFirebaseWebApiKey()).toThrow('GHOST_FIREBASE_WEB_API_KEY')
  })
})
