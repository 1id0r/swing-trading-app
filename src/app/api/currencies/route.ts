// app/api/currencies/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Common currencies with their symbols and countries
const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', country: 'United States' },
  { code: 'EUR', name: 'Euro', symbol: '€', country: 'European Union' },
  { code: 'GBP', name: 'British Pound', symbol: '£', country: 'United Kingdom' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', country: 'Japan' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', country: 'Canada' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', country: 'Australia' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', country: 'Switzerland' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', country: 'China' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', country: 'India' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', country: 'South Korea' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', country: 'Brazil' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', country: 'Mexico' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', country: 'Singapore' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', country: 'Hong Kong' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', country: 'Israel' },
];

// GET /api/currencies - Get supported currencies
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ currencies: SUPPORTED_CURRENCIES });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currencies' },
      { status: 500 }
    );
  }
}