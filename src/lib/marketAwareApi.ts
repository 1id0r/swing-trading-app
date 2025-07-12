// lib/marketAwareApi.ts - Enhanced to store last market prices
import { MarketHoursService } from './marketHours';

interface CachedPriceData {
  quotes: Record<string, any>;
  timestamp: number;
  lastMarketClose: number;
}

interface LastMarketPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

class MarketAwareApiWrapper {
  private cache = new Map<string, CachedPriceData>();
  private lastMarketCloseCache: number | null = null;
  private lastMarketPrices = new Map<string, LastMarketPrice>(); // Store last known prices

  // Check if market is open
  private isMarketOpen(): boolean {
    const marketStatus = MarketHoursService.getCurrentMarketStatus('US');
    return marketStatus.isOpen;
  }

  // Get last market close timestamp
  private getLastMarketClose(): number {
    if (this.lastMarketCloseCache) return this.lastMarketCloseCache;
    
    // Calculate last market close (4 PM ET on last trading day)
    const now = new Date();
    const easternTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    
    let lastClose = new Date(easternTime);
    lastClose.setHours(16, 0, 0, 0); // 4 PM ET
    
    // If we're before 4 PM today and market is open, use yesterday
    if (easternTime.getHours() < 16 && this.isMarketOpen()) {
      lastClose.setDate(lastClose.getDate() - 1);
    }
    
    // Go back to last weekday
    while (lastClose.getDay() === 0 || lastClose.getDay() === 6) {
      lastClose.setDate(lastClose.getDate() - 1);
    }
    
    this.lastMarketCloseCache = lastClose.getTime();
    return this.lastMarketCloseCache;
  }

  // Generate cache key for symbols
  private getCacheKey(symbols: string[]): string {
    return symbols.sort().join(',');
  }

  // Store last market prices when market is open
  private storeLastMarketPrices(quotes: Record<string, any>): void {
    const timestamp = Date.now();
    
    Object.entries(quotes).forEach(([symbol, quote]) => {
      if (quote && quote.c > 0) {
        this.lastMarketPrices.set(symbol, {
          symbol,
          price: quote.c,
          change: quote.d || 0,
          changePercent: quote.dp || 0,
          timestamp
        });
        
        console.log(`💾 Stored last market price for ${symbol}: ${quote.c}`);
      }
    });

    // Persist to localStorage for browser refresh
    try {
      const pricesArray = Array.from(this.lastMarketPrices.entries());
      localStorage.setItem('lastMarketPrices', JSON.stringify(pricesArray));
    } catch (error) {
      console.warn('Failed to persist last market prices:', error);
    }
  }

  // Load last market prices from localStorage
  private loadLastMarketPrices(): void {
    try {
      const stored = localStorage.getItem('lastMarketPrices');
      if (stored) {
        const pricesArray = JSON.parse(stored) as [string, LastMarketPrice][];
        this.lastMarketPrices = new Map(pricesArray);
        console.log(`📂 Loaded ${this.lastMarketPrices.size} last market prices from storage`);
      }
    } catch (error) {
      console.warn('Failed to load last market prices:', error);
    }
  }

  // Get last market price for a symbol
  public getLastMarketPrice(symbol: string): LastMarketPrice | null {
    return this.lastMarketPrices.get(symbol) || null;
  }

  // Enhanced batch quotes that respects market hours and provides last prices
  async getBatchQuotes(symbols: string[]): Promise<{ 
    quotes: Record<string, any>; 
    lastMarketPrices: Record<string, LastMarketPrice>;
    lastUpdate: number; 
    isLive: boolean 
  }> {
    const cacheKey = this.getCacheKey(symbols);
    const isOpen = this.isMarketOpen();
    const now = Date.now();

    // Load stored prices on first call
    if (this.lastMarketPrices.size === 0) {
      this.loadLastMarketPrices();
    }

    console.log(`📊 Market status: ${isOpen ? 'OPEN' : 'CLOSED'}`);

    // Prepare last market prices for requested symbols
    const lastMarketPrices: Record<string, LastMarketPrice> = {};
    symbols.forEach(symbol => {
      const lastPrice = this.lastMarketPrices.get(symbol);
      if (lastPrice) {
        lastMarketPrices[symbol] = lastPrice;
      }
    });

    // If market is closed, return cached data + last market prices
    if (!isOpen) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log(`🔒 Market closed - returning cached data + last market prices`);
        return {
          quotes: cached.quotes,
          lastMarketPrices,
          lastUpdate: cached.timestamp,
          isLive: false
        };
      } else {
        console.log(`🔒 Market closed - returning last market prices only`);
        return {
          quotes: {},
          lastMarketPrices,
          lastUpdate: 0,
          isLive: false
        };
      }
    }

    // Market is open - check if we have recent data (within 30 seconds)
    const cached = this.cache.get(cacheKey);
    if (cached && (now - cached.timestamp) < 30000) {
      console.log(`⚡ Using recent cache (${Math.round((now - cached.timestamp) / 1000)}s old)`);
      return {
        quotes: cached.quotes,
        lastMarketPrices,
        lastUpdate: cached.timestamp,
        isLive: true
      };
    }

    // Fetch fresh data
    console.log(`🔄 Market open - fetching fresh data for: ${symbols.join(', ')}`);
    
    try {
      const response = await fetch('/api/stocks/batch-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store as last market prices (since market is open)
        this.storeLastMarketPrices(data.quotes);
        
        // Update last market prices return object
        symbols.forEach(symbol => {
          const quote = data.quotes[symbol];
          if (quote && quote.c > 0) {
            lastMarketPrices[symbol] = {
              symbol,
              price: quote.c,
              change: quote.d || 0,
              changePercent: quote.dp || 0,
              timestamp: now
            };
          }
        });
        
        // Cache the response
        this.cache.set(cacheKey, {
          quotes: data.quotes,
          timestamp: now,
          lastMarketClose: this.getLastMarketClose()
        });

        console.log(`✅ Fresh data cached for ${symbols.length} symbols`);
        
        return {
          quotes: data.quotes,
          lastMarketPrices,
          lastUpdate: now,
          isLive: true
        };
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
      
      // Return cached data + last market prices if available
      if (cached) {
        console.log(`⚠️ API failed - returning cached data + last market prices`);
        return {
          quotes: cached.quotes,
          lastMarketPrices,
          lastUpdate: cached.timestamp,
          isLive: false
        };
      }
      
      return {
        quotes: {},
        lastMarketPrices,
        lastUpdate: 0,
        isLive: false
      };
    }
  }

  // Clear cache (useful for testing or manual refresh)
  clearCache(): void {
    this.cache.clear();
    this.lastMarketCloseCache = null;
    console.log('🧹 Cache cleared');
  }

  // Clear last market prices
  clearLastMarketPrices(): void {
    this.lastMarketPrices.clear();
    try {
      localStorage.removeItem('lastMarketPrices');
    } catch (error) {
      console.warn('Failed to clear stored prices:', error);
    }
    console.log('🧹 Last market prices cleared');
  }

  // Get cache status for debugging
  getCacheStatus(): {
    entries: number;
    oldestEntry: number;
    newestEntry: number;
    marketOpen: boolean;
    lastMarketPricesCount: number;
  } {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(e => e.timestamp);
    
    return {
      entries: entries.length,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0,
      marketOpen: this.isMarketOpen(),
      lastMarketPricesCount: this.lastMarketPrices.size
    };
  }
}

// Export singleton
export const marketAwareApi = new MarketAwareApiWrapper();