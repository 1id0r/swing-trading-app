// src/lib/stockApi.ts - Fixed version with proper URL handling
export interface StockSearchResult {
  symbol: string;
  description: string;
  type: string;
  displaySymbol: string;
}

export interface StockQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

export interface CompanyProfile {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

export interface EnrichedStockResult {
  symbol: string;
  name: string;
  logo: string;
  currentPrice: number;
  currency: string;
  change: number;
  changePercent: number;
  exchange: string;
  country: string;
}

// Exchange to currency mapping for better currency detection
const EXCHANGE_CURRENCY_MAP: Record<string, string> = {
  // US Exchanges
  'NASDAQ': 'USD',
  'NYSE': 'USD',
  'AMEX': 'USD',
  'OTC': 'USD',
  
  // European Exchanges
  'LSE': 'GBP',      // London Stock Exchange
  'AMS': 'EUR',      // Euronext Amsterdam
  'PAR': 'EUR',      // Euronext Paris
  'BRU': 'EUR',      // Euronext Brussels
  'LIS': 'EUR',      // Euronext Lisbon
  'FRA': 'EUR',      // Frankfurt Stock Exchange
  'SWX': 'CHF',      // SIX Swiss Exchange
  
  // Asian Exchanges
  'TSE': 'JPY',      // Tokyo Stock Exchange
  'OSE': 'JPY',      // Osaka Stock Exchange
  'HKEX': 'HKD',     // Hong Kong Stock Exchange
  'SSE': 'CNY',      // Shanghai Stock Exchange
  'SZSE': 'CNY',     // Shenzhen Stock Exchange
  'KRX': 'KRW',      // Korea Exchange
  'BSE': 'INR',      // Bombay Stock Exchange
  'NSE': 'INR',      // National Stock Exchange of India
  'SGX': 'SGD',      // Singapore Exchange
  
  // Other Exchanges
  'ASX': 'AUD',      // Australian Securities Exchange
  'TSX': 'CAD',      // Toronto Stock Exchange
  'BOVESPA': 'BRL',  // Brazilian Stock Exchange
  'BMV': 'MXN',      // Mexican Stock Exchange
  'TASE': 'ILS',     // Tel Aviv Stock Exchange
};

// Country to currency mapping as fallback
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  'US': 'USD',
  'United States': 'USD',
  'GB': 'GBP',
  'United Kingdom': 'GBP',
  'DE': 'EUR',
  'Germany': 'EUR',
  'FR': 'EUR',
  'France': 'EUR',
  'NL': 'EUR',
  'Netherlands': 'EUR',
  'CH': 'CHF',
  'Switzerland': 'CHF',
  'JP': 'JPY',
  'Japan': 'JPY',
  'HK': 'HKD',
  'Hong Kong': 'HKD',
  'CN': 'CNY',
  'China': 'CNY',
  'KR': 'KRW',
  'South Korea': 'KRW',
  'IN': 'INR',
  'India': 'INR',
  'SG': 'SGD',
  'Singapore': 'SGD',
  'AU': 'AUD',
  'Australia': 'AUD',
  'CA': 'CAD',
  'Canada': 'CAD',
  'BR': 'BRL',
  'Brazil': 'BRL',
  'MX': 'MXN',
  'Mexico': 'MXN',
  'IL': 'ILS',
  'Israel': 'ILS',
};

class StockApiService {
  // Fixed baseUrl to handle both client and server environments
  private get baseUrl(): string {
    if (typeof window !== 'undefined') {
      // Client-side: use relative URL
      return '/api/stocks';
    } else {
      // Server-side: use absolute URL
      const host = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3000'
          : 'http://localhost:3000';
      return `${host}/api/stocks`;
    }
  }

  // Detect currency from exchange, country, or profile data
  private detectCurrency(profile: CompanyProfile): string {
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

  // Search for stocks with autocomplete
  async searchSymbols(query: string): Promise<StockSearchResult[]> {
    try {
      if (query.length < 1) return [];
      
      const response = await fetch(
        `${this.baseUrl}/search?q=${encodeURIComponent(query)}`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error searching symbols:', error);
      return [];
    }
  }

  // Get current stock price
  async getQuote(symbol: string): Promise<StockQuote | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/quote?symbol=${symbol}`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error getting quote for ${symbol}:`, error);
      return null;
    }
  }

  // Get company profile with logo
  async getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/profile?symbol=${symbol}`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error getting company profile for ${symbol}:`, error);
      return null;
    }
  }

  // Get multiple quotes at once - FIXED VERSION
  async getMultipleQuotes(symbols: string[]): Promise<Record<string, StockQuote>> {
    try {
      console.log('🔍 Getting multiple quotes for:', symbols);
      console.log('🔗 Using baseUrl:', this.baseUrl);
      
      const response = await fetch(`${this.baseUrl}/batch-quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbols }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Batch quotes response:', data);
      return data.quotes || {};
    } catch (error) {
      console.error('Error getting multiple quotes:', error);
      return {};
    }
  }

  // Combined search with enriched data (optimized with currency detection)
  async searchWithDetails(query: string): Promise<EnrichedStockResult[]> {
    try {
      if (query.length < 1) return [];
      
      const response = await fetch(
        `${this.baseUrl}/search-with-details?q=${encodeURIComponent(query)}`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Enhance results with better currency detection
      return (data.results || []).map((result: any) => ({
        ...result,
        currency: result.currency || 'USD', // API should handle this, but fallback to USD
        exchange: result.exchange || '',
        country: result.country || '',
      }));
    } catch (error) {
      console.error('Error in searchWithDetails:', error);
      return [];
    }
  }

  // Helper method to validate if a symbol exists
  async validateSymbol(symbol: string): Promise<boolean> {
    try {
      const quote = await this.getQuote(symbol);
      return quote !== null && quote.c > 0;
    } catch (error) {
      return false;
    }
  }

  // Get current market status
  async getMarketStatus(): Promise<{
    isOpen: boolean;
    nextOpen: string;
    nextClose: string;
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/market-status`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting market status:', error);
      return null;
    }
  }
}

export const stockApi = new StockApiService();

// Utility functions for working with stock data
export const stockUtils = {
  formatPrice: (price: number, currency: string = 'USD'): string => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(price);
    } catch (error) {
      // Fallback for unsupported currencies
      return `${currency} ${price.toFixed(2)}`;
    }
  },

  formatChange: (change: number, changePercent: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
  },

  getChangeColor: (change: number): string => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  },

  // Format large numbers (market cap, etc.)
  formatLargeNumber: (num: number): string => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  },
};