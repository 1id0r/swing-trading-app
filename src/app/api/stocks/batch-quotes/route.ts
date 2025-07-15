
import { NextRequest, NextResponse } from 'next/server';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

export async function POST(request: NextRequest) {
  try {
    const { symbols } = await request.json();
    
    console.log('📊 Batch quotes request for symbols:', symbols);

    if (!symbols || !Array.isArray(symbols)) {
      console.error('❌ Invalid symbols array:', symbols);
      return NextResponse.json(
        { error: 'Symbols array is required' },
        { status: 400 }
      );
    }

    if (!FINNHUB_API_KEY) {
      console.error('❌ Finnhub API key not configured');
      
      // Return mock data for testing
      const mockQuotes: Record<string, any> = {};
      symbols.forEach(symbol => {
        mockQuotes[symbol] = {
          c: 150 + Math.random() * 50, // Random price between 150-200
          d: (Math.random() - 0.5) * 10, // Random change
          dp: (Math.random() - 0.5) * 5, // Random percent change
          h: 160 + Math.random() * 40,
          l: 140 + Math.random() * 40,
          o: 145 + Math.random() * 50,
          pc: 148 + Math.random() * 54,
          t: Date.now() / 1000
        };
      });

      console.log('🔧 Using mock data:', mockQuotes);
      return NextResponse.json({ quotes: mockQuotes });
    }

    const quotes: Record<string, any> = {};
    const errors: string[] = [];
    
    console.log('🔗 Fetching real quotes from Finnhub...');

    // Process symbols with proper error handling
    for (const symbol of symbols) {
      try {
        const url = `${BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
        console.log(`📡 Fetching ${symbol} from:`, url);
        
        const response = await fetch(url, {
          next: { revalidate: 60 }
        });

        if (!response.ok) {
          console.error(`❌ API error for ${symbol}:`, response.status, response.statusText);
          errors.push(`${symbol}: API error ${response.status}`);
          continue;
        }

        const data = await response.json();
        console.log(`✅ Quote for ${symbol}:`, data);
        
        // Validate the quote has required fields
        if (data && typeof data.c === 'number' && data.c > 0) {
          quotes[symbol] = data;
        } else {
          console.warn(`⚠️ Invalid quote data for ${symbol}:`, data);
          errors.push(`${symbol}: Invalid quote data`);
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Failed to fetch quote for ${symbol}:`, error);
        errors.push(`${symbol}: ${(error as Error).message}`);
      }
    }

    console.log('📊 Final quotes:', quotes);
    console.log('❌ Errors:', errors);

    return NextResponse.json({ 
      quotes,
      debug: {
        requested: symbols,
        successful: Object.keys(quotes),
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('❌ Batch quotes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batch quotes' },
      { status: 500 }
    );
  }
}