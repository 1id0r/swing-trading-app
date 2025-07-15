import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { positionOps, userOps } from '@/lib/db-operations'

export async function POST(request: NextRequest) {
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

    // Get user's positions
    const positions = await positionOps.getPositionsByUser(user.id)
    
    if (positions.length === 0) {
      return NextResponse.json({ message: 'No positions to update' })
    }

    // Extract unique tickers
    const tickers = [...new Set(positions.map(p => p.ticker))]
    
    // Fetch current prices (using your existing stock API)
    const priceUpdates = []
    const timestamp = new Date()
    
    for (const ticker of tickers) {
      try {
        // You can integrate your existing stock price API here
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/stocks/quote?symbol=${ticker}`)
        if (response.ok) {
          const data = await response.json()
          if (data.price) {
            priceUpdates.push({
              ticker,
              price: data.price,
              timestamp
            })
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch price for ${ticker}:`, error)
      }
    }

    if (priceUpdates.length > 0) {
      await positionOps.updatePositionPrices(priceUpdates)
    }

    return NextResponse.json({ 
      message: `Updated prices for ${priceUpdates.length} positions`,
      updatedTickers: priceUpdates.map(u => u.ticker)
    })
  } catch (error) {
    console.error('Error updating position prices:', error)
    return NextResponse.json(
      { error: 'Failed to update position prices' },
      { status: 500 }
    )
  }
}
