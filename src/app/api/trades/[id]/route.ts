// Replace your /src/app/api/trades/[id]/route.ts with this version
import { NextRequest, NextResponse } from 'next/server';
import { db, dbHelpers } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// GET /api/trades/[id] - Get single trade
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const userId = await requireAuth(request);
    const params = await context.params;
    
    console.log('🔍 Fetching trade for user:', userId, 'trade ID:', params.id);

    // Get trade only if it belongs to the authenticated user
    const trade = await db.trade.findFirst({
      where: { 
        id: params.id,
        userId: userId // User isolation - critical security check
      },
    });

    if (!trade) {
      return NextResponse.json(
        { error: 'Trade not found or access denied' },
        { status: 404 }
      );
    }

    console.log('✅ Trade fetched for user:', userId);

    return NextResponse.json({ trade });
  } catch (error) {
    console.error('❌ Error fetching trade:', error);
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch trade' },
      { status: 500 }
    );
  }
}

// PUT /api/trades/[id] - Update trade
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const userId = await requireAuth(request);
    const params = await context.params;
    const body = await request.json();
    const { shares, pricePerShare, fee, date } = body;

    console.log('🔍 Updating trade for user:', userId, 'trade ID:', params.id);

    // Get the existing trade only if it belongs to the authenticated user
    const existingTrade = await db.trade.findFirst({
      where: { 
        id: params.id,
        userId: userId // User isolation - critical security check
      },
    });

    if (!existingTrade) {
      return NextResponse.json(
        { error: 'Trade not found or access denied' },
        { status: 404 }
      );
    }

    // Calculate new totals
    const newShares = shares ?? existingTrade.shares;
    const newPrice = pricePerShare ?? existingTrade.pricePerShare;
    const newFee = fee ?? existingTrade.fee;
    const newDate = date ? new Date(date) : existingTrade.date;

    const totalValue = newShares * newPrice;
    const totalCost = existingTrade.action === 'BUY'
      ? totalValue + newFee
      : totalValue - newFee;

    // Recalculate P&L for sell trades
    let costBasis = existingTrade.costBasis;
    let grossProfit = existingTrade.grossProfit;
    let netProfit = existingTrade.netProfit;
    let taxAmount = existingTrade.taxAmount;

    if (existingTrade.action === 'SELL') {
      try {
        // Pass userId to ensure FIFO calculation uses only this user's trades
        costBasis = await dbHelpers.calculateFIFOCostBasis(
          existingTrade.ticker,
          newShares,
          newDate,
          userId // User isolation for FIFO calculation
        );
        
        grossProfit = totalValue - costBasis;
        const settings = await dbHelpers.getUserSettings(userId);
        taxAmount = grossProfit > 0 ? (grossProfit * settings.taxRate) / 100 : 0;
        netProfit = grossProfit - newFee - taxAmount;
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'FIFO calculation failed' },
          { status: 400 }
        );
      }
    }

    // Update the trade (double-check user ownership)
    const updatedTrade = await db.trade.update({
      where: { 
        id: params.id,
        userId: userId // Extra security: ensure we only update user's own trades
      },
      data: {
        shares: newShares,
        pricePerShare: newPrice,
        fee: newFee,
        date: newDate,
        totalValue,
        totalCost,
        costBasis,
        grossProfit,
        netProfit,
        taxAmount,
      },
    });

    // Update the position for this user
    await dbHelpers.updatePosition(existingTrade.ticker, userId);

    console.log('✅ Trade updated successfully for user:', userId);

    return NextResponse.json({ trade: updatedTrade });
  } catch (error) {
    console.error('❌ Error updating trade:', error);
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update trade' },
      { status: 500 }
    );
  }
}

// DELETE /api/trades/[id] - Delete trade
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const userId = await requireAuth(request);
    const params = await context.params;
    
    console.log('🔍 Deleting trade for user:', userId, 'trade ID:', params.id);

    // Get trade only if it belongs to the authenticated user
    const trade = await db.trade.findFirst({
      where: { 
        id: params.id,
        userId: userId // User isolation - critical security check
      },
    });

    if (!trade) {
      return NextResponse.json(
        { error: 'Trade not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the trade (double-check user ownership)
    await db.trade.delete({
      where: { 
        id: params.id,
        userId: userId // Extra security: ensure we only delete user's own trades
      },
    });

    // Update the position for this user
    await dbHelpers.updatePosition(trade.ticker, userId);

    console.log('✅ Trade deleted successfully for user:', userId);

    return NextResponse.json({ message: 'Trade deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting trade:', error);
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete trade' },
      { status: 500 }
    );
  }
}