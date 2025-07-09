// stores/useTradeStore.ts (Fixed - no auth headers required)
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Trade {
  id: string;
  ticker: string;
  company: string;
  logo?: string;
  action: 'BUY' | 'SELL';
  shares: number;
  pricePerShare: number;
  fee: number;
  currency: string;
  date: string;
  totalValue: number;
  totalCost: number;
  costBasis?: number;
  grossProfit?: number;
  netProfit?: number;
  taxAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  ticker: string;
  company: string;
  logo?: string;
  currency: string;
  totalShares: number;
  averagePrice: number;
  totalCost: number;
  currentPrice?: number;
  lastPriceUpdate?: string;
  unrealizedPnL?: number;
  unrealizedPnLPercent?: number;
}

export interface PortfolioStats {
  totalPositions: number;
  totalValue: number;
  totalCost: number;
  totalUnrealizedPnL: number;
  lastUpdated?: number;
}

export interface DashboardStats {
  totalPnL: number;
  activePositions: number;
  totalValue: number;
  winRate: number;
  thisMonthPnL: number;
}

interface TradeState {
  // Data
  trades: Trade[];
  positions: Position[];
  portfolioStats: PortfolioStats | null;
  dashboardStats: DashboardStats | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingPositions: boolean;
  isLoadingDashboard: boolean;
  error: string | null;
  
  // Pagination
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface TradeActions {
  // Trade operations
  fetchTrades: (options?: { ticker?: string; limit?: number; offset?: number }) => Promise<void>;
  addTrade: (trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt' | 'totalValue' | 'totalCost'>) => Promise<void>;
  updateTrade: (id: string, updates: Partial<Trade>) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  
  // Position operations
  fetchPositions: (updatePrices?: boolean) => Promise<void>;
  updatePositionPrices: () => Promise<void>;
  
  // Dashboard data
  fetchDashboardData: () => Promise<void>;
  
  // Utilities
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

type TradeStore = TradeState & TradeActions;

const initialState: TradeState = {
  trades: [],
  positions: [],
  portfolioStats: null,
  dashboardStats: null,
  isLoading: false,
  isLoadingPositions: false,
  isLoadingDashboard: false,
  error: null,
  pagination: {
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  },
};

export const useTradeStore = create<TradeStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Fetch trades from API (simplified - no auth headers)
      fetchTrades: async (options = {}) => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('🚀 Fetching trades...');
          
          const params = new URLSearchParams();
          if (options.ticker) params.append('ticker', options.ticker);
          if (options.limit) params.append('limit', options.limit.toString());
          if (options.offset) params.append('offset', options.offset.toString());

          const response = await fetch(`/api/trades?${params}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to fetch trades: ${response.status}`);
          }

          const data = await response.json();
          console.log('✅ Trades fetched successfully:', data);
          
          set({
            trades: data.trades || [],
            pagination: data.pagination || {
              total: 0,
              limit: 50,
              offset: 0,
              hasMore: false,
            },
            isLoading: false,
          });
        } catch (error) {
          console.error('❌ Error fetching trades:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch trades',
            isLoading: false,
          });
        }
      },

      // Add trade (simplified - no auth headers)
      addTrade: async (trade) => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('🚀 Adding trade:', trade);
          
          const response = await fetch('/api/trades', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(trade),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to add trade: ${response.status}`);
          }

          const data = await response.json();
          console.log('✅ Trade added successfully:', data);

          // Refresh data after adding
          await Promise.all([
            get().fetchTrades(),
            get().fetchPositions(),
            get().fetchDashboardData(),
          ]);

          set({ isLoading: false });
        } catch (error) {
          console.error('❌ Error adding trade:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to add trade',
            isLoading: false,
          });
          throw error;
        }
      },

      // Update trade (simplified - no auth headers)
      updateTrade: async (id, updates) => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('🚀 Updating trade:', id, updates);
          
          const response = await fetch(`/api/trades/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to update trade: ${response.status}`);
          }

          // Refresh data after updating
          await Promise.all([
            get().fetchTrades(),
            get().fetchPositions(),
            get().fetchDashboardData(),
          ]);

          set({ isLoading: false });
        } catch (error) {
          console.error('❌ Error updating trade:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to update trade',
            isLoading: false,
          });
          throw error;
        }
      },

      // Delete trade (simplified - no auth headers)
      deleteTrade: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('🚀 Deleting trade:', id);
          
          const response = await fetch(`/api/trades/${id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to delete trade: ${response.status}`);
          }

          // Refresh data after deleting
          await Promise.all([
            get().fetchTrades(),
            get().fetchPositions(),
            get().fetchDashboardData(),
          ]);

          set({ isLoading: false });
        } catch (error) {
          console.error('❌ Error deleting trade:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to delete trade',
            isLoading: false,
          });
          throw error;
        }
      },

      // Fetch positions (simplified - no auth headers)
      fetchPositions: async (updatePrices = false) => {
        set({ isLoadingPositions: true, error: null });
        
        try {
          console.log('🚀 Fetching positions...');
          
          const params = updatePrices ? '?updatePrices=true' : '';
          const response = await fetch(`/api/positions${params}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to fetch positions: ${response.status}`);
          }

          const data = await response.json();
          console.log('✅ Positions fetched successfully:', data);
          
          set({
            positions: data.positions || [],
            portfolioStats: data.portfolioStats || null,
            isLoadingPositions: false,
          });
        } catch (error) {
          console.error('❌ Error fetching positions:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch positions',
            isLoadingPositions: false,
          });
        }
      },

      // Update position prices (simplified - no auth headers)
      updatePositionPrices: async () => {
        try {
          console.log('🚀 Updating position prices...');
          
          const response = await fetch('/api/positions/update-prices', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to update prices: ${response.status}`);
          }

          console.log('✅ Position prices updated successfully');

          // Refresh positions after updating prices
          await get().fetchPositions();
        } catch (error) {
          console.error('❌ Error updating prices:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to update prices',
          });
        }
      },

      // Fetch dashboard data (simplified - no auth headers)
      fetchDashboardData: async () => {
        set({ isLoadingDashboard: true, error: null });
        
        try {
          console.log('🚀 Fetching dashboard data...');
          
          const response = await fetch('/api/dashboard', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to fetch dashboard data: ${response.status}`);
          }

          const data = await response.json();
          console.log('✅ Dashboard data fetched successfully:', data);
          
          set({
            dashboardStats: data.stats || null,
            isLoadingDashboard: false,
          });
        } catch (error) {
          console.error('❌ Error fetching dashboard data:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
            isLoadingDashboard: false,
          });
        }
      },

      // Utility functions
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      reset: () => set(initialState),
    }),
    {
      name: 'trade-store', // Store name for debugging
    }
  )
);