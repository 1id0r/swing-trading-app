// src/app/api/trades/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db, dbHelpers } from '@/lib/db';

// Helper function to get userId from request
// For now, we'll use a simple approach since this is a single-user app
async function getUserId(request: NextRequest): Promise<string> {
  // TODO: Implement proper Firebase auth token verification
  // For now, return a default user ID or the first user
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

// GET /api/trades/[id] - Get single trade
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const trade = await db.trade.findUnique({
      where: { id: params.id },
    });

    if (!trade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ trade });
  } catch (error) {
    console.error('Error fetching trade:', error);
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
    const params = await context.params;
    const body = await request.json();
    const { shares, pricePerShare, fee, date } = body;

    // Get the existing trade
    const existingTrade = await db.trade.findUnique({
      where: { id: params.id },
    });

    if (!existingTrade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    // Get userId from the existing trade
    const userId = existingTrade.userId;

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
        // Pass all 4 required parameters including userId
        costBasis = await dbHelpers.calculateFIFOCostBasis(
          existingTrade.ticker,
          newShares,
          newDate,
          userId
        );
        
        grossProfit = totalValue - costBasis;
        // Pass userId to getUserSettings
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

    // Update the trade
    const updatedTrade = await db.trade.update({
      where: { id: params.id },
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

    // Update the position with userId
    await dbHelpers.updatePosition(existingTrade.ticker, userId);

    return NextResponse.json({ trade: updatedTrade });
  } catch (error) {
    console.error('Error updating trade:', error);
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
    const params = await context.params;
    const trade = await db.trade.findUnique({
      where: { id: params.id },
    });

    if (!trade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    // Get userId from the trade
    const userId = trade.userId;

    // Delete the trade
    await db.trade.delete({
      where: { id: params.id },
    });

    // Update the position with userId
    await dbHelpers.updatePosition(trade.ticker, userId);

    return NextResponse.json({ message: 'Trade deleted successfully' });
  } catch (error) {
    console.error('Error deleting trade:', error);
    return NextResponse.json(
      { error: 'Failed to delete trade' },
      { status: 500 }
    );
  }
}