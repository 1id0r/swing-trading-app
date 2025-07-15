// stores/useTradeStore.ts - FIXED VERSION with Firebase ID token auth
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { auth } from '@/lib/firebase' // Add this import

// Interfaces (keep all your existing interfaces)
interface Trade {
  netProfit: number
  totalValue: number
  id: string
  ticker: string
  company: string
  action: 'BUY' | 'SELL'
  shares: number
  pricePerShare: number
  fee: number
  totalCost: number
  date: string
  notes?: string
  logo?: string
  currency: string
}

interface Position {
  id: string
  ticker: string
  company: string
  logo?: string
  totalShares: number
  averagePrice: number
  totalCost: number
  currentPrice?: number
  lastPriceUpdate?: string
  currency: string
  unrealizedPnL?: number
  unrealizedPnLPercent?: number
}

interface PortfolioStats {
  totalValue: number
  totalCost: number
  totalUnrealizedPnL: number
  totalPositions: number
}

interface DashboardStats {
  totalPnL: number
  activePositions: number
  totalValue: number
  winRate: number
  thisMonthPnL: number
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface TradeStore {
  // State
  trades: Trade[]
  positions: Position[]
  portfolioStats: PortfolioStats | null
  dashboardStats: DashboardStats | null
  pagination: Pagination | null
  
  // Loading states
  isLoading: boolean
  isLoadingPositions: boolean
  isLoadingDashboard: boolean
  
  // Error handling
  error: string | null
  
  // Actions
  fetchTrades: (options?: { ticker?: string; limit?: number; offset?: number }) => Promise<void>
  addTrade: (trade: Omit<Trade, 'id'>) => Promise<void>
  updateTrade: (id: string, updates: Partial<Trade>) => Promise<void>
  deleteTrade: (id: string) => Promise<void>
  fetchPositions: (updatePrices?: boolean) => Promise<void>
  updatePositionPrices: () => Promise<void>
  fetchDashboardData: () => Promise<void>
  
  // Utility methods
  setError: (error: string | null) => void
  clearError: () => void
  reset: () => void
}

// ✅ NEW: Helper function to get Firebase ID token headers
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const currentUser = auth.currentUser
    
    if (!currentUser) {
      throw new Error('User not authenticated')
    }

    // Get the Firebase ID token
    const idToken = await currentUser.getIdToken()
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`, // ✅ This is what your API expects
    }
  } catch (error) {
    console.error('❌ Error getting auth headers:', error)
    throw new Error('Authentication failed')
  }
}

// Initial state
const initialState = {
  trades: [],
  positions: [],
  portfolioStats: null,
  dashboardStats: null,
  pagination: null,
  isLoading: false,
  isLoadingPositions: false,
  isLoadingDashboard: false,
  error: null,
}

// Create the store
export const useTradeStore = create<TradeStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Fetch trades with Firebase authentication
      fetchTrades: async (options = {}) => {
        set({ isLoading: true, error: null })
        
        try {
          console.log('🚀 Fetching trades with Firebase auth...')
          
          const { ticker, limit = 50, offset = 0 } = options
          const params = new URLSearchParams({
            limit: limit.toString(),
            offset: offset.toString(),
            ...(ticker && { ticker }),
          })

          const headers = await getAuthHeaders() // ✅ Get Firebase token
          const response = await fetch(`/api/trades?${params}`, {
            method: 'GET',
            headers,
          })
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `Failed to fetch trades: ${response.status}`)
          }

          const data = await response.json()
          console.log('✅ Trades fetched successfully:', data)
          
          set({
            trades: data.trades || [],
            pagination: data.pagination || null,
            isLoading: false,
          })
        } catch (error) {
          console.error('❌ Error fetching trades:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch trades',
            isLoading: false,
          })
        }
      },

      // Add trade with Firebase authentication
      addTrade: async (trade) => {
        set({ isLoading: true, error: null })
        
        try {
          console.log('🚀 Adding trade with Firebase auth:', trade)
          
          const headers = await getAuthHeaders() // ✅ Get Firebase token
          const response = await fetch('/api/trades', {
            method: 'POST',
            headers,
            body: JSON.stringify(trade),
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `Failed to add trade: ${response.status}`)
          }

          const data = await response.json()
          console.log('✅ Trade added successfully:', data)

          // Refresh data after adding
          await Promise.all([
            get().fetchTrades(),
            get().fetchPositions(),
            get().fetchDashboardData(),
          ])

          set({ isLoading: false })
        } catch (error) {
          console.error('❌ Error adding trade:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to add trade',
            isLoading: false,
          })
          throw error
        }
      },

      // Update trade with Firebase authentication
      updateTrade: async (id, updates) => {
        set({ isLoading: true, error: null })
        
        try {
          console.log('🚀 Updating trade with Firebase auth:', id, updates)
          
          const headers = await getAuthHeaders() // ✅ Get Firebase token
          const response = await fetch(`/api/trades/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updates),
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `Failed to update trade: ${response.status}`)
          }

          // Refresh data after updating
          await Promise.all([
            get().fetchTrades(),
            get().fetchPositions(),
            get().fetchDashboardData(),
          ])

          set({ isLoading: false })
        } catch (error) {
          console.error('❌ Error updating trade:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to update trade',
            isLoading: false,
          })
          throw error
        }
      },

      // Delete trade with Firebase authentication
      deleteTrade: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
          console.log('🚀 Deleting trade with Firebase auth:', id)
          
          const headers = await getAuthHeaders() // ✅ Get Firebase token
          const response = await fetch(`/api/trades/${id}`, {
            method: 'DELETE',
            headers,
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `Failed to delete trade: ${response.status}`)
          }

          // Refresh data after deleting
          await Promise.all([
            get().fetchTrades(),
            get().fetchPositions(),
            get().fetchDashboardData(),
          ])

          set({ isLoading: false })
        } catch (error) {
          console.error('❌ Error deleting trade:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to delete trade',
            isLoading: false,
          })
          throw error
        }
      },

      // Fetch positions with Firebase authentication
      fetchPositions: async (updatePrices = false) => {
        set({ isLoadingPositions: true, error: null })
        
        try {
          console.log('🚀 Fetching positions with Firebase auth...')
          
          const params = updatePrices ? '?updatePrices=true' : ''
          const headers = await getAuthHeaders() // ✅ Get Firebase token
          const response = await fetch(`/api/positions${params}`, {
            method: 'GET',
            headers,
          })
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `Failed to fetch positions: ${response.status}`)
          }

          const data = await response.json()
          console.log('✅ Positions fetched successfully:', data)
          
          set({
            positions: data.positions || [],
            portfolioStats: data.portfolioStats || null,
            isLoadingPositions: false,
          })
        } catch (error) {
          console.error('❌ Error fetching positions:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch positions',
            isLoadingPositions: false,
          })
        }
      },

      // Update position prices with Firebase authentication
      updatePositionPrices: async () => {
        try {
          console.log('🚀 Updating position prices with Firebase auth...')
          
          const headers = await getAuthHeaders() // ✅ Get Firebase token
          const response = await fetch('/api/positions/update-prices', {
            method: 'POST',
            headers,
          })
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `Failed to update prices: ${response.status}`)
          }

          console.log('✅ Position prices updated successfully')

          // Refresh positions after updating prices
          await get().fetchPositions()
        } catch (error) {
          console.error('❌ Error updating prices:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to update prices',
          })
        }
      },

      // Fetch dashboard data with Firebase authentication
      fetchDashboardData: async () => {
        set({ isLoadingDashboard: true, error: null })
        
        try {
          console.log('🚀 Fetching dashboard data with Firebase auth...')
          
          const headers = await getAuthHeaders() // ✅ Get Firebase token
          const response = await fetch('/api/dashboard', {
            method: 'GET',
            headers,
          })
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `Failed to fetch dashboard data: ${response.status}`)
          }

          const data = await response.json()
          console.log('✅ Dashboard data fetched successfully:', data)
          
          set({
            dashboardStats: data.stats || null,
            isLoadingDashboard: false,
          })
        } catch (error) {
          console.error('❌ Error fetching dashboard data:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
            isLoadingDashboard: false,
          })
        }
      },

      // Utility methods
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
      reset: () => set(initialState),
    }),
    {
      name: 'trade-store', // devtools name
    }
  )
)

// Export types for use in components
export type { Trade, Position, PortfolioStats, DashboardStats, TradeStore }