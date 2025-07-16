import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

// Initialize Firebase Admin (server-side only)
let adminAuth: ReturnType<typeof getAuth>

try {
  if (getApps().length === 0) {
    console.log('🔥 Firebase Admin - Initializing...')
    
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }

    // Debug logging for production
    console.log('Firebase Admin Environment Check:')
    console.log('  PROJECT_ID:', !!serviceAccount.projectId)
    console.log('  CLIENT_EMAIL:', !!serviceAccount.clientEmail)
    console.log('  PRIVATE_KEY:', !!serviceAccount.privateKey)
    console.log('  NODE_ENV:', process.env.NODE_ENV)
    console.log('  VERCEL:', !!process.env.VERCEL)

    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      })
      console.log('✅ Firebase Admin initialized successfully')
      adminAuth = getAuth()
    } else {
      console.warn('⚠️ Firebase Admin not initialized - missing environment variables')
      throw new Error('Firebase Admin missing environment variables')
    }
  } else {
    console.log('🔥 Firebase Admin already initialized')
    adminAuth = getAuth()
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error)
  
  // Create a fallback auth object for production
  adminAuth = {
    verifyIdToken: async (idToken: string) => {
      // In production, you might want to implement a different auth strategy
      // or throw a more specific error
      console.error('Firebase Admin not available, token verification failed')
      throw new Error('Authentication service unavailable. Please check server configuration.')
    }
  } as any
}

export { adminAuth }