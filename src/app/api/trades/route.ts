// src/app/api/trades/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db, dbHelpers } from '@/lib/db';

// Helper function to get userId from request
async function getUserId(request: NextRequest): Promise<string> {
  try {
    const firstUser = await db.user.findFirst();
    if (firstUser) {
      return firstUser.id;
    }
    
    // If no users exist, create a default one
    const defaultUser = await db.user.create({
      data: {
        firebaseUid: 'default-user',
        email: 'user@example.com',
        displayName: 'Default User',
      },
    });
    
    return defaultUser.id;
  } catch (error) {
    console.error('Error getting user ID:', error);
    throw new Error('Unable to determine user ID');
  }
}

// GET /api/trades - Get all trades
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ticker = searchParams.get('ticker');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user ID
    const userId = await getUserId(request);

    const trades = await db.trade.findMany({
      where: { 
        userId,
        ...(ticker && { ticker })
      },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.trade.count({
      where: { 
        userId,
        ...(ticker && { ticker })
      },
    });

    return NextResponse.json({
      trades,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}

// POST /api/trades - Create new trade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
    } = body;

    // Validate required fields
    if (!ticker || !company || !action || !shares || !pricePerShare || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user ID
    const userId = await getUserId(request);

    // Calculate trade totals
    const totalValue = shares * pricePerShare;
    const totalCost = action === 'BUY' 
      ? totalValue + (fee || 0)  // Add fee for buys
      : totalValue - (fee || 0); // Subtract fee for sells

    let costBasis = null;
    let grossProfit = null;
    let netProfit = null;
    let taxAmount = null;

    // For sell trades, calculate P&L using FIFO
    if (action === 'SELL') {
      try {
        costBasis = await dbHelpers.calculateFIFOCostBasis(
          ticker,
          shares,
          new Date(date),
          userId
        );
        
        const saleRevenue = totalValue;
        grossProfit = saleRevenue - costBasis;
        
        // Get user's tax rate
        const settings = await dbHelpers.getUserSettings(userId);
        taxAmount = grossProfit > 0 ? (grossProfit * settings.taxRate) / 100 : 0;
        netProfit = grossProfit - (fee || 0) - taxAmount;
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'FIFO calculation failed' },
          { status: 400 }
        );
      }
    }

    // Create the trade
    const trade = await db.trade.create({
      data: {
        userId,
        ticker: ticker.toUpperCase(),
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
    });

    // Update the position for this ticker
    await dbHelpers.updatePosition(ticker.toUpperCase(), userId);

    return NextResponse.json({ trade }, { status: 201 });
  } catch (error) {
    console.error('Error creating trade:', error);
    return NextResponse.json(
      { error: 'Failed to create trade' },
      { status: 500 }
    );
  }
}