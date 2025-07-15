// File: /src/app/api/auth/user/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { userOps } from '@/lib/db-operations'

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Auth user endpoint called')
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ No authorization header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    console.log('🔍 Token received:', token.substring(0, 20) + '...')
    
    const decodedToken = await adminAuth.verifyIdToken(token)
    console.log('✅ Token verified for user:', decodedToken.uid)
    
    const { uid, email, name } = decodedToken

    // Create or update user in database
    console.log('📝 Creating/updating user in database...')
    const user = await userOps.createOrUpdateUser(uid, email || '', name)
    console.log('✅ User created/updated:', user.id)

    return NextResponse.json({ user })
  } catch (error) {
    console.error('❌ Error creating/updating user:', error)
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { error: 'Failed to get/create database user' },
      { status: 500 }
    )
  }
}

// Also support GET for debugging
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    
    // Just get the user, don't create
    const user = await userOps.getUserByFirebaseUid(decodedToken.uid)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error getting user:', error)
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    )
  }
}