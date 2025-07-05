
// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/dashboard - Get dashboard summary data
export async function GET(request: NextRequest) {
  try {
    // Get recent trades
    const recentTrades = await db.trade.findMany({
      take: 10,
      orderBy: { date: 'desc' },
    });

    // Get current positions
    const positions = await db.position.findMany();

    // Calculate monthly performance for current year
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Get trades by month for current year
    const monthlyTrades = await db.trade.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1),
        },
      },
      _count: true,
      _sum: {
        netProfit: true,
        grossProfit: true,
        totalCost: true,
      },
    });

    // Process monthly data
    const monthlyPerformance = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthTrades = monthlyTrades.filter(
        t => new Date(t.date).getMonth() + 1 === month
      );

      const totalTrades = monthTrades.reduce((sum, t) => sum + t._count, 0);
      const netProfit = monthTrades.reduce((sum, t) => sum + (t._sum.netProfit || 0), 0);

      return {
        month: new Date(currentYear, i, 1).toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        }),
        profit: netProfit,
        trades: totalTrades,
      };
    }).filter(m => m.trades > 0); // Only include months with trades

    // Calculate portfolio stats
    const portfolioStats = {
      totalValue: positions.reduce((sum, p) => {
        const currentValue = p.currentPrice ? p.totalShares * p.currentPrice : p.totalCost;
        return sum + currentValue;
      }, 0),
      totalCost: positions.reduce((sum, p) => sum + p.totalCost, 0),
      totalUnrealizedPnL: positions.reduce((sum, p) => sum + (p.unrealizedPnL || 0), 0),
      activePositions: positions.length,
    };

    // Calculate total realized P&L from completed trades
    const realizedPnL = await db.trade.aggregate({
      where: { action: 'SELL' },
      _sum: { netProfit: true },
    });

    const totalPnL = (realizedPnL._sum.netProfit || 0) + portfolioStats.totalUnrealizedPnL;

    // Calculate win rate
    const sellTrades = await db.trade.findMany({
      where: { action: 'SELL' },
      select: { netProfit: true },
    });

    const profitableTrades = sellTrades.filter(t => (t.netProfit || 0) > 0).length;
    const winRate = sellTrades.length > 0 ? (profitableTrades / sellTrades.length) * 100 : 0;

    return NextResponse.json({
      stats: {
        totalPnL,
        activePositions: portfolioStats.activePositions,
        totalValue: portfolioStats.totalValue,
        winRate,
        thisMonthPnL: monthlyPerformance.find(m => 
          m.month.includes(new Date().toLocaleDateString('en-US', { month: 'short' }))
        )?.profit || 0,
      },
      monthlyPerformance,
      recentTrades: recentTrades.slice(0, 5),
      portfolioStats,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}