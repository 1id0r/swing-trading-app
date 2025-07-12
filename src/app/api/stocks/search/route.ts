// app/api/stocks/search/route.ts - FIXED VERSION
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
    
    // 🔧 FIXED FILTERING - Much more permissive!
    const filteredResults = data.result
      ?.filter((stock: any) => {
        // Remove obvious junk symbols
        if (!stock.symbol || !stock.description) return false;
        
        // Allow symbols up to 6 characters (for ETFs like IBIT, GBTC, etc.)
        if (stock.symbol.length > 6) return false;
        
        // Skip penny stocks and warrants
        if (stock.symbol.endsWith('W') || stock.symbol.endsWith('.W')) return false;
        if (stock.description.toLowerCase().includes('warrant')) return false;
        
        // 🔓 ALLOW ALL TYPES - Remove type filtering entirely
        // Users should see all available securities (stocks, ETFs, bonds, etc.)
        // if (stock.type && !allowedTypes.includes(stock.type)) return false;
        
        // 🎯 Special handling for popular crypto ETFs
        const cryptoETFs = ['IBIT', 'GBTC', 'ETHE', 'ARKB', 'FBTC', 'HODL'];
        if (cryptoETFs.some(etf => stock.symbol.startsWith(etf))) return true;
        
        // Allow main exchange symbols (no dots) and popular dotted symbols
        if (!stock.symbol.includes('.')) return true;
        
        // Allow some dotted symbols from major exchanges
        const allowedDottedPatterns = [
          /\.L$/,    // London Stock Exchange
          /\.TO$/,   // Toronto Stock Exchange  
          /\.PA$/,   // Paris
          /\.DE$/,   // Germany
          /\.NE$/,   // Other exchanges
          /\.BC$/,   // Other exchanges
        ];
        
        return allowedDottedPatterns.some(pattern => pattern.test(stock.symbol));
      })
      .slice(0, 15) || []; // ✅ Increased limit to 15

    console.log(`🔍 Search "${query}": ${data.result?.length || 0} total → ${filteredResults.length} filtered`);

    return NextResponse.json({ results: filteredResults });
  } catch (error) {
    console.error('Stock search error:', error);
    return NextResponse.json(
      { error: 'Failed to search stocks' },
      { status: 500 }
    );
  }
}