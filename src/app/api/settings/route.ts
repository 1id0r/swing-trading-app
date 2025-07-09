// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper function to get user ID from request (same pattern as positions)
async function getUserIdFromRequest(request: NextRequest): Promise<string> {
  // Try to get from headers first
  const userIdFromHeader = request.headers.get('x-user-id');
  if (userIdFromHeader) {
    return userIdFromHeader;
  }

  // Fallback: get or create default user (same as trades API)
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

// GET /api/settings - Get user settings
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);

    // Get user settings
    let settings = await db.userSettings.findUnique({
      where: { userId },
    });

    // Create default settings if they don't exist
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
    const userId = await getUserIdFromRequest(request);
    const body = await request.json();
    
    // Filter out fields that shouldn't be updated by the client
    const {
      id,
      userId: bodyUserId,
      createdAt,
      updatedAt,
      ...allowedUpdates
    } = body;
    
    console.log('⚙️ Settings API: Updating settings for user:', userId);
    console.log('📝 Settings API: Allowed updates:', allowedUpdates);
    
    // Update user settings
    const settings = await db.userSettings.upsert({
      where: { userId },
      update: {
        ...allowedUpdates,
        updatedAt: new Date(),
      },
      create: {
        userId,
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

    console.log('✅ Settings API: Settings updated successfully');
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('❌ Settings API: Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}