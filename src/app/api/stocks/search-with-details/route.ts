import { NextRequest, NextResponse } from 'next/server';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

// Exchange to currency mapping
const EXCHANGE_CURRENCY_MAP: Record<string, string> = {
  'NASDAQ': 'USD', 'NYSE': 'USD', 'AMEX': 'USD', 'OTC': 'USD',
  'LSE': 'GBP', 'AMS': 'EUR', 'PAR': 'EUR', 'BRU': 'EUR', 'LIS': 'EUR',
  'FRA': 'EUR', 'SWX': 'CHF', 'TSE': 'JPY', 'OSE': 'JPY', 'HKEX': 'HKD',
  'SSE': 'CNY', 'SZSE': 'CNY', 'KRX': 'KRW', 'BSE': 'INR', 'NSE': 'INR',
  'SGX': 'SGD', 'ASX': 'AUD', 'TSX': 'CAD', 'BOVESPA': 'BRL', 'BMV': 'MXN',
  'TASE': 'ILS'
};

const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  'US': 'USD', 'United States': 'USD', 'GB': 'GBP', 'United Kingdom': 'GBP',
  'DE': 'EUR', 'Germany': 'EUR', 'FR': 'EUR', 'France': 'EUR',
  'NL': 'EUR', 'Netherlands': 'EUR', 'CH': 'CHF', 'Switzerland': 'CHF',
  'JP': 'JPY', 'Japan': 'JPY', 'HK': 'HKD', 'Hong Kong': 'HKD',
  'CN': 'CNY', 'China': 'CNY', 'KR': 'KRW', 'South Korea': 'KRW',
  'IN': 'INR', 'India': 'INR', 'SG': 'SGD', 'Singapore': 'SGD',
  'AU': 'AUD', 'Australia': 'AUD', 'CA': 'CAD', 'Canada': 'CAD',
  'BR': 'BRL', 'Brazil': 'BRL', 'MX': 'MXN', 'Mexico': 'MXN',
  'IL': 'ILS', 'Israel': 'ILS'
};

function detectCurrency(profile: any): string {
  // First try: Use currency from profile if available and valid
  if (profile.currency && profile.currency.length === 3) {
    return profile.currency.toUpperCase();
  }

  // Second try: Map from exchange
  if (profile.exchange && EXCHANGE_CURRENCY_MAP[profile.exchange.toUpperCase()]) {
    return EXCHANGE_CURRENCY_MAP[profile.exchange.toUpperCase()];
  }

  // Third try: Map from country
  if (profile.country && COUNTRY_CURRENCY_MAP[profile.country]) {
    return COUNTRY_CURRENCY_MAP[profile.country];
  }

  // Fallback: USD
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
    // First, search for symbols
    const searchResponse = await fetch(
      `${BASE_URL}/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`
    );

    if (!searchResponse.ok) {
      throw new Error(`Search API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    
    // Filter results
    const filteredResults = searchData.result
      ?.filter((stock: any) => 
        stock.type === 'Common Stock' && 
        stock.symbol.length <= 5 && 
        !stock.symbol.includes('.')
      )
      .slice(0, 5) || [];

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

          if (quote && profile && quote.c > 0) {
            // Detect currency based on exchange/country
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
          console.error(`Error enriching ${stock.symbol}:`, error);
          return null;
        }
      })
    );

    // Filter out failed requests and null results
    const validResults = enrichedResults
      .filter((result): result is PromiseFulfilledResult<any> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);

    return NextResponse.json({ results: validResults });
  } catch (error) {
    console.error('Search with details error:', error);
    return NextResponse.json(
      { error: 'Failed to search stocks with details' },
      { status: 500 }
    );
  }
}