// Replace your /src/app/api/positions/route.ts with this version
import { NextRequest, NextResponse } from 'next/server';
import { db, dbHelpers } from '@/lib/db';
import { stockApi } from '@/lib/stockApi';
import { requireAuth } from '@/lib/auth-helpers';

// GET /api/positions - Get user's positions
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const userId = await requireAuth(request);
    console.log('🔍 Fetching positions for user:', userId);

    const searchParams = request.nextUrl.searchParams;
    const updatePrices = searchParams.get('updatePrices') === 'true';

    // Get positions ONLY for this specific user
    const positions = await db.position.findMany({
      where: { userId }, // User isolation
      orderBy: { updatedAt: 'desc' },
    });

    console.log(`✅ Found ${positions.length} positions for user ${userId}`);

    // Update prices if requested and we have positions
    if (updatePrices && positions.length > 0) {
      console.log('📈 Updating prices for user positions...');
      
      try {
        const tickers = positions.map(p => p.ticker);
        const quotes = await stockApi.getMultipleQuotes(tickers);
        
        // Update positions with current prices
        const updatePromises = positions.map(async (position) => {
          const quote = quotes[position.ticker];
          
          if (quote && quote.c > 0) {
            const currentPrice = quote.c;
            const currentValue = position.totalShares * currentPrice;
            const unrealizedPnL = currentValue - position.totalCost;
            const unrealizedPnLPercent = position.totalCost > 0 ? (unrealizedPnL / position.totalCost) * 100 : 0;

            return db.position.update({
              where: { 
                id: position.id,
                userId: userId // Double-check user isolation
              },
              data: {
                currentPrice: currentPrice,
                lastPriceUpdate: new Date(),
                unrealizedPnL: unrealizedPnL,
                unrealizedPnLPercent: unrealizedPnLPercent,
                updatedAt: new Date(),
              },
            });
          }
          return null;
        });

        await Promise.all(updatePromises);
        console.log('✅ Prices updated successfully for user:', userId);

        // Fetch updated positions for this user only
        const updatedPositions = await db.position.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
        });

        // Get portfolio stats for this user only
        const portfolioStats = await dbHelpers.getUserPortfolioStats(userId);

        return NextResponse.json({ 
          positions: updatedPositions, 
          portfolioStats 
        });

      } catch (priceError) {
        console.error('❌ Error updating prices for user:', userId, priceError);
        // Return positions without updated prices if price update fails
      }
    }

    // Get portfolio stats for this user only
    const portfolioStats = await dbHelpers.getUserPortfolioStats(userId);

    return NextResponse.json({ 
      positions, 
      portfolioStats 
    });
  } catch (error) {
    console.error('❌ Error fetching positions:', error);
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}

// POST /api/positions - Create or update position for authenticated user
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const userId = await requireAuth(request);
    console.log('🔍 Creating/updating position for user:', userId);

    const body = await request.json();
    const { ticker, shares, averagePrice } = body;

    if (!ticker || shares === undefined || !averagePrice) {
      return NextResponse.json(
        { error: 'Missing required fields: ticker, shares, averagePrice' },
        { status: 400 }
      );
    }

    // Get current price for the stock
    let currentPrice = averagePrice;
    try {
      const quote = await stockApi.getQuote(ticker);
      if (quote && quote.c > 0) {
        currentPrice = quote.c;
      }
    } catch (error) {
      console.warn(`Could not fetch current price for ${ticker}, using average price`);
    }

    const totalCost = shares * averagePrice;
    const currentValue = shares * currentPrice;
    const unrealizedPnL = currentValue - totalCost;
    const unrealizedPnLPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;

    // Create or update position for this specific user
    const position = await db.position.upsert({
      where: {
        userId_ticker: {
          userId, // Ensure position belongs to authenticated user
          ticker,
        },
      },
      update: {
        totalShares: shares,
        averagePrice,
        totalCost,
        currentPrice,
        lastPriceUpdate: new Date(),
        unrealizedPnL,
        unrealizedPnLPercent,
        updatedAt: new Date(),
      },
      create: {
        userId, // Ensure position belongs to authenticated user
        ticker,
        company: ticker, // You might want to fetch the company name
        totalShares: shares,
        averagePrice,
        totalCost,
        currentPrice,
        lastPriceUpdate: new Date(),
        unrealizedPnL,
        unrealizedPnLPercent,
        updatedAt: new Date(),
      },
    });

    console.log('✅ Position created/updated for user:', userId);

    return NextResponse.json({ position });
  } catch (error) {
    console.error('❌ Error creating/updating position:', error);
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create/update position' },
      { status: 500 }
    );
  }
}