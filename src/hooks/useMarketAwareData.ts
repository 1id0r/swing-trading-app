// hooks/useMarketAwareData.ts - Enhanced to provide last market prices
import { useState, useEffect, useCallback } from 'react';
import { marketAwareApi } from '@/lib/marketAwareApi';
import { MarketHoursService } from '@/lib/marketHours';

export interface MarketAwareDataResult {
  data: Record<string, any>;
  lastMarketPrices: Record<string, any>;
  lastUpdate: number;
  isLive: boolean;
  isLoading: boolean;
  marketStatus: any;
  refresh: () => Promise<void>;
}

export function useMarketAwareData(symbols: string[]): MarketAwareDataResult {
  const [data, setData] = useState<Record<string, any>>({});
  const [lastMarketPrices, setLastMarketPrices] = useState<Record<string, any>>({});
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [marketStatus, setMarketStatus] = useState<any>(null);

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (symbols.length === 0) {
      setData({});
      setLastMarketPrices({});
      setLastUpdate(0);
      setIsLive(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const result = await marketAwareApi.getBatchQuotes(symbols);
      
      setData(result.quotes);
      setLastMarketPrices(result.lastMarketPrices);
      setLastUpdate(result.lastUpdate);
      setIsLive(result.isLive);
      
      console.log(`📊 Data updated: ${Object.keys(result.quotes).length} quotes, ${Object.keys(result.lastMarketPrices).length} last prices, isLive: ${result.isLive}`);
    } catch (error) {
      console.error('Failed to fetch market data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [symbols]);

  // Update market status
  const updateMarketStatus = useCallback(() => {
    const status = MarketHoursService.getCurrentMarketStatus('US');
    setMarketStatus(status);
  }, []);

  // Initial load
  useEffect(() => {
    updateMarketStatus();
    fetchData();
  }, [updateMarketStatus, fetchData]);

  // Set up market status monitoring and automatic refresh
  useEffect(() => {
    updateMarketStatus();
    
    // Update market status every minute
    const statusInterval = setInterval(updateMarketStatus, 60000);

    // Set up data refresh based on market status
    let dataInterval: NodeJS.Timeout | null = null;
    
    const setupDataRefresh = () => {
      if (dataInterval) clearInterval(dataInterval);
      
      const currentStatus = MarketHoursService.getCurrentMarketStatus('US');
      
      if (currentStatus.isOpen) {
        // Refresh every 30 seconds when market is open
        dataInterval = setInterval(fetchData, 30000);
        console.log('📊 Market open - auto-refresh every 30s');
      } else {
        // No auto-refresh when market is closed
        console.log('📊 Market closed - no auto-refresh');
      }
    };

    setupDataRefresh();
    
    // Re-setup when market status changes (check every minute)
    const setupInterval = setInterval(setupDataRefresh, 60000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(setupInterval);
      if (dataInterval) clearInterval(dataInterval);
    };
  }, [fetchData]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    data,
    lastMarketPrices,
    lastUpdate,
    isLive,
    isLoading,
    marketStatus,
    refresh
  };
}