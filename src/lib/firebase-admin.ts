import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

// Initialize Firebase Admin (server-side only)
let adminAuth: ReturnType<typeof getAuth>

try {
  if (getApps().length === 0) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }

    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      })
      console.log('✅ Firebase Admin initialized successfully')
    } else {
      console.warn('⚠️ Firebase Admin not initialized - missing environment variables')
      throw new Error('Firebase Admin missing environment variables')
    }
  }

  // Only get auth if initialization was successful
  adminAuth = getAuth()
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error)
  
  // Create a fallback auth object that will throw meaningful errors
  adminAuth = {
    verifyIdToken: async () => {
      throw new Error('Firebase Admin not properly initialized. Check your environment variables.')
    }
  } as any
}

export { adminAuth }