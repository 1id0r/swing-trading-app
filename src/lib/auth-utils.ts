
// src/lib/auth-utils.ts
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export interface AuthenticatedUser {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
}

/**
 * Get authenticated user from request headers
 * This function checks for the Firebase UID in headers and returns the corresponding database user
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Get Firebase UID from header (you'll need to send this from frontend)
    const firebaseUid = request.headers.get('x-firebase-uid');
    
    if (!firebaseUid) {
      console.log('❌ No Firebase UID in request headers');
      return null;
    }

    // Get user from database by Firebase UID
    const user = await db.user.findUnique({
      where: { firebaseUid },
      select: {
        id: true,
        firebaseUid: true,
        email: true,
        displayName: true,
      }
    });

    if (!user) {
      console.log('❌ No user found for Firebase UID:', firebaseUid);
      return null;
    }

    console.log('✅ Authenticated user:', user.email);
    return user;
  } catch (error) {
    console.error('❌ Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Require authentication for API routes
 * Returns the authenticated user or throws an error
 */
export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

/**
 * Alternative approach: Get user ID directly from headers
 * This is what your current /api/settings route expects
 */
export function getUserIdFromHeaders(request: NextRequest): string | null {
  return request.headers.get('x-user-id');
}

/**
 * Create standardized auth error response
 */
export function createAuthErrorResponse() {
  return Response.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}