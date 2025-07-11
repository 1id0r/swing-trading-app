import { NextRequest, NextResponse } from 'next/server';
import { db, dbHelpers } from '@/lib/db';
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    console.log('🔍 Fetching dashboard data for user:', user.id);

    let stats = null;
    try {
      stats = await dbHelpers.getUserDashboardStats(user.id); // ✅ Use user.id consistently
    } catch (error) {
      console.log('Dashboard stats helper not available, calculating manually:', error);
      
      const positions = await db.position.findMany({
        where: { userId: user.id }, // ✅ Use user.id consistently
      });

      const trades = await db.trade.findMany({
        where: { userId: user.id }, // ✅ Use user.id consistently
      });

      const totalPositions = positions.length;
      const totalValue = positions.reduce((sum, pos) => 
        sum + (pos.currentPrice ? pos.totalShares * pos.currentPrice : pos.totalCost), 0);
      const totalCost = positions.reduce((sum, pos) => sum + pos.totalCost, 0);
      const totalUnrealizedPnL = totalValue - totalCost;

      const totalRealizedPnL = trades
        .filter(trade => trade.action === 'SELL')
        .reduce((sum, trade) => sum + (trade.netProfit || 0), 0);

      stats = {
        totalPositions,
        totalValue,
        totalCost,
        totalUnrealizedPnL,
        totalUnrealizedPnLPercent: totalCost > 0 ? (totalUnrealizedPnL / totalCost) * 100 : 0,
        totalRealizedPnL,
        totalTrades: trades.length,
      };
    }

    console.log(`✅ Dashboard data fetched for user ${user.id}:`, stats);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('❌ Error fetching dashboard data:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') { // ✅ Fixed error message
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}