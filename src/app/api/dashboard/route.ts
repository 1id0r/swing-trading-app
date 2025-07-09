// Replace your /src/app/api/dashboard/route.ts with this version
import { NextRequest, NextResponse } from 'next/server';
import { db, dbHelpers } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// GET /api/dashboard - Get user's dashboard data
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const userId = await requireAuth(request);
    console.log('🔍 Fetching dashboard data for user:', userId);

    // Get dashboard statistics for this specific user only
    let stats = null;
    try {
      stats = await dbHelpers.getUserDashboardStats(userId);
    } catch (error) {
      console.log('Dashboard stats helper not available, calculating manually:', error);
      
      // Fallback: calculate basic stats manually for this user
      const positions = await db.position.findMany({
        where: { userId }, // User isolation
      });

      const trades = await db.trade.findMany({
        where: { userId }, // User isolation
      });

      const totalPositions = positions.length;
      const totalValue = positions.reduce((sum, pos) => 
        sum + (pos.currentPrice ? pos.totalShares * pos.currentPrice : pos.totalCost), 0);
      const totalCost = positions.reduce((sum, pos) => sum + pos.totalCost, 0);
      const totalUnrealizedPnL = totalValue - totalCost;

      // Calculate total realized P&L from trades
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

    console.log(`✅ Dashboard data fetched for user ${userId}:`, stats);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('❌ Error fetching dashboard data:', error);
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}