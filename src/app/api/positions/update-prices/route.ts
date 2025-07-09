// Replace your /src/app/api/positions/update-prices/route.ts with this version
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stockApi } from '@/lib/stockApi';
import { requireAuth } from '@/lib/auth-helpers';

// POST /api/positions/update-prices - Update current prices for user's positions only
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const userId = await requireAuth(request);
    console.log('🔍 Updating prices for user:', userId);

    // Get positions for this specific user only
    const positions = await db.position.findMany({
      where: { userId }, // User isolation
      select: {
        id: true,
        ticker: true,
        totalShares: true,
        averagePrice: true,
        totalCost: true,
      },
    });

    if (positions.length === 0) {
      return NextResponse.json({ 
        message: 'No positions to update for this user',
        updatedCount: 0 
      });
    }

    console.log(`📈 Updating prices for ${positions.length} positions for user ${userId}...`);

    // Get all tickers for this user
    const tickers = positions.map(p => p.ticker);
    
    // Fetch current prices for all positions
    const quotes = await stockApi.getMultipleQuotes(tickers);
    
    let updatedCount = 0;
    const errors: string[] = [];

    // Update each position with current price and calculate P&L
    for (const position of positions) {
      try {
        const quote = quotes[position.ticker];
        
        if (quote && quote.c > 0) {
          const currentPrice = quote.c;
          const currentValue = position.totalShares * currentPrice;
          const unrealizedPnL = currentValue - position.totalCost;
          const unrealizedPnLPercent = position.totalCost > 0 ? (unrealizedPnL / position.totalCost) * 100 : 0;

          // Update position with user isolation double-check
          await db.position.update({
            where: { 
              id: position.id,
              userId: userId // Extra security: ensure we only update user's own positions
            },
            data: {
              currentPrice: currentPrice,
              lastPriceUpdate: new Date(),
              unrealizedPnL: unrealizedPnL,
              unrealizedPnLPercent: unrealizedPnLPercent,
              updatedAt: new Date(),
            },
          });

          updatedCount++;
          console.log(`✅ Updated ${position.ticker} for user ${userId}: $${currentPrice.toFixed(2)} (P&L: ${unrealizedPnL >= 0 ? '+' : ''}$${unrealizedPnL.toFixed(2)})`);
        } else {
          errors.push(`Failed to get price for ${position.ticker}`);
          console.warn(`⚠️ No price data for ${position.ticker} (user: ${userId})`);
        }
      } catch (error) {
        errors.push(`Error updating ${position.ticker}: ${error}`);
        console.error(`❌ Error updating ${position.ticker} for user ${userId}:`, error);
      }
    }

    console.log(`✅ Updated ${updatedCount} of ${positions.length} positions for user ${userId}`);

    return NextResponse.json({
      message: `Updated prices for ${updatedCount} of ${positions.length} positions`,
      updatedCount,
      totalPositions: positions.length,
      userId: userId, // Include for debugging
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('❌ Error updating position prices:', error);
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update position prices' },
      { status: 500 }
    );
  }
}