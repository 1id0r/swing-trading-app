// Create this file: /src/app/portfolio/[ticker]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { StockDetailPage } from '@/components/portfolio/StockDetailPage'

// Define the Position interface to match your data structure
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
}

// Define the complete TradeStore interface
interface TradeStore {
  // State
  positions: Position[] | null
  portfolioStats: any
  isLoadingPositions: boolean
  isLoading: boolean
  error: string | null
  trades: any[]
  pagination: any
  dashboardStats: any
  isLoadingDashboard: boolean

  // Methods
  fetchPositions: (updatePrices?: boolean) => Promise<void>
  fetchTrades: (options?: { ticker?: string; limit?: number; offset?: number }) => Promise<void>
  addTrade: (trade: any) => Promise<void>
  updateTrade: (id: string, updates: any) => Promise<void>
  deleteTrade: (id: string) => Promise<void>
  updatePositionPrices: () => Promise<void>
  fetchDashboardData: () => Promise<void>
  setError: (error: string | null) => void
  clearError: () => void
  reset: () => void
}

// Create a typed version of useTradeStore
declare const useTradeStore: {
  <T>(selector: (state: TradeStore) => T): T
  (): TradeStore
}

// Import the actual store (this will work at runtime)
const { useTradeStore: actualUseTradeStore } = require('@/stores/useTradeStore')
const useTypedTradeStore = actualUseTradeStore as typeof useTradeStore

export default function StockDetailPageRoute() {
  const router = useRouter()
  const params = useParams()
  const ticker = params.ticker as string

  // Get store functions and state with proper typing
  const fetchPositions = useTypedTradeStore((state) => state.fetchPositions)
  const positions = useTypedTradeStore((state) => state.positions)
  const isLoadingPositions = useTypedTradeStore((state) => state.isLoadingPositions)

  const [position, setPosition] = useState<Position | null>(null)

  useEffect(() => {
    // Fetch positions if not already loaded
    if (!positions || positions.length === 0) {
      fetchPositions()
    }
  }, [positions, fetchPositions])

  useEffect(() => {
    // Find the position for this ticker
    if (positions && positions.length > 0) {
      const foundPosition = positions.find((p: Position) => p.ticker === ticker.toUpperCase())
      if (foundPosition) {
        setPosition(foundPosition)
      } else {
        // If position not found, redirect back to portfolio
        router.push('/portfolio')
      }
    }
  }, [positions, ticker, router])

  const handleBack = () => {
    router.push('/portfolio')
  }

  if (isLoadingPositions) {
    return (
      <div className='min-h-screen bg-black text-white flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2'></div>
          <p className='text-gray-400'>Loading position...</p>
        </div>
      </div>
    )
  }

  if (!position) {
    return (
      <div className='min-h-screen bg-black text-white flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-gray-400 mb-4'>Position not found</p>
          <button
            onClick={handleBack}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            Back to Portfolio
          </button>
        </div>
      </div>
    )
  }

  return <StockDetailPage position={position} onBack={handleBack} />
}
