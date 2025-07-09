// lib/firebase.ts (Improved version - optional)
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Debug: Log the configuration (you can remove this in production)
console.log('🔥 Firebase Config Debug:', {
  apiKey: firebaseConfig.apiKey ? '✅ Set' : '❌ Missing',
  authDomain: firebaseConfig.authDomain || '❌ Missing',
  projectId: firebaseConfig.projectId || '❌ Missing',
  storageBucket: firebaseConfig.storageBucket ? '✅ Set' : '❌ Missing',
  messagingSenderId: firebaseConfig.messagingSenderId ? '✅ Set' : '❌ Missing',
  appId: firebaseConfig.appId ? '✅ Set' : '❌ Missing',
})

// Validate required fields
if (!firebaseConfig.projectId) {
  throw new Error('❌ Firebase projectId is missing! Check your .env.local file')
}

if (!firebaseConfig.apiKey) {
  throw new Error('❌ Firebase apiKey is missing! Check your .env.local file')
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Auth
export const auth = getAuth(app)

// Initialize Firestore
export const db = getFirestore(app)

// Debug: Log successful initialization
console.log('🔥 Firebase initialized successfully!')
console.log('📄 Firestore app:', db.app.name)
console.log('🆔 Project ID:', firebaseConfig.projectId) // Safe way to log project ID

// Optional: Add connection test (remove in production)
if (typeof window !== 'undefined') {
  // Only run in browser
  console.log('🌐 Firebase running in browser environment')
}

export default app