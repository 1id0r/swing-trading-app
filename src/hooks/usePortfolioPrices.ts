// hooks/usePortfolioPrices.ts - Custom hook for portfolio price logic
import { useState, useEffect, useMemo } from 'react'

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

interface UsePortfolioPricesProps {
  symbols: string[]
  marketStatus: any
  marketData: Record<string, any>
  lastMarketPrices: Record<string, any>
  prices: Record<string, any>
  positions: Position[] | null
  isLive: boolean
  marketLastUpdate: number
}

export function usePortfolioPrices({
  symbols,
  marketStatus,
  marketData,
  lastMarketPrices,
  prices,
  positions,
  isLive,
  marketLastUpdate
}: UsePortfolioPricesProps) {
  const [directPrices, setDirectPrices] = useState<Record<string, any>>({})

  // Fetch direct prices from API
  useEffect(() => {
    const fetchDirectPrices = async () => {
      if (symbols.length === 0) return

      try {
        const response = await fetch('/api/stocks/batch-quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols }),
        })

        if (response.ok) {
          const data = await response.json()
          setDirectPrices(data.quotes)
        }
      } catch (error) {
        console.error('Failed to fetch direct prices:', error)
      }
    }

    fetchDirectPrices()

    // Refresh every 30 seconds if market is open
    if (marketStatus?.isOpen) {
      const interval = setInterval(fetchDirectPrices, 30000)
      return () => clearInterval(interval)
    }
  }, [symbols, marketStatus?.isOpen])

  // Get best price data for a symbol
  const getBestPriceData = (symbol: string) => {
    const livePrice = prices[symbol]
    const marketPrice = marketData[symbol]
    const directPrice = directPrices[symbol]

    // Prefer live WebSocket data (only available when market is open)
    if (livePrice && livePrice.isLive && livePrice.price > 0) {
      return {
        price: livePrice.price,
        change: livePrice.change,
        changePercent: livePrice.changePercent,
        isLive: true,
        ageLabel: 'Live',
        showAsStale: false,
        dataAge: 'live',
        timestamp: livePrice.timestamp,
      }
    }

    // Use market-aware data (respects market hours)
    if (marketPrice && marketPrice.c > 0) {
      return {
        price: marketPrice.c,
        change: marketPrice.d || 0,
        changePercent: marketPrice.dp || 0,
        isLive: isLive,
        ageLabel: isLive ? 'API Live' : 'Last Close',
        showAsStale: !isLive,
        dataAge: isLive ? 'recent' : 'closed',
        timestamp: marketLastUpdate,
      }
    }

    // Use direct API data
    if (directPrice && directPrice.c > 0) {
      return {
        price: directPrice.c,
        change: directPrice.d || 0,
        changePercent: directPrice.dp || 0,
        isLive: false,
        ageLabel: marketStatus?.isOpen ? 'API Live' : 'Last Close',
        showAsStale: false,
        dataAge: 'direct_api',
        timestamp: Date.now(),
      }
    }

    // No data available
    return {
      price: 0,
      change: 0,
      changePercent: 0,
      isLive: false,
      ageLabel: 'No Data',
      showAsStale: true,
      dataAge: 'none',
      timestamp: 0,
    }
  }

  // Calculate live portfolio stats
  const livePortfolioStats = useMemo(() => {
    if (!positions || positions.length === 0) {
      return {
        totalValue: 0,
        totalCost: 0,
        totalUnrealizedPnL: 0,
        totalPositions: 0,
      }
    }

    let totalValue = 0
    let totalCost = 0

    positions.forEach((position: Position) => {
      const bestPrice = getBestPriceData(position.ticker)
      const currentPrice = bestPrice.price || position.currentPrice || position.averagePrice

      totalCost += position.totalCost
      totalValue += position.totalShares * currentPrice
    })

    return {
      totalValue,
      totalCost,
      totalUnrealizedPnL: totalValue - totalCost,
      totalPositions: positions.length,
    }
  }, [positions, prices, marketData, directPrices])

  return {
    directPrices,
    getBestPriceData,
    livePortfolioStats
  }
}