import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getAnalytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL ?? '',
}

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const firebaseAuth = getAuth(firebaseApp)
export const realtimeDb = getDatabase(firebaseApp)

if (typeof window !== 'undefined') {
  void isSupported().then((supported) => {
    if (supported) {
      getAnalytics(firebaseApp)
    }
  })
}

export default firebaseApp
