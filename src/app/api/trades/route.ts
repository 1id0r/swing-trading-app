// Replace your /src/app/api/trades/route.ts with this version
import { NextRequest, NextResponse } from 'next/server'
import { db, dbHelpers } from '@/lib/db'
import { getUserIdFromRequest, requireAuth } from '@/lib/auth-helpers'

// GET /api/trades - Get all trades for authenticated user
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const userId = await requireAuth(request)
    console.log('🔍 Fetching trades for user:', userId)

    const searchParams = request.nextUrl.searchParams
    const ticker = searchParams.get('ticker')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get trades ONLY for this specific user
    const trades = await db.trade.findMany({
      where: { 
        userId, // This ensures user isolation
        ...(ticker && { ticker })
      },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    })

    // Count total trades for this user only
    const total = await db.trade.count({
      where: { 
        userId,
        ...(ticker && { ticker })
      },
    })

    console.log(`✅ Found ${trades.length} trades for user ${userId}`)

    return NextResponse.json({
      trades,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('❌ Error fetching trades:', error)
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    )
  }
}

// POST /api/trades - Create new trade for authenticated user
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const userId = await requireAuth(request)
    console.log('🔍 Creating trade for user:', userId)

    const body = await request.json()
    const {
      ticker,
      company,
      logo,
      action,
      shares,
      pricePerShare,
      fee,
      currency,
      date,
    } = body

    // Validate required fields
    if (!ticker || !company || !action || !shares || !pricePerShare || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate trade totals
    const totalValue = shares * pricePerShare
    const totalCost = action === 'BUY' 
      ? totalValue + (fee || 0)
      : totalValue - (fee || 0)

    let costBasis = 0
    let grossProfit = 0
    let netProfit = 0
    let taxAmount = 0

    // Calculate P&L for sell trades
    if (action === 'SELL') {
      try {
        costBasis = await dbHelpers.calculateFIFOCostBasis(
          ticker,
          shares,
          new Date(date),
          userId // Pass userId for user isolation
        )
        
        grossProfit = totalValue - costBasis
        const settings = await dbHelpers.getUserSettings(userId)
        taxAmount = grossProfit > 0 ? (grossProfit * settings.taxRate) / 100 : 0
        netProfit = grossProfit - (fee || 0) - taxAmount
      } catch (error) {
        console.error('❌ FIFO calculation failed:', error)
        return NextResponse.json(
          { error: 'Failed to calculate cost basis' },
          { status: 400 }
        )
      }
    }

    // Create trade with proper user association
    const trade = await db.trade.create({
      data: {
        userId, // Ensure trade belongs to authenticated user
        ticker,
        company,
        logo,
        action,
        shares,
        pricePerShare,
        fee: fee || 0,
        currency: currency || 'USD',
        date: new Date(date),
        totalValue,
        totalCost,
        costBasis,
        grossProfit,
        netProfit,
        taxAmount,
      },
    })

    // Update position for this user
    await dbHelpers.updatePosition(ticker, userId)

    console.log('✅ Trade created successfully for user:', userId)

    return NextResponse.json({ trade })
  } catch (error) {
    console.error('❌ Error creating trade:', error)
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create trade' },
      { status: 500 }
    )
  }
}