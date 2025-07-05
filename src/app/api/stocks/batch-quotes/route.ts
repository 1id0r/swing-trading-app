import { NextRequest, NextResponse } from 'next/server';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

export async function POST(request: NextRequest) {
  const { symbols } = await request.json();

  if (!symbols || !Array.isArray(symbols)) {
    return NextResponse.json(
      { error: 'Symbols array is required' },
      { status: 400 }
    );
  }

  if (!FINNHUB_API_KEY) {
    return NextResponse.json(
      { error: 'Finnhub API key not configured' },
      { status: 500 }
    );
  }

  try {
    const quotes: Record<string, any> = {};
    
    // Batch process with rate limiting
    for (const symbol of symbols) {
      try {
        const response = await fetch(
          `${BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
          {
            next: { revalidate: 60 } // Cache for 1 minute
          }
        );

        if (response.ok) {
          const data = await response.json();
          quotes[symbol] = data;
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to fetch quote for ${symbol}:`, error);
      }
    }

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error('Batch quotes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batch quotes' },
      { status: 500 }
    );
  }
}