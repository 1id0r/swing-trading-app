// app/api/auth/create-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/auth/create-user - Create or get user in database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firebaseUid, email, displayName } = body;

    if (!firebaseUid || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: firebaseUid and email' },
        { status: 400 }
      );
    }

    // Try to find existing user first
    let user = await db.user.findUnique({
      where: { firebaseUid },
    });

    if (user) {
      // User exists, update their info
      console.log('📝 Updating existing user:', user.id);
      user = await db.user.update({
        where: { firebaseUid },
        data: {
          email,
          displayName: displayName || user.displayName,
        },
      });
    } else {
      // User doesn't exist, create them
      console.log('🆕 Creating new user for Firebase UID:', firebaseUid);
      user = await db.user.create({
        data: {
          firebaseUid,
          email,
          displayName: displayName || email.split('@')[0] || 'User',
        },
      });
      
      // Also create default user settings
      await db.userSettings.create({
        data: {
          userId: user.id,
          defaultCurrency: 'USD',
          displayCurrency: 'USD',
          taxRate: 25.0,
          defaultFee: 9.99,
          theme: 'dark',
        },
      });
      
      console.log('✅ User and settings created:', user.id);
    }

    return NextResponse.json({ 
      user: {
        id: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        displayName: user.displayName,
      }
    });
  } catch (error) {
    console.error('Error creating/getting user:', error);
    return NextResponse.json(
      { error: 'Failed to create/get user' },
      { status: 500 }
    );
  }
}