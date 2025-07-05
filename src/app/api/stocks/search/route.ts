// app/api/stocks/search/route.ts
import { NextRequest, NextResponse } from 'next/server';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
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
    const response = await fetch(
      `${BASE_URL}/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`,
      {
        next: { revalidate: 300 } // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter and enhance results
    const filteredResults = data.result
      ?.filter((stock: any) => 
        stock.type === 'Common Stock' && 
        stock.symbol.length <= 5 && 
        !stock.symbol.includes('.')
      )
      .slice(0, 10) || [];

    return NextResponse.json({ results: filteredResults });
  } catch (error) {
    console.error('Stock search error:', error);
    return NextResponse.json(
      { error: 'Failed to search stocks' },
      { status: 500 }
    );
  }
}