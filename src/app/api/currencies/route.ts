import { NextRequest, NextResponse } from 'next/server'

// This might be a simple static endpoint - keeping it simple
export async function GET(request: NextRequest) {
  try {
    // Common currencies for trading
    const currencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
      { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' }
    ]

    return NextResponse.json({ currencies })
  } catch (error) {
    console.error('Error fetching currencies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch currencies' },
      { status: 500 }
    )
  }
}