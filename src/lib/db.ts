// lib/db.ts (Complete fixed version)
import { PrismaClient } from '@prisma/client';

// Only create Prisma client on server side
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Server-only helper functions
export const dbHelpers = {
  // Get or create user settings for a specific user
  async getUserSettings(userId: string) {
    let settings = await db.userSettings.findUnique({
      where: { userId },
    });
    
    if (!settings) {
      settings = await db.userSettings.create({
        data: {
          userId,
          defaultCurrency: 'USD',
          displayCurrency: 'USD',
          taxRate: 25.0,
          defaultFee: 9.99,
          theme: 'dark',
        },
      });
    }
    
    return settings;
  },

  // Create user in database from Firebase user
  async createOrUpdateUser(firebaseUid: string, email: string, displayName: string) {
    return await db.user.upsert({
      where: { firebaseUid },
      update: {
        email,
        displayName,
      },
      create: {
        firebaseUid,
        email,
        displayName,
      },
    });
  },

  // Get user by Firebase UID
  async getUserByFirebaseUid(firebaseUid: string) {
    return await db.user.findUnique({
      where: { firebaseUid },
    });
  },

  // Calculate FIFO cost basis for a specific user's sell trade
  async calculateFIFOCostBasis(ticker: string, sharesToSell: number, sellDate: Date, userId: string) {
    // Get all buy trades for this user and ticker before the sell date
    const buyTrades = await db.trade.findMany({
      where: {
        userId,
        ticker,
        action: 'BUY',
        date: { lte: sellDate },
      },
      orderBy: { date: 'asc' },
    });

    // Get all previous sell trades for this user
    const previousSells = await db.trade.findMany({
      where: {
        userId,
        ticker,
        action: 'SELL',
        date: { lt: sellDate },
      },
      orderBy: { date: 'asc' },
    });

    const sharesSoldPreviously = previousSells.reduce(
      (total, sell) => total + sell.shares,
      0
    );

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
      throw new Error(`Insufficient shares to sell. User ${userId} only has ${sharesToSell - remainingSharesToSell} shares available.`);
    }

    return totalCostBasis;
  },

  // Update or create a position based on current trades for a user
  async updatePosition(ticker: string, userId: string) {
    const trades = await db.trade.findMany({
      where: { 
        userId,
        ticker 
      },
      orderBy: { date: 'asc' },
    });

    if (trades.length === 0) {
      // No trades, delete position if it exists
      await db.position.deleteMany({ 
        where: { 
          userId, 
          ticker 
        } 
      });
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
        if (totalShares + trade.shares > 0) {
          const costToRemove = (trade.shares / (totalShares + trade.shares)) * totalCost;
          totalCost -= costToRemove;
        }
      }
    }

    if (totalShares <= 0) {
      // Position is closed, delete it
      await db.position.deleteMany({ 
        where: { 
          userId, 
          ticker 
        } 
      });
      return null;
    }

    const averagePrice = totalCost / totalShares;
    const latestTrade = trades[trades.length - 1];

    // First, try to find existing position
    const existingPosition = await db.position.findFirst({
      where: {
        userId,
        ticker,
      },
    });

    if (existingPosition) {
      // Update existing position
      const position = await db.position.update({
        where: { id: existingPosition.id },
        data: {
          totalShares,
          averagePrice,
          totalCost,
          company: latestTrade.company,
          logo: latestTrade.logo,
          currency: latestTrade.currency,
        },
      });
      return position;
    } else {
      // Create new position
      const position = await db.position.create({
        data: {
          userId,
          ticker,
          company: latestTrade.company,
          logo: latestTrade.logo,
          currency: latestTrade.currency,
          totalShares,
          averagePrice,
          totalCost,
        },
      });
      return position;
    }
  },

  // Get user's portfolio statistics
  async getUserPortfolioStats(userId: string) {
    const positions = await db.position.findMany({
      where: { userId },
    });

    const totalPositions = positions.length;
    const totalValue = positions.reduce((sum, pos) => 
      sum + (pos.currentPrice ? pos.currentPrice * pos.totalShares : pos.totalCost), 0
    );
    const totalCost = positions.reduce((sum, pos) => sum + pos.totalCost, 0);
    const totalUnrealizedPnL = totalValue - totalCost;

    return {
      totalPositions,
      totalValue,
      totalCost,
      totalUnrealizedPnL,
      lastUpdated: Date.now(),
    };
  },

  // Get user's dashboard statistics
  async getUserDashboardStats(userId: string) {
    const trades = await db.trade.findMany({
      where: { userId },
    });

    const positions = await db.position.findMany({
      where: { userId },
    });

    // Calculate total P&L from all sell trades
    const totalPnL = trades
      .filter(trade => trade.action === 'SELL' && trade.netProfit !== null)
      .reduce((sum, trade) => sum + (trade.netProfit || 0), 0);

    const activePositions = positions.filter(pos => pos.totalShares > 0).length;
    
    const totalValue = positions.reduce((sum, pos) => 
      sum + (pos.currentPrice ? pos.currentPrice * pos.totalShares : pos.totalCost), 0
    );

    // Calculate win rate
    const sellTrades = trades.filter(trade => trade.action === 'SELL' && trade.netProfit !== null);
    const winningTrades = sellTrades.filter(trade => (trade.netProfit || 0) > 0).length;
    const winRate = sellTrades.length > 0 ? (winningTrades / sellTrades.length) * 100 : 0;

    // Calculate this month's P&L
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const thisMonthTrades = trades.filter(trade => 
      trade.action === 'SELL' && 
      trade.date >= thisMonth && 
      trade.netProfit !== null
    );
    
    const thisMonthPnL = thisMonthTrades.reduce((sum, trade) => sum + (trade.netProfit || 0), 0);

    return {
      totalPnL,
      activePositions,
      totalValue,
      winRate,
      thisMonthPnL,
    };
  },
};