// src/app/api/positions/update-prices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stockApi } from '@/lib/stockApi';

// Helper function to get user ID (aligned with positions API)
async function getUserIdFromRequest(request: NextRequest): Promise<string> {
  // Try to get from headers first
  const userIdFromHeader = request.headers.get('x-user-id');
  if (userIdFromHeader) {
    return userIdFromHeader;
  }

  // Fallback: get or create default user (same as positions API)
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

// POST /api/positions/update-prices - Update current prices for all user positions
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);

    // Get all user positions that need price updates
    const positions = await db.position.findMany({
      where: { userId },
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
        message: 'No positions to update',
        updatedCount: 0 
      });
    }

    console.log(`📈 Updating prices for ${positions.length} positions...`);

    // Get all tickers
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
          const unrealizedPnLPercent = (unrealizedPnL / position.totalCost) * 100;

          await db.position.update({
            where: { id: position.id },
            data: {
              currentPrice: currentPrice,
              lastPriceUpdate: new Date(),
              unrealizedPnL: unrealizedPnL,
              unrealizedPnLPercent: unrealizedPnLPercent,
              updatedAt: new Date(),
            },
          });

          updatedCount++;
          console.log(`✅ Updated ${position.ticker}: $${currentPrice.toFixed(2)} (P&L: ${unrealizedPnL >= 0 ? '+' : ''}$${unrealizedPnL.toFixed(2)})`);
        } else {
          errors.push(`Failed to get price for ${position.ticker}`);
          console.warn(`⚠️ No price data for ${position.ticker}`);
        }
      } catch (error) {
        errors.push(`Error updating ${position.ticker}: ${error}`);
        console.error(`❌ Error updating ${position.ticker}:`, error);
      }
    }

    return NextResponse.json({
      message: `Updated prices for ${updatedCount} of ${positions.length} positions`,
      updatedCount,
      totalPositions: positions.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('❌ Error updating position prices:', error);
    return NextResponse.json(
      { error: 'Failed to update position prices' },
      { status: 500 }
    );
  }
}