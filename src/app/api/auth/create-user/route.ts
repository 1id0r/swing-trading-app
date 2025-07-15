import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { userOps } from '@/lib/db-operations'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    
    const { uid, email, name } = decodedToken

    const user = await userOps.createOrUpdateUser(uid, email || '', name)

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error creating/updating user:', error)
    return NextResponse.json(
      { error: 'Failed to create/update user' },
      { status: 500 }
    )
  }
}