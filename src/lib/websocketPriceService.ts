// lib/websocketPriceService.ts - Fixed version with proper change calculation
export interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

export interface PriceSubscription {
  symbol: string;
  callback: (update: PriceUpdate) => void;
}

class WebSocketPriceService {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, Set<(update: PriceUpdate) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private apiKey: string | null = null;
  
  // Store previous close prices to calculate changes
  private previousCloses: Map<string, number> = new Map();

  constructor() {
    this.setupApiKey();
    this.loadPreviousCloses();
  }

  private async setupApiKey() {
    // Get API key from your backend
    try {
      const response = await fetch('/api/config/finnhub-key');
      if (response.ok) {
        const data = await response.json();
        this.apiKey = data.apiKey;
      }
    } catch (error) {
      console.error('Failed to get API key:', error);
    }
  }

  // Load previous close prices for change calculation
  private async loadPreviousCloses() {
    try {
      // Get previous close prices from your API or localStorage
      const symbols = Array.from(this.subscriptions.keys());
      if (symbols.length === 0) return;

      console.log('📊 Loading previous closes for change calculation:', symbols);
      
      const response = await fetch('/api/stocks/batch-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store previous close prices
        symbols.forEach(symbol => {
          const quote = data.quotes[symbol];
          if (quote && typeof quote.pc === 'number') {
            this.previousCloses.set(symbol, quote.pc);
            console.log(`📈 Stored previous close for ${symbol}: $${quote.pc}`);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load previous closes:', error);
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        resolve();
        return;
      }

      this.isConnecting = true;

      try {
        // Finnhub WebSocket endpoint
        this.ws = new WebSocket(`wss://ws.finnhub.io?token=${this.apiKey}`);

        this.ws.onopen = () => {
          console.log('🔗 WebSocket connected to Finnhub');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          // Load previous closes for existing subscriptions
          this.loadPreviousCloses();
          
          // Resubscribe to all symbols
          this.subscriptions.forEach((callbacks, symbol) => {
            this.subscribeToSymbol(symbol);
          });
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          this.isConnecting = false;
          this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data);
      
      if (message.type === 'trade') {
        // Finnhub sends trade data in this format
        message.data?.forEach((trade: any) => {
          const symbol = trade.s;
          const currentPrice = trade.p;
          const timestamp = trade.t;
          
          // Get previous close for this symbol
          let previousClose = this.previousCloses.get(symbol);
          
          // If we don't have previous close, try to fetch it
          if (typeof previousClose !== 'number') {
            console.log(`⚠️ No previous close for ${symbol}, fetching...`);
            this.fetchPreviousClose(symbol).then(close => {
              if (close) {
                this.previousCloses.set(symbol, close);
              }
            });
            // Use current price as fallback for now
            previousClose = currentPrice;
          }
          
          // Calculate change and change percent (with safe fallback)
          const change = currentPrice - (previousClose || currentPrice);
          const changePercent = (previousClose && previousClose > 0) ? (change / previousClose) * 100 : 0;
          
          const update: PriceUpdate = {
            symbol,
            price: currentPrice,
            change,
            changePercent,
            timestamp
          };
          
          console.log(`📊 Price update for ${symbol}:`, {
            price: currentPrice,
            previousClose,
            change: change.toFixed(2),
            changePercent: changePercent.toFixed(2) + '%'
          });
          
          this.notifySubscribers(symbol, update);
        });
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  // Fetch previous close for a specific symbol
  private async fetchPreviousClose(symbol: string): Promise<number | null> {
    try {
      const response = await fetch('/api/stocks/batch-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: [symbol] }),
      });

      if (response.ok) {
        const data = await response.json();
        const quote = data.quotes[symbol];
        if (quote && typeof quote.pc === 'number') {
          console.log(`📈 Fetched previous close for ${symbol}: $${quote.pc}`);
          return quote.pc;
        }
      }
    } catch (error) {
      console.error(`Failed to fetch previous close for ${symbol}:`, error);
    }
    return null;
  }

  private subscribeToSymbol(symbol: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        symbol: symbol
      }));
      console.log(`📊 Subscribed to ${symbol}`);
      
      // Try to get previous close for this symbol
      if (!this.previousCloses.has(symbol)) {
        this.fetchPreviousClose(symbol).then(close => {
          if (close) {
            this.previousCloses.set(symbol, close);
          }
        });
      }
    }
  }

  private unsubscribeFromSymbol(symbol: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        symbol: symbol
      }));
      console.log(`📊 Unsubscribed from ${symbol}`);
    }
  }

  private notifySubscribers(symbol: string, update: PriceUpdate) {
    const callbacks = this.subscriptions.get(symbol);
    if (callbacks) {
      callbacks.forEach(callback => callback(update));
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnect failed:', error);
        });
      }, delay);
    }
  }

  subscribe(symbol: string, callback: (update: PriceUpdate) => void): () => void {
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, new Set());
    }
    
    this.subscriptions.get(symbol)!.add(callback);
    
    // If WebSocket is connected, subscribe immediately
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.subscribeToSymbol(symbol);
    } else {
      // Otherwise, connect and then subscribe
      this.connect().then(() => {
        this.subscribeToSymbol(symbol);
      });
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(symbol);
      if (callbacks) {
        callbacks.delete(callback);
        
        // If no more callbacks for this symbol, unsubscribe
        if (callbacks.size === 0) {
          this.subscriptions.delete(symbol);
          this.previousCloses.delete(symbol); // Clean up previous close data
          this.unsubscribeFromSymbol(symbol);
        }
      }
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.previousCloses.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Method to manually set previous close (useful for initialization)
  setPreviousClose(symbol: string, previousClose: number) {
    this.previousCloses.set(symbol, previousClose);
    console.log(`📈 Set previous close for ${symbol}: $${previousClose}`);
  }

  // Method to get current previous close (for debugging)
  getPreviousClose(symbol: string): number | undefined {
    return this.previousCloses.get(symbol);
  }
}

// Singleton instance
export const priceService = new WebSocketPriceService();