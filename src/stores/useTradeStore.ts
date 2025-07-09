// Update your /src/stores/useTradeStore.ts with proper authentication
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useAuth } from '@/app/contexts/AuthContext'

// ... keep your existing interfaces ...

interface TradeStore {
  // ... keep your existing state ...
  
  // Updated methods with authentication
  fetchTrades: (options?: { ticker?: string; limit?: number; offset?: number }) => Promise<void>
  addTrade: (trade: any) => Promise<void>
  updateTrade: (id: string, updates: any) => Promise<void>
  deleteTrade: (id: string) => Promise<void>
  fetchPositions: (updatePrices?: boolean) => Promise<void>
  updatePositionPrices: () => Promise<void>
  fetchDashboardData: () => Promise<void>
  
  // ... keep your existing utility methods ...
}

// Helper function to get authenticated headers
const getAuthHeaders = () => {
  // Get the current user from your auth context
  // This is a workaround since we can't use hooks in Zustand
  const authContext = (window as any).__AUTH_CONTEXT__
  
  if (authContext?.dbUserId) {
    return {
      'Content-Type': 'application/json',
      'x-user-id': authContext.dbUserId,
    }
  }
  
  return {
    'Content-Type': 'application/json',
  }
}

export const useTradeStore = create<TradeStore>()(
  devtools(
    (set, get) => ({
      // ... keep your existing initial state ...

      // Fetch trades with user authentication
      fetchTrades: async (options = {}) => {
        set({ isLoading: true, error: null })
        
        try {
          console.log('🚀 Fetching trades with auth...')
          
          const { ticker, limit = 50, offset = 0 } = options
          const params = new URLSearchParams({
            limit: limit.toString(),
            offset: offset.toString(),
            ...(ticker && { ticker }),
          })

          const response = await fetch(`/api/trades?${params}`, {
            method: 'GET',
            headers: getAuthHeaders(),
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

      // Add trade with user authentication
      addTrade: async (trade) => {
        set({ isLoading: true, error: null })
        
        try {
          console.log('🚀 Adding trade with auth:', trade)
          
          const response = await fetch('/api/trades', {
            method: 'POST',
            headers: getAuthHeaders(),
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

      // Update trade with user authentication
      updateTrade: async (id, updates) => {
        set({ isLoading: true, error: null })
        
        try {
          console.log('🚀 Updating trade with auth:', id, updates)
          
          const response = await fetch(`/api/trades/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
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

      // Delete trade with user authentication
      deleteTrade: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
          console.log('🚀 Deleting trade with auth:', id)
          
          const response = await fetch(`/api/trades/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
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

      // Fetch positions with user authentication
      fetchPositions: async (updatePrices = false) => {
        set({ isLoadingPositions: true, error: null })
        
        try {
          console.log('🚀 Fetching positions with auth...')
          
          const params = updatePrices ? '?updatePrices=true' : ''
          const response = await fetch(`/api/positions${params}`, {
            method: 'GET',
            headers: getAuthHeaders(),
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

      // Update position prices with user authentication
      updatePositionPrices: async () => {
        try {
          console.log('🚀 Updating position prices with auth...')
          
          const response = await fetch('/api/positions/update-prices', {
            method: 'POST',
            headers: getAuthHeaders(),
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

      // Fetch dashboard data with user authentication
      fetchDashboardData: async () => {
        set({ isLoadingDashboard: true, error: null })
        
        try {
          console.log('🚀 Fetching dashboard data with auth...')
          
          const response = await fetch('/api/dashboard', {
            method: 'GET',
            headers: getAuthHeaders(),
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
        } catch (error) {p
          console.error('❌ Error fetching dashboard data:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
            isLoadingDashboard: false,
          })
        }
      },

      // ... keep your existing utility methods ...
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      reset: () => set(initialState),
    }),
    {
      name: 'trade-store',
    }
  )
)