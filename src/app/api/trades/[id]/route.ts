import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { tradeOps, positionOps, userOps } from '@/lib/db-operations'

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    
    const user = await userOps.getUserByFirebaseUid(decodedToken.uid)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Extract the trade ID from the URL
    const url = new URL(request.url)
    const id = url.pathname.split('/').pop() // last segment is the ID

    if (!id) {
      return NextResponse.json({ error: 'Missing trade ID' }, { status: 400 })
    }

    const tradeToDelete = await tradeOps.getTradeById(id, user.id)
    if (!tradeToDelete) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    const ticker = tradeToDelete.ticker

    const deleted = await tradeOps.deleteTrade(id, user.id)
    if (!deleted) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    await positionOps.recalculatePosition(user.id, ticker)

    return NextResponse.json({ message: 'Trade deleted successfully' })
  } catch (error) {
    console.error('Error deleting trade:', error)
    return NextResponse.json(
      { error: 'Failed to delete trade' },
      { status: 500 }
    )
  }
}
