import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stockApi } from '@/lib/stockApi';
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    console.log('🔍 Updating prices for user:', user.id);

    const positions = await db.position.findMany({
      where: { userId: user.id }, // ✅ Use user.id consistently
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

    console.log(`📈 Updating prices for ${positions.length} positions for user ${user.id}...`);

    const tickers = positions.map(p => p.ticker);
    const quotes = await stockApi.getMultipleQuotes(tickers);
    
    let updatedCount = 0;
    const errors: string[] = [];

    for (const position of positions) {
      try {
        const quote = quotes[position.ticker];
        
        if (quote && quote.c > 0) {
          const currentPrice = quote.c;
          const currentValue = position.totalShares * currentPrice;
          const unrealizedPnL = currentValue - position.totalCost;
          const unrealizedPnLPercent = position.totalCost > 0 ? (unrealizedPnL / position.totalCost) * 100 : 0;

          await db.position.update({
            where: { 
              id: position.id,
              userId: user.id // ✅ Use user.id consistently
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
          console.log(`✅ Updated ${position.ticker} for user ${user.id}: $${currentPrice.toFixed(2)} (P&L: ${unrealizedPnL >= 0 ? '+' : ''}$${unrealizedPnL.toFixed(2)})`);
        } else {
          errors.push(`Failed to get price for ${position.ticker}`);
          console.warn(`⚠️ No price data for ${position.ticker} (user: ${user.id})`);
        }
      } catch (error) {
        errors.push(`Error updating ${position.ticker}: ${error}`);
        console.error(`❌ Error updating ${position.ticker} for user ${user.id}:`, error);
      }
    }

    console.log(`✅ Updated ${updatedCount} of ${positions.length} positions for user ${user.id}`);

    return NextResponse.json({
      message: `Updated prices for ${updatedCount} of ${positions.length} positions`,
      updatedCount,
      totalPositions: positions.length,
      userId: user.id, // ✅ Use user.id consistently
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('❌ Error updating position prices:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') { // ✅ Fixed error message
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update position prices' },
      { status: 500 }
    );
  }
}