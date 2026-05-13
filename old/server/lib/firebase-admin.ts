import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getDatabase, type Database } from 'firebase-admin/database'
import { getAuth } from 'firebase-admin/auth'
import { resolveFirebaseDatabaseUrl, resolveFirebaseProjectId } from './firebase-env'

const PROJECT_ID = resolveFirebaseProjectId()
const RTDB_URL = resolveFirebaseDatabaseUrl()

function initAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0]
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()

  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson) as object
    return initializeApp({
      credential: cert(serviceAccount as Parameters<typeof cert>[0]),
      ...(PROJECT_ID ? { projectId: PROJECT_ID } : {}),
      ...(RTDB_URL ? { databaseURL: RTDB_URL } : {}),
    })
  }

  // מצב ריצה על Cloud Functions — Application Default Credentials
  return initializeApp({
    ...(PROJECT_ID ? { projectId: PROJECT_ID } : {}),
    ...(RTDB_URL ? { databaseURL: RTDB_URL } : {}),
  })
}

const adminApp = initAdminApp()

export const adminDb = getFirestore(adminApp)
export const adminAuth = getAuth(adminApp)

let adminRtdbInstance: Database | null = null

export function getAdminRtdb(): Database {
  if (!RTDB_URL) {
    throw new Error('FIREBASE_DATABASE_URL is required before accessing Firebase Realtime Database.')
  }
  adminRtdbInstance ??= getDatabase(adminApp)
  return adminRtdbInstance
}

export default adminApp
