import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

/** False until .env.local is filled in. The app still renders (with demo data) so you can see the UI. */
export const firebaseReady = Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId)

const app = firebaseReady ? initializeApp(cfg) : null
export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
export const storage = app && cfg.storageBucket ? getStorage(app) : null

export function requireAuth() {
  if (!auth) throw new Error('Firebase is not configured. Fill in .env.local (see .env.example).')
  return auth
}
export function requireDb() {
  if (!db) throw new Error('Firebase is not configured. Fill in .env.local (see .env.example).')
  return db
}
export function requireStorage() {
  if (!storage) throw new Error('Firebase Storage is not configured. Set VITE_FIREBASE_STORAGE_BUCKET and deploy storage.rules.')
  return storage
}
