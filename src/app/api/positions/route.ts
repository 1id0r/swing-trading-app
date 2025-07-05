// app/api/positions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stockApi } from '@/lib/stockApi';

// GET /api/positions - Get current portfolio positions
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const updatePrices = searchParams.get('updatePrices') === 'true';

    let positions = await db.position.findMany({
      orderBy: { lastTradeDate: 'desc' },
    });

    // Update current prices if requested
    if (updatePrices && positions.length > 0) {
      const tickers = positions.map(p => p.ticker);
      
      try {
        const quotes = await stockApi.getMultipleQuotes(tickers);
        
        // Update positions with current prices
        const updatePromises = positions.map(async (position) => {
          const quote = quotes[position.ticker];
          
          if (quote && quote.c > 0) {
            const currentPrice = quote.c;
            const currentValue = position.totalShares * currentPrice;
            const unrealizedPnL = currentValue - position.totalCost;
            const unrealizedPnLPercent = (unrealizedPnL / position.totalCost) * 100;

            return db.position.update({
              where: { id: position.id },
              data: {
                currentPrice,
                lastPriceUpdate: new Date(),
                unrealizedPnL,
                unrealizedPnLPercent,
              },
            });
          }
          
          return position;
        });

        positions = await Promise.all(updatePromises);
      } catch (error) {
        console.error('Error updating prices:', error);
        // Continue without price updates if API fails
      }
    }

    // Calculate portfolio totals
    const portfolioStats = {
      totalPositions: positions.length,
      totalValue: positions.reduce((sum, p) => {
        const currentValue = p.currentPrice ? p.totalShares * p.currentPrice : p.totalCost;
        return sum + currentValue;
      }, 0),
      totalCost: positions.reduce((sum, p) => sum + p.totalCost, 0),
      totalUnrealizedPnL: positions.reduce((sum, p) => sum + (p.unrealizedPnL || 0), 0),
      lastUpdated: positions.length > 0 
        ? Math.max(...positions.map(p => p.lastPriceUpdate?.getTime() || 0))
        : null,
    };

    portfolioStats.totalUnrealizedPnL = portfolioStats.totalValue - portfolioStats.totalCost;

    return NextResponse.json({
      positions,
      portfolioStats,
    });
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}

// POST /api/positions/update-prices - Update all position prices
export async function POST(request: NextRequest) {
  try {
    const positions = await db.position.findMany();
    
    if (positions.length === 0) {
      return NextResponse.json({ 
        message: 'No positions to update',
        updated: 0 
      });
    }

    const tickers = positions.map(p => p.ticker);
    const quotes = await stockApi.getMultipleQuotes(tickers);
    
    let updatedCount = 0;
    
    const updatePromises = positions.map(async (position) => {
      const quote = quotes[position.ticker];
      
      if (quote && quote.c > 0) {
        const currentPrice = quote.c;
        const currentValue = position.totalShares * currentPrice;
        const unrealizedPnL = currentValue - position.totalCost;
        const unrealizedPnLPercent = (unrealizedPnL / position.totalCost) * 100;

        await db.position.update({
          where: { id: position.id },
          data: {
            currentPrice,
            lastPriceUpdate: new Date(),
            unrealizedPnL,
            unrealizedPnLPercent,
          },
        });
        
        updatedCount++;
      }
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ 
      message: `Updated prices for ${updatedCount} positions`,
      updated: updatedCount,
      total: positions.length,
    });
  } catch (error) {
    console.error('Error updating position prices:', error);
    return NextResponse.json(
      { error: 'Failed to update position prices' },
      { status: 500 }
    );
  }
}
