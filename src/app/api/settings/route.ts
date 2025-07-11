// src/app/api/settings/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth'

// GET /api/settings - Get user settings
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request)
    console.log('🔍 Fetching settings for user:', user.id);

    // Get settings for this specific user only
    let settings = await db.userSettings.findUnique({
      where: { userId: user.id }, // ✅ Use user.id
    });

    // Create default settings if they don't exist for this user
    if (!settings) {
      console.log('📝 Creating default settings for user:', user.id);
      settings = await db.userSettings.create({
        data: {
          userId: user.id, // ✅ Use user.id
          defaultCurrency: 'USD',
          displayCurrency: 'USD',
          taxRate: 25.0,
          defaultFee: 9.99,
          theme: 'dark',
          dateFormat: 'MM/dd/yyyy',
          notifyTrades: true,
          notifyPriceAlerts: false,
          notifyMonthly: true,
        },
      });
    }

    console.log('✅ Settings fetched for user:', user.id);

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('❌ Error fetching settings:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') { // ✅ Fixed error message
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update user settings
export async function PUT(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request);
    console.log('🔍 Updating settings for user:', user.id);

    const body = await request.json();
    
    // Filter out fields that shouldn't be updated by the client
    const {
      id,
      userId: bodyUserId,
      createdAt,
      updatedAt,
      ...allowedUpdates
    } = body;
    
    console.log('📝 Settings API: Allowed updates for user:', user.id, allowedUpdates);
    
    // Update settings for this specific user only
    const settings = await db.userSettings.upsert({
      where: { userId: user.id }, // ✅ Fixed: was missing 'userId:'
      update: {
        ...allowedUpdates,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id, // ✅ Use user.id consistently
        defaultCurrency: allowedUpdates.defaultCurrency || 'USD',
        displayCurrency: allowedUpdates.displayCurrency || 'USD',
        taxRate: allowedUpdates.taxRate || 25.0,
        defaultFee: allowedUpdates.defaultFee || 9.99,
        dateFormat: allowedUpdates.dateFormat || 'MM/dd/yyyy',
        theme: allowedUpdates.theme || 'dark',
        notifyTrades: allowedUpdates.notifyTrades ?? true,
        notifyPriceAlerts: allowedUpdates.notifyPriceAlerts ?? false,
        notifyMonthly: allowedUpdates.notifyMonthly ?? true,
      },
    });

    console.log('✅ Settings updated successfully for user:', user.id);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('❌ Error updating settings:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') { // ✅ Fixed error message
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}