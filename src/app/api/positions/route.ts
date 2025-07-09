// Replace your /src/app/api/positions/route.ts with this REAL API version
import { NextRequest, NextResponse } from 'next/server';
import { db, dbHelpers } from '@/lib/db';

async function getUserIdFromRequest(request: NextRequest): Promise<string> {
  const userIdFromHeader = request.headers.get('x-user-id');
  if (userIdFromHeader) {
    return userIdFromHeader;
  }

  try {
    const firstUser = await db.user.findFirst();
    if (firstUser) {
      return firstUser.id;
    }
    
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

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    const searchParams = request.nextUrl.searchParams;
    const updatePrices = searchParams.get('updatePrices') === 'true';

    console.log('🔍 [POSITIONS] User ID:', userId);
    console.log('🔍 [POSITIONS] Update prices:', updatePrices);

    const positions = await db.position.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    console.log('🔍 [POSITIONS] Found positions:', positions.length);

    if (updatePrices && positions.length > 0) {
      console.log('🚀 [POSITIONS] Starting REAL price updates...');
      
      const tickers = positions.map(p => p.ticker);
      console.log('🎯 [POSITIONS] Tickers to update:', tickers);
      
      try {
        // Call the REAL batch API (we know it works from the debug)
        const batchUrl = `${request.nextUrl.origin}/api/stocks/batch-quotes`;
        console.log('📡 [POSITIONS] Calling batch API:', batchUrl);
        
        const batchResponse = await fetch(batchUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ symbols: tickers }),
        });
        
        console.log('📡 [POSITIONS] Batch API response status:', batchResponse.status);
        
        if (!batchResponse.ok) {
          const errorText = await batchResponse.text();
          console.error('❌ [POSITIONS] Batch API failed:', errorText);
          throw new Error(`Batch API failed: ${batchResponse.status} - ${errorText}`);
        }
        
        const batchData = await batchResponse.json();
        console.log('📊 [POSITIONS] Batch API full response:', JSON.stringify(batchData, null, 2));
        
        const quotes = batchData.quotes || {};
        console.log('📈 [POSITIONS] Extracted quotes:', quotes);
        console.log('📈 [POSITIONS] Quotes count:', Object.keys(quotes).length);
        
        if (Object.keys(quotes).length === 0) {
          console.warn('⚠️ [POSITIONS] No quotes in response');
          const portfolioStats = await dbHelpers.getUserPortfolioStats(userId).catch(() => null);
          return NextResponse.json({ 
            positions, 
            portfolioStats,
            debug: { 
              message: 'No quotes in batch response',
              batchResponse: batchData 
            }
          });
        }
        
        // Update positions with REAL prices
        let updatedCount = 0;
        const updateResults = [];
        
        for (const position of positions) {
          const quote = quotes[position.ticker];
          console.log(`📊 [POSITIONS] Processing ${position.ticker}:`, quote);
          
          if (quote && typeof quote.c === 'number' && quote.c > 0) {
            const currentPrice = quote.c;
            const currentValue = position.totalShares * currentPrice;
            const unrealizedPnL = currentValue - position.totalCost;
            const unrealizedPnLPercent = position.totalCost > 0 ? (unrealizedPnL / position.totalCost) * 100 : 0;

            console.log(`✅ [POSITIONS] Updating ${position.ticker}:`);
            console.log(`   - Current Price: $${currentPrice.toFixed(2)}`);
            console.log(`   - Shares: ${position.totalShares}`);
            console.log(`   - Current Value: $${currentValue.toFixed(2)}`);
            console.log(`   - Cost Basis: $${position.totalCost.toFixed(2)}`);
            console.log(`   - P&L: ${unrealizedPnL >= 0 ? '+' : ''}$${unrealizedPnL.toFixed(2)} (${unrealizedPnLPercent.toFixed(2)}%)`);

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
            updateResults.push({
              ticker: position.ticker,
              currentPrice: currentPrice,
              unrealizedPnL: unrealizedPnL,
              unrealizedPnLPercent: unrealizedPnLPercent
            });
          } else {
            console.warn(`⚠️ [POSITIONS] Invalid quote for ${position.ticker}:`, quote);
            updateResults.push({
              ticker: position.ticker,
              error: 'Invalid quote',
              rawQuote: quote
            });
          }
        }
        
        console.log(`✅ [POSITIONS] Updated ${updatedCount} of ${positions.length} positions`);
        
        // Fetch updated positions
        const updatedPositions = await db.position.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
        });
        
        console.log('📈 [POSITIONS] Fetched updated positions:', updatedPositions.length);
        
        const portfolioStats = await dbHelpers.getUserPortfolioStats(userId).catch(() => null);
        
        return NextResponse.json({ 
          positions: updatedPositions, 
          portfolioStats,
          debug: { 
            message: `Updated ${updatedCount} positions with REAL prices`,
            updatedCount,
            totalPositions: positions.length,
            updateResults,
            realPrices: true
          }
        });
        
      } catch (priceError) {
        console.error('❌ [POSITIONS] Price update error:', priceError);
        const portfolioStats = await dbHelpers.getUserPortfolioStats(userId).catch(() => null);
        return NextResponse.json({ 
          positions, 
          portfolioStats,
          debug: { 
            error: 'Price update failed',
            message: priceError.message,
            stack: priceError.stack
          }
        });
      }
    }

    // Return positions without price updates
    const portfolioStats = await dbHelpers.getUserPortfolioStats(userId).catch(() => null);
    return NextResponse.json({ 
      positions, 
      portfolioStats,
      debug: { message: 'No price update requested' }
    });

  } catch (error) {
    console.error('❌ [POSITIONS] API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions', details: error.message },
      { status: 500 }
    );
  }
}