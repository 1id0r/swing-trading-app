// hooks/useRealtimePrices.ts - Enhanced version with fallback change calculation
import { useEffect, useRef, useState } from 'react';
import { priceService, PriceUpdate } from '@/lib/websocketPriceService';

export interface RealtimePrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
  isLive: boolean;
}

interface QuoteData {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  pc: number; // Previous close
}

export const useRealtimePrices = (symbols: string[]) => {
  const [prices, setPrices] = useState<Record<string, RealtimePrice>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [staticPrices, setStaticPrices] = useState<Record<string, QuoteData>>({});
  const unsubscribeFunctions = useRef<(() => void)[]>([]);

  // Fetch initial static prices for change calculation fallback
  useEffect(() => {
    if (symbols.length === 0) return;

    const fetchStaticPrices = async () => {
      try {
        console.log('📊 Fetching static prices for change calculation:', symbols);
        
        const response = await fetch('/api/stocks/batch-quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols }),
        });

        if (response.ok) {
          const data = await response.json();
          const quotesData: Record<string, QuoteData> = {};
          
          symbols.forEach(symbol => {
            const quote = data.quotes[symbol];
            if (quote) {
              quotesData[symbol] = {
                c: quote.c || 0,
                d: quote.d || 0,
                dp: quote.dp || 0,
                pc: quote.pc || 0
              };
              
              console.log(`📈 Static data for ${symbol}:`, {
                price: quote.c,
                change: quote.d,
                changePercent: quote.dp,
                previousClose: quote.pc
              });
            }
          });
          
          setStaticPrices(quotesData);
          
          // Initialize prices with static data
          const initialPrices: Record<string, RealtimePrice> = {};
          symbols.forEach(symbol => {
            const quote = quotesData[symbol];
            if (quote && quote.c > 0) {
              initialPrices[symbol] = {
                symbol,
                price: quote.c,
                change: quote.d,
                changePercent: quote.dp,
                timestamp: Date.now(),
                isLive: false
              };
            }
          });
          
          setPrices(initialPrices);
        }
      } catch (error) {
        console.error('Failed to fetch static prices:', error);
      }
    };

    fetchStaticPrices();
  }, [symbols]);

  // Real-time WebSocket subscriptions
  useEffect(() => {
    // Clear previous subscriptions
    unsubscribeFunctions.current.forEach(unsubscribe => unsubscribe());
    unsubscribeFunctions.current = [];

    if (symbols.length === 0) return;

    console.log('🔗 Setting up real-time price subscriptions for:', symbols);

    // Subscribe to each symbol
    symbols.forEach(symbol => {
      const unsubscribe = priceService.subscribe(symbol, (update: PriceUpdate) => {
        console.log(`📊 WebSocket update for ${symbol}:`, update);
        
        // If change data is missing or zero, calculate from static data
        let finalChange = update.change;
        let finalChangePercent = update.changePercent;
        
        if ((finalChange === 0 || finalChangePercent === 0) && staticPrices[symbol]) {
          const staticData = staticPrices[symbol];
          const previousClose = staticData.pc;
          
          if (previousClose > 0) {
            finalChange = update.price - previousClose;
            finalChangePercent = (finalChange / previousClose) * 100;
            
            console.log(`🔄 Calculated change for ${symbol}:`, {
              currentPrice: update.price,
              previousClose,
              calculatedChange: finalChange.toFixed(2),
              calculatedChangePercent: finalChangePercent.toFixed(2) + '%'
            });
          }
        }
        
        setPrices(prev => ({
          ...prev,
          [symbol]: {
            symbol: update.symbol,
            price: update.price,
            change: finalChange,
            changePercent: finalChangePercent,
            timestamp: update.timestamp,
            isLive: true
          }
        }));
      });

      unsubscribeFunctions.current.push(unsubscribe);
    });

    // Monitor connection status
    const checkConnection = () => {
      setIsConnected(priceService.isConnected());
    };

    const connectionInterval = setInterval(checkConnection, 1000);
    checkConnection();

    return () => {
      // Cleanup subscriptions
      unsubscribeFunctions.current.forEach(unsubscribe => unsubscribe());
      unsubscribeFunctions.current = [];
      clearInterval(connectionInterval);
    };
  }, [symbols, staticPrices]);

  const getPrice = (symbol: string): RealtimePrice | null => {
    return prices[symbol] || null;
  };

  const getAllPrices = (): Record<string, RealtimePrice> => {
    return prices;
  };

  // Method to refresh static prices (useful for manual refresh)
  const refreshStaticPrices = async () => {
    if (symbols.length === 0) return;

    try {
      const response = await fetch('/api/stocks/batch-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols }),
      });

      if (response.ok) {
        const data = await response.json();
        const quotesData: Record<string, QuoteData> = {};
        
        symbols.forEach(symbol => {
          const quote = data.quotes[symbol];
          if (quote) {
            quotesData[symbol] = {
              c: quote.c || 0,
              d: quote.d || 0,
              dp: quote.dp || 0,
              pc: quote.pc || 0
            };
          }
        });
        
        setStaticPrices(quotesData);
        
        // Update prices with fresh static data if no live data available
        setPrices(prev => {
          const updated = { ...prev };
          symbols.forEach(symbol => {
            const quote = quotesData[symbol];
            if (quote && quote.c > 0 && (!updated[symbol] || !updated[symbol].isLive)) {
              updated[symbol] = {
                symbol,
                price: quote.c,
                change: quote.d,
                changePercent: quote.dp,
                timestamp: Date.now(),
                isLive: false
              };
            }
          });
          return updated;
        });
      }
    } catch (error) {
      console.error('Failed to refresh static prices:', error);
    }
  };

  return {
    prices,
    getPrice,
    getAllPrices,
    isConnected,
    isLoading: symbols.length > 0 && Object.keys(prices).length === 0,
    refreshStaticPrices,
    staticPrices // Expose for debugging
  };
};