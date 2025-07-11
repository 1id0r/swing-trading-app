// src/app/api/trades/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server'
import { db, dbHelpers } from '@/lib/db'
import { requireAuth } from '@/lib/auth' // ✅ NEW import

// GET /api/trades - Get all trades for authenticated user
export async function GET(request: NextRequest) {
  try {
    // ✅ NEW: Use unified auth - returns user object
    const user = await requireAuth(request)
    console.log('🔍 Fetching trades for user:', user.id)

    const searchParams = request.nextUrl.searchParams
    const ticker = searchParams.get('ticker')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get trades ONLY for this specific user
    const trades = await db.trade.findMany({
      where: { 
        userId: user.id, // ✅ Use user.id from auth
        ...(ticker && { ticker })
      },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    })

    // Count total trades for this user only
    const total = await db.trade.count({
      where: { 
        userId: user.id,
        ...(ticker && { ticker })
      },
    })

    console.log(`✅ Found ${trades.length} trades for user ${user.id}`)

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
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
    // ✅ NEW: Use unified auth - returns user object
    const user = await requireAuth(request)
    console.log('🔍 Creating trade for user:', user.id)

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
          user.id // ✅ Use user.id from auth
        )
        
        grossProfit = totalValue - costBasis
        const settings = await dbHelpers.getUserSettings(user.id)
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
        userId: user.id, // ✅ Use user.id from auth
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
    await dbHelpers.updatePosition(ticker, user.id)

    console.log('✅ Trade created successfully for user:', user.id)

    return NextResponse.json({ trade })
  } catch (error) {
    console.error('❌ Error creating trade:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create trade' },
      { status: 500 }
    )
  }
}