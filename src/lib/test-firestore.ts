// Create a test file: src/lib/test-firestore.ts
import { db } from './firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'

export const testFirestoreConnection = async () => {
  try {
    console.log('Testing Firestore connection...')
    
    // Try to write a test document
    const testDocRef = doc(db, 'test', 'connection')
    await setDoc(testDocRef, {
      message: 'Hello Firestore!',
      timestamp: new Date(),
    })
    
    console.log('✅ Write test successful')
    
    // Try to read it back
    const docSnap = await getDoc(testDocRef)
    if (docSnap.exists()) {
      console.log('✅ Read test successful:', docSnap.data())
      return true
    } else {
      console.log('❌ Document not found')
      return false
    }
  } catch (error) {
    console.error('❌ Firestore test failed:', error)
    return false
  }
}

// Test function to call from browser console
if (typeof window !== 'undefined') {
  (window as any).testFirestore = testFirestoreConnection
}