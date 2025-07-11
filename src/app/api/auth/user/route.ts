import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const idToken = authHeader.replace('Bearer ', '')
    
    // Verify Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    
    // Get or create user in database
    let user = await db.user.findUnique({
      where: { firebaseUid: decodedToken.uid }
    })

    if (!user) {
      // Create new user
      user = await db.user.create({
        data: {
          firebaseUid: decodedToken.uid,
          email: decodedToken.email || '',
          displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'User'
        }
      })
      console.log('✅ Created new user:', user.email)
    } else {
      console.log('✅ Found existing user:', user.email)
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('❌ Auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
  }
}