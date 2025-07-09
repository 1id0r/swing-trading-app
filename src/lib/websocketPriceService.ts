// Create: /src/lib/websocketPriceService.ts
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
  
    constructor() {
      this.setupApiKey();
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
            const update: PriceUpdate = {
              symbol: trade.s,
              price: trade.p,
              change: 0, // We'll calculate this
              changePercent: 0, // We'll calculate this
              timestamp: trade.t
            };
            
            this.notifySubscribers(update.symbol, update);
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  
    private subscribeToSymbol(symbol: string) {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'subscribe',
          symbol: symbol
        }));
        console.log(`📊 Subscribed to ${symbol}`);
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
    }
  
    isConnected(): boolean {
      return this.ws?.readyState === WebSocket.OPEN;
    }
  }
  
  // Singleton instance
  export const priceService = new WebSocketPriceService();