import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { dashboardOps, userOps } from '@/lib/db-operations'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    
    // Get user ID from database
    const user = await userOps.getUserByFirebaseUid(decodedToken.uid)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const stats = await dashboardOps.getDashboardStats(user.id)

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}