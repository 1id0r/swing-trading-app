import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { tradeOps, positionOps, userOps } from '@/lib/db-operations'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const tradeId = params.id

    // Get trade details before deletion to recalculate position
    const tradeToDelete = await tradeOps.getTradeById(tradeId, user.id)
    
    if (!tradeToDelete) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    const ticker = tradeToDelete.ticker

    // Delete the trade
    const deleted = await tradeOps.deleteTrade(tradeId, user.id)
    
    if (!deleted) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    // Recalculate position for this ticker
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