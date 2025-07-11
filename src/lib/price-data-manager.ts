// lib/priceDataManager.ts - Utility to handle staggered price loading
export interface PriceData {
    price: number;
    change: number;
    changePercent: number;
    timestamp: number;
    source: 'live' | 'api' | 'cache';
    isStale: boolean;
  }
  
  export interface PriceLoadingStatus {
    symbol: string;
    status: 'loading' | 'live' | 'fallback' | 'error' | 'stale';
    lastUpdate: number;
    retryCount: number;
    hasLiveData: boolean;
    hasStaticData: boolean;
  }
  
  class PriceDataManager {
    private priceCache = new Map<string, PriceData>();
    private loadingStates = new Map<string, PriceLoadingStatus>();
    private fallbackTimeouts = new Map<string, NodeJS.Timeout>();
    private retryTimeouts = new Map<string, NodeJS.Timeout>();
    
    private readonly STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    private readonly RETRY_DELAY = 10 * 1000; // 10 seconds
    private readonly MAX_RETRIES = 3;
  
    constructor() {
      // Start cleanup interval
      setInterval(() => this.cleanup(), 60000); // Cleanup every minute
    }
  
    // Initialize symbols for tracking
    initializeSymbols(symbols: string[]) {
      symbols.forEach(symbol => {
        if (!this.loadingStates.has(symbol)) {
          this.loadingStates.set(symbol, {
            symbol,
            status: 'loading',
            lastUpdate: 0,
            retryCount: 0,
            hasLiveData: false,
            hasStaticData: false
          });
  
          // Set up fallback timeout for slow symbols
          this.setupFallbackTimeout(symbol);
        }
      });
    }
  
    // Update with live price data
    updateLivePrice(symbol: string, data: { price: number; change: number; changePercent: number; timestamp: number }) {
      const priceData: PriceData = {
        ...data,
        source: 'live',
        isStale: false
      };
  
      this.priceCache.set(symbol, priceData);
      
      const status = this.loadingStates.get(symbol);
      if (status) {
        status.status = 'live';
        status.hasLiveData = true;
        status.lastUpdate = data.timestamp;
        status.retryCount = 0;
        this.loadingStates.set(symbol, status);
      }
  
      // Clear any pending fallback timeout since we have live data
      this.clearFallbackTimeout(symbol);
      
      console.log(`✅ Live data updated for ${symbol}: $${data.price} (${data.change >= 0 ? '+' : ''}${data.change})`);
    }
  
    // Update with API/static price data
    updateStaticPrice(symbol: string, data: { price: number; change: number; changePercent: number }) {
      // Only update if we don't have live data or if static data is newer
      const existing = this.priceCache.get(symbol);
      const status = this.loadingStates.get(symbol);
      
      if (!existing || existing.source !== 'live') {
        const priceData: PriceData = {
          ...data,
          timestamp: Date.now(),
          source: 'api',
          isStale: false
        };
  
        this.priceCache.set(symbol, priceData);
        
        if (status) {
          status.status = 'fallback';
          status.hasStaticData = true;
          status.lastUpdate = priceData.timestamp;
          this.loadingStates.set(symbol, status);
        }
  
        console.log(`📊 Static data updated for ${symbol}: $${data.price} (${data.change >= 0 ? '+' : ''}${data.change})`);
      }
    }
  
    // Get best available price data for a symbol
    getBestPrice(symbol: string): PriceData | null {
      const data = this.priceCache.get(symbol);
      if (!data) return null;
  
      // Check if data is stale
      const age = Date.now() - data.timestamp;
      const isStale = age > this.STALE_THRESHOLD;
  
      return {
        ...data,
        isStale
      };
    }
  
    // Get loading status for a symbol
    getLoadingStatus(symbol: string): PriceLoadingStatus | null {
      return this.loadingStates.get(symbol) || null;
    }
  
    // Get all symbols grouped by status
    getSymbolsByStatus(): {
      live: string[];
      fallback: string[];
      loading: string[];
      error: string[];
      stale: string[];
    } {
      const result = {
        live: [] as string[],
        fallback: [] as string[],
        loading: [] as string[],
        error: [] as string[],
        stale: [] as string[]
      };
  
      for (const [symbol, status] of this.loadingStates) {
        const priceData = this.priceCache.get(symbol);
        
        if (priceData?.isStale) {
          result.stale.push(symbol);
        } else {
          result[status.status].push(symbol);
        }
      }
  
      return result;
    }
  
    // Force refresh for specific symbols
    async refreshSymbols(symbols: string[], fetchFunction: (symbols: string[]) => Promise<void>) {
      console.log(`🔄 Force refreshing symbols: ${symbols.join(', ')}`);
      
      // Mark symbols as loading
      symbols.forEach(symbol => {
        const status = this.loadingStates.get(symbol);
        if (status && status.retryCount < this.MAX_RETRIES) {
          status.status = 'loading';
          status.retryCount++;
          this.loadingStates.set(symbol, status);
        }
      });
  
      try {
        await fetchFunction(symbols);
      } catch (error) {
        console.error('Failed to refresh symbols:', error);
        
        // Mark failed symbols as error
        symbols.forEach(symbol => {
          const status = this.loadingStates.get(symbol);
          if (status) {
            status.status = 'error';
            this.loadingStates.set(symbol, status);
          }
        });
      }
    }
  
    // Set up fallback timeout for a symbol
    private setupFallbackTimeout(symbol: string) {
      // Clear existing timeout
      this.clearFallbackTimeout(symbol);
  
      // Set new timeout
      const timeout = setTimeout(() => {
        const status = this.loadingStates.get(symbol);
        if (status && !status.hasLiveData && status.retryCount < this.MAX_RETRIES) {
          console.log(`⏰ Fallback timeout triggered for ${symbol}`);
          // Trigger fallback data fetch - this would be handled by the component
          this.triggerFallbackFetch(symbol);
        }
      }, this.RETRY_DELAY);
  
      this.fallbackTimeouts.set(symbol, timeout);
    }
  
    // Clear fallback timeout
    private clearFallbackTimeout(symbol: string) {
      const timeout = this.fallbackTimeouts.get(symbol);
      if (timeout) {
        clearTimeout(timeout);
        this.fallbackTimeouts.delete(symbol);
      }
    }
  
    // Trigger fallback fetch (to be implemented by consumer)
    private triggerFallbackFetch(symbol: string) {
      // This could emit an event or call a callback
      console.log(`🔔 Should fetch fallback data for ${symbol}`);
    }
  
    // Clean up stale data and timeouts
    private cleanup() {
      const now = Date.now();
      
      // Clean up stale price data
      for (const [symbol, data] of this.priceCache) {
        const age = now - data.timestamp;
        if (age > this.STALE_THRESHOLD * 2) { // Remove after 10 minutes
          this.priceCache.delete(symbol);
          console.log(`🧹 Cleaned up stale data for ${symbol}`);
        }
      }
  
      // Update stale statuses
      for (const [symbol, status] of this.loadingStates) {
        const data = this.priceCache.get(symbol);
        if (data) {
          const age = now - data.timestamp;
          if (age > this.STALE_THRESHOLD && status.status !== 'error') {
            status.status = 'stale';
            this.loadingStates.set(symbol, status);
          }
        }
      }
    }
  
    // Get summary statistics
    getSummary(): {
      totalSymbols: number;
      liveCount: number;
      fallbackCount: number;
      loadingCount: number;
      errorCount: number;
      staleCount: number;
    } {
      const statusGroups = this.getSymbolsByStatus();
      
      return {
        totalSymbols: this.loadingStates.size,
        liveCount: statusGroups.live.length,
        fallbackCount: statusGroups.fallback.length,
        loadingCount: statusGroups.loading.length,
        errorCount: statusGroups.error.length,
        staleCount: statusGroups.stale.length
      };
    }
  
    // Reset all data
    reset() {
      this.priceCache.clear();
      this.loadingStates.clear();
      
      // Clear all timeouts
      for (const timeout of this.fallbackTimeouts.values()) {
        clearTimeout(timeout);
      }
      this.fallbackTimeouts.clear();
      
      for (const timeout of this.retryTimeouts.values()) {
        clearTimeout(timeout);
      }
      this.retryTimeouts.clear();
    }
  }
  
  // Export singleton instance
  export const priceDataManager = new PriceDataManager();