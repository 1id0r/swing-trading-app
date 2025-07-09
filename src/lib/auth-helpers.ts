// Create: /src/lib/auth-helpers.ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    // Method 1: Check for x-user-id header (sent by frontend)
    const userIdFromHeader = request.headers.get('x-user-id')
    if (userIdFromHeader) {
      console.log('🔑 Found user ID in header:', userIdFromHeader)
      return userIdFromHeader
    }

    // Method 2: Get Firebase UID from Authorization header
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const firebaseUid = authHeader.substring(7) // Remove 'Bearer ' prefix
      console.log('🔑 Found Firebase UID in auth header:', firebaseUid)
      
      // Look up user by Firebase UID
      const user = await db.user.findUnique({
        where: { firebaseUid }
      })
      
      if (user) {
        console.log('✅ Found user by Firebase UID:', user.id)
        return user.id
      }
    }

    // Method 3: Get Firebase UID from custom header
    const firebaseUid = request.headers.get('x-firebase-uid')
    if (firebaseUid) {
      console.log('🔑 Found Firebase UID in custom header:', firebaseUid)
      
      const user = await db.user.findUnique({
        where: { firebaseUid }
      })
      
      if (user) {
        console.log('✅ Found user by Firebase UID:', user.id)
        return user.id
      }
    }

    console.log('❌ No user authentication found in request')
    return null
  } catch (error) {
    console.error('❌ Error getting user from request:', error)
    return null
  }
}

export async function requireAuth(request: NextRequest): Promise<string> {
  const userId = await getUserIdFromRequest(request)
  
  if (!userId) {
    throw new Error('Authentication required')
  }
  
  return userId
}