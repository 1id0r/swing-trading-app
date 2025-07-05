
// app/api/trades/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db, dbHelpers } from '@/lib/db';

// GET /api/trades/[id] - Get single trade
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
  { params }: { params: { id: string } }
) {
  try {
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
        costBasis = await dbHelpers.calculateFIFOCostBasis(
          existingTrade.ticker,
          newShares,
          newDate
        );
        
        grossProfit = totalValue - costBasis;
        const settings = await dbHelpers.getUserSettings();
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

    // Update the position
    await dbHelpers.updatePosition(existingTrade.ticker);

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
  { params }: { params: { id: string } }
) {
  try {
    const trade = await db.trade.findUnique({
      where: { id: params.id },
    });

    if (!trade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    // Delete the trade
    await db.trade.delete({
      where: { id: params.id },
    });

    // Update the position
    await dbHelpers.updatePosition(trade.ticker);

    return NextResponse.json({ message: 'Trade deleted successfully' });
  } catch (error) {
    console.error('Error deleting trade:', error);
    return NextResponse.json(
      { error: 'Failed to delete trade' },
      { status: 500 }
    );
  }
}