// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db, dbHelpers } from '@/lib/db';

// Helper function to get userId (aligned with positions API)
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

// GET /api/dashboard - Get user's dashboard data
export async function GET(request: NextRequest) {
  try {
    // Get user ID (aligned with positions API)
    const userId = await getUserIdFromRequest(request);

    // Get dashboard statistics for this user
    let stats = null;
    try {
      stats = await dbHelpers.getUserDashboardStats(userId);
    } catch (error) {
      console.log('Dashboard stats helper not available:', error);
      // Fallback: calculate basic stats manually
      const positions = await db.position.findMany({
        where: { userId },
      });

      const totalPositions = positions.length;
      const totalValue = positions.reduce((sum, pos) => 
        sum + (pos.currentPrice ? pos.totalShares * pos.currentPrice : pos.totalCost), 0);
      const totalCost = positions.reduce((sum, pos) => sum + pos.totalCost, 0);
      const totalUnrealizedPnL = totalValue - totalCost;

      stats = {
        totalPositions,
        totalValue,
        totalCost,
        totalUnrealizedPnL,
        totalUnrealizedPnLPercent: totalCost > 0 ? (totalUnrealizedPnL / totalCost) * 100 : 0,
      };
    }

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}