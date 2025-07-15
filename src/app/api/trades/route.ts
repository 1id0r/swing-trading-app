import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { tradeOps, positionOps, userOps } from '@/lib/db-operations'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    
    // Get user ID from database using Firebase UID
    const user = await userOps.getUserByFirebaseUid(decodedToken.uid)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const url = new URL(request.url)
    const ticker = url.searchParams.get('ticker') || undefined
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    const { trades, total } = await tradeOps.getTradesByUser(user.id, {
      ticker,
      limit,
      offset
    })

    return NextResponse.json({
      trades,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching trades:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    )
  }
}

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

    const body = await request.json()
    const {
      ticker,
      company,
      action,
      shares,
      pricePerShare,
      fee = 0,
      currency = 'USD',
      logo,
      date
    } = body

    // Validate required fields
    if (!ticker || !company || !action || !shares || !pricePerShare || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate totals
    const totalValue = shares * pricePerShare
    const totalCost = totalValue + fee

    // Create trade
    const trade = await tradeOps.createTrade({
      userId: user.id,
      ticker,
      company,
      action,
      shares,
      pricePerShare,
      fee,
      currency,
      logo,
      date: new Date(date),
      totalValue,
      totalCost
    })

    // Recalculate position
    await positionOps.recalculatePosition(user.id, ticker)

    return NextResponse.json({ trade }, { status: 201 })
  } catch (error) {
    console.error('Error creating trade:', error)
    return NextResponse.json(
      { error: 'Failed to create trade' },
      { status: 500 }
    )
  }
}
