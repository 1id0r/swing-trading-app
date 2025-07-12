// app/api/stocks/search-with-details/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

// Enhanced currency detection
const EXCHANGE_CURRENCY_MAP: Record<string, string> = {
  'NASDAQ': 'USD', 'NYSE': 'USD', 'AMEX': 'USD', 'OTC': 'USD',
  'LSE': 'GBP', 'AMS': 'EUR', 'PAR': 'EUR', 'FRA': 'EUR',
  'TSE': 'JPY', 'HKEX': 'HKD', 'SSE': 'CNY', 'ASX': 'AUD',
  'TSX': 'CAD', 'BOVESPA': 'BRL', 'BMV': 'MXN', 'TASE': 'ILS',
};

const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  'US': 'USD', 'United States': 'USD', 'GB': 'GBP', 'United Kingdom': 'GBP',
  'DE': 'EUR', 'Germany': 'EUR', 'FR': 'EUR', 'France': 'EUR',
  'JP': 'JPY', 'Japan': 'JPY', 'HK': 'HKD', 'Hong Kong': 'HKD',
  'CN': 'CNY', 'China': 'CNY', 'AU': 'AUD', 'Australia': 'AUD',
  'CA': 'CAD', 'Canada': 'CAD', 'BR': 'BRL', 'Brazil': 'BRL',
  'IL': 'ILS', 'Israel': 'ILS',
};

function detectCurrency(profile: any): string {
  if (profile.currency && profile.currency.length === 3) {
    return profile.currency.toUpperCase();
  }
  if (profile.exchange && EXCHANGE_CURRENCY_MAP[profile.exchange.toUpperCase()]) {
    return EXCHANGE_CURRENCY_MAP[profile.exchange.toUpperCase()];
  }
  if (profile.country && COUNTRY_CURRENCY_MAP[profile.country]) {
    return COUNTRY_CURRENCY_MAP[profile.country];
  }
  return 'USD';
}

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
    console.log(`🔍 Searching with details for: "${query}"`);
    
    const response = await fetch(
      `${BASE_URL}/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`,
      {
        next: { revalidate: 300 }
      }
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`📊 Finnhub returned ${data.result?.length || 0} results`);

    // 🔧 SAME IMPROVED FILTERING as search route
    const filteredResults = data.result
      ?.filter((stock: any) => {
        if (!stock.symbol || !stock.description) return false;
        if (stock.symbol.length > 6) return false;
        
        // Skip penny stocks and warrants
        if (stock.symbol.endsWith('W') || stock.symbol.endsWith('.W')) return false;
        if (stock.description.toLowerCase().includes('warrant')) return false;
        
        // 🔓 ALLOW ALL TYPES - Remove type filtering entirely
        // Users should see all available securities (stocks, ETFs, bonds, etc.)
        // if (stock.type && !allowedTypes.includes(stock.type)) return false;
        
        // Special crypto ETFs
        const cryptoETFs = ['IBIT', 'GBTC', 'ETHE', 'ARKB', 'FBTC', 'HODL'];
        if (cryptoETFs.some(etf => stock.symbol.startsWith(etf))) return true;
        
        // Main symbols or allowed dotted patterns
        if (!stock.symbol.includes('.')) return true;
        
        const allowedDottedPatterns = [/\.L$/, /\.TO$/, /\.PA$/, /\.DE$/, /\.NE$/, /\.BC$/];
        return allowedDottedPatterns.some(pattern => pattern.test(stock.symbol));
      })
      .slice(0, 8) || []; // Get top 8 for detailed lookup

    console.log(`✅ After filtering: ${filteredResults.length} symbols for detailed lookup`);

    // Get detailed data for each symbol
    const enrichedResults = await Promise.allSettled(
      filteredResults.map(async (stock: any) => {
        try {
          const [quoteResponse, profileResponse] = await Promise.all([
            fetch(`${BASE_URL}/quote?symbol=${stock.symbol}&token=${FINNHUB_API_KEY}`),
            fetch(`${BASE_URL}/stock/profile2?symbol=${stock.symbol}&token=${FINNHUB_API_KEY}`)
          ]);

          const [quote, profile] = await Promise.all([
            quoteResponse.ok ? quoteResponse.json() : null,
            profileResponse.ok ? profileResponse.json() : null
          ]);

          // ✅ More lenient validation - don't require quote.c > 0
          if (quote && profile) {
            const detectedCurrency = detectCurrency(profile);
            
            return {
              symbol: stock.symbol,
              name: profile.name || stock.description,
              logo: profile.logo || '',
              currentPrice: quote.c || 0,
              currency: detectedCurrency,
              change: quote.d || 0,
              changePercent: quote.dp || 0,
              exchange: profile.exchange || '',
              country: profile.country || '',
            };
          }
          return null;
        } catch (error) {
          console.error(`❌ Error enriching ${stock.symbol}:`, error);
          return null;
        }
      })
    );

    // Filter out failed requests
    const validResults = enrichedResults
      .filter((result): result is PromiseFulfilledResult<any> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);

    console.log(`🎯 Final results: ${validResults.length} enriched stocks`);

    return NextResponse.json({ results: validResults });
  } catch (error) {
    console.error('Search with details error:', error);
    return NextResponse.json(
      { error: 'Failed to search stocks with details' },
      { status: 500 }
    );
  }
}