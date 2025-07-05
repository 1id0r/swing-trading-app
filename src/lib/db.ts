// lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Helper functions for common operations
export const dbHelpers = {
  // Get or create user settings (since it's a single-user app)
  async getUserSettings() {
    let settings = await db.userSettings.findFirst();
    
    if (!settings) {
      settings = await db.userSettings.create({
        data: {
          defaultCurrency: 'USD',
          displayCurrency: 'USD',
          taxRate: 25.0,
          defaultFee: 9.99,
        },
      });
    }
    
    return settings;
  },

  // Calculate FIFO cost basis for a sell trade
  async calculateFIFOCostBasis(ticker: string, sharesToSell: number, sellDate: Date) {
    // Get all buy trades for this ticker before the sell date
    const buyTrades = await db.trade.findMany({
      where: {
        ticker,
        action: 'BUY',
        date: { lte: sellDate },
      },
      orderBy: { date: 'asc' }, // FIFO order
    });

    // Get all previous sell trades
    const previousSells = await db.trade.findMany({
      where: {
        ticker,
        action: 'SELL',
        date: { lt: sellDate },
      },
      orderBy: { date: 'asc' },
    });

    // Calculate how many shares were already sold
    const sharesSoldPreviously = previousSells.reduce(
      (total, sell) => total + sell.shares,
      0
    );

    // Apply FIFO to determine cost basis
    let remainingSharesToSell = sharesToSell;
    let totalCostBasis = 0;
    let sharesProcessed = 0;

    for (const buyTrade of buyTrades) {
      const sharesFromThisBuy = buyTrade.shares;
      const remainingFromBuy = sharesFromThisBuy - Math.max(0, sharesSoldPreviously - sharesProcessed);
      
      if (remainingFromBuy > 0 && remainingSharesToSell > 0) {
        const sharesToUseFromThisBuy = Math.min(remainingFromBuy, remainingSharesToSell);
        totalCostBasis += sharesToUseFromThisBuy * buyTrade.pricePerShare;
        remainingSharesToSell -= sharesToUseFromThisBuy;
      }
      
      sharesProcessed += sharesFromThisBuy;
      
      if (remainingSharesToSell <= 0) break;
    }

    if (remainingSharesToSell > 0) {
      throw new Error(`Insufficient shares to sell. Missing ${remainingSharesToSell} shares.`);
    }

    return totalCostBasis;
  },

  // Update or create a position based on current trades
  async updatePosition(ticker: string) {
    const trades = await db.trade.findMany({
      where: { ticker },
      orderBy: { date: 'asc' },
    });

    if (trades.length === 0) {
      // No trades, delete position if it exists
      await db.position.deleteMany({ where: { ticker } });
      return null;
    }

    // Calculate current position
    let totalShares = 0;
    let totalCost = 0;

    for (const trade of trades) {
      if (trade.action === 'BUY') {
        totalShares += trade.shares;
        totalCost += trade.totalCost;
      } else if (trade.action === 'SELL') {
        totalShares -= trade.shares;
        // For sells, reduce cost proportionally
        const costToRemove = (trade.shares / (totalShares + trade.shares)) * totalCost;
        totalCost -= costToRemove;
      }
    }

    if (totalShares <= 0) {
      // Position is closed, delete it
      await db.position.deleteMany({ where: { ticker } });
      return null;
    }

    const averagePrice = totalCost / totalShares;
    const latestTrade = trades[trades.length - 1];

    // Upsert position
    const position = await db.position.upsert({
      where: { ticker },
      update: {
        totalShares,
        averagePrice,
        totalCost,
        lastTradeDate: latestTrade.date,
        company: latestTrade.company,
        logo: latestTrade.logo,
        currency: latestTrade.currency,
      },
      create: {
        ticker,
        company: latestTrade.company,
        logo: latestTrade.logo,
        currency: latestTrade.currency,
        totalShares,
        averagePrice,
        totalCost,
        lastTradeDate: latestTrade.date,
      },
    });

    return position;
  },

  // Update current prices for all positions
  async updateCurrentPrices(priceUpdates: Record<string, number>) {
    const updatePromises = Object.entries(priceUpdates).map(([ticker, price]) =>
      db.position.updateMany({
        where: { ticker },
        data: {
          currentPrice: price,
          lastPriceUpdate: new Date(),
          unrealizedPnL: {
            // This will be calculated in the API route
          },
        },
      })
    );

    await Promise.all(updatePromises);
  },
};