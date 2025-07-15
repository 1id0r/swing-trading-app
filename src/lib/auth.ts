import { NextRequest } from 'next/server'
import { adminAuth } from './firebase-admin'
import { userOps } from './db-operations'

export interface AuthenticatedUser {
  id: string           // Database user ID
  firebaseUid: string  // Firebase UID
  email: string
  displayName: string  // Made required, will provide fallback
}

/**
 * Get authenticated user from Firebase ID token
 * This is the ONLY auth method we'll use
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid authorization header')
      return null
    }

    const idToken = authHeader.replace('Bearer ', '')
    
    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    
    // Get user from database using our PostgreSQL operations
    const user = await userOps.getUserByFirebaseUid(decodedToken.uid)

    if (!user) {
      console.log('❌ No database user found for Firebase UID:', decodedToken.uid)
      return null
    }

    console.log('✅ User authenticated:', user.email)
    
    // Return user with guaranteed displayName (fallback to email prefix if null)
    return {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0] || 'User'
    }
  } catch (error) {
    console.error('❌ Token verification failed:', error)
    return null
  }
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(request)
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}