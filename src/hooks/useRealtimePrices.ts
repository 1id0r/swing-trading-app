// Create: /src/hooks/useRealtimePrices.ts
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

export const useRealtimePrices = (symbols: string[]) => {
  const [prices, setPrices] = useState<Record<string, RealtimePrice>>({});
  const [isConnected, setIsConnected] = useState(false);
  const unsubscribeFunctions = useRef<(() => void)[]>([]);

  useEffect(() => {
    // Clear previous subscriptions
    unsubscribeFunctions.current.forEach(unsubscribe => unsubscribe());
    unsubscribeFunctions.current = [];

    if (symbols.length === 0) return;

    console.log('🔗 Setting up real-time price subscriptions for:', symbols);

    // Subscribe to each symbol
    symbols.forEach(symbol => {
      const unsubscribe = priceService.subscribe(symbol, (update: PriceUpdate) => {
        console.log(`📊 Price update for ${symbol}:`, update);
        
        setPrices(prev => ({
          ...prev,
          [symbol]: {
            symbol: update.symbol,
            price: update.price,
            change: update.change,
            changePercent: update.changePercent,
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
  }, [symbols]);

  const getPrice = (symbol: string): RealtimePrice | null => {
    return prices[symbol] || null;
  };

  const getAllPrices = (): Record<string, RealtimePrice> => {
    return prices;
  };

  return {
    prices,
    getPrice,
    getAllPrices,
    isConnected,
    isLoading: symbols.length > 0 && Object.keys(prices).length === 0
  };
};