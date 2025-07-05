import { NextRequest, NextResponse } from 'next/server';
import { db, dbHelpers } from '@/lib/db';

// GET /api/settings - Get user settings
export async function GET(request: NextRequest) {
  try {
    const settings = await dbHelpers.getUserSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      defaultCurrency,
      displayCurrency,
      taxRate,
      defaultFee,
      theme,
      dateFormat,
      notifyTrades,
      notifyPriceAlerts,
      notifyMonthly,
    } = body;

    // Get existing settings
    const existingSettings = await dbHelpers.getUserSettings();

    // Update settings
    const updatedSettings = await db.userSettings.update({
      where: { id: existingSettings.id },
      data: {
        ...(defaultCurrency !== undefined && { defaultCurrency }),
        ...(displayCurrency !== undefined && { displayCurrency }),
        ...(taxRate !== undefined && { taxRate: parseFloat(taxRate) }),
        ...(defaultFee !== undefined && { defaultFee: parseFloat(defaultFee) }),
        ...(theme !== undefined && { theme }),
        ...(dateFormat !== undefined && { dateFormat }),
        ...(notifyTrades !== undefined && { notifyTrades }),
        ...(notifyPriceAlerts !== undefined && { notifyPriceAlerts }),
        ...(notifyMonthly !== undefined && { notifyMonthly }),
      },
    });

    return NextResponse.json({ settings: updatedSettings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}