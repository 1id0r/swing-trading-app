// Fixed StockDetailPage Component - Handle null values from PostgreSQL
'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react'
import { MobileLayout } from '@/components/layout/MobileLayout'

// Helper function to safely handle price formatting
const safeToFixed = (value: number | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00'
  }
  return Number(value).toFixed(decimals)
}

// Helper function to safely get numeric values
const safeNumber = (value: number | null | undefined, fallback: number = 0): number => {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback
  }
  return Number(value)
}

// TradingView Chart Component
interface TradingViewChartProps {
  symbol: string
  theme?: 'light' | 'dark'
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ symbol, theme = 'dark' }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Clear any existing widget
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: theme,
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    })

    containerRef.current.appendChild(script)

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [symbol, theme])

  return (
    <div style={{ height: '90vh' }}>
      <div ref={containerRef} className='h-full w-full' />
    </div>
  )
}

// Stock Detail Page Component
interface StockDetailPageProps {
  position: {
    id: string
    ticker: string
    company: string
    logo?: string
    totalShares: number
    averagePrice: number | null // Allow null from PostgreSQL
    totalCost: number
    currentPrice?: number | null
    lastPriceUpdate?: string
  }
  onBack: () => void
}

export const StockDetailPage: React.FC<StockDetailPageProps> = ({ position, onBack }) => {
  const safeAvgPrice = safeNumber(position.averagePrice)
  const safeCurrPrice = safeNumber(position.currentPrice) || safeAvgPrice

  const [currentPrice, setCurrentPrice] = useState(safeCurrPrice)
  const [priceChange, setPriceChange] = useState(0)
  const [priceChangePercent, setPriceChangePercent] = useState(0)

  // Calculate P&L with safe values
  const positionShares = safeNumber(position.totalShares)
  const positionCost = safeNumber(position.totalCost)

  const currentValue = positionShares * currentPrice
  const unrealizedPnL = currentValue - positionCost
  const unrealizedPnLPercent = positionCost > 0 ? (unrealizedPnL / positionCost) * 100 : 0

  // Mock real-time price updates (replace with actual WebSocket or API calls)
  useEffect(() => {
    const interval = setInterval(() => {
      const mockChange = (Math.random() - 0.5) * 2 // Random change between -1 and 1
      const newPrice = Math.max(0.01, currentPrice + mockChange) // Ensure price doesn't go negative
      const change = newPrice - safeAvgPrice
      const changePercent = safeAvgPrice > 0 ? (change / safeAvgPrice) * 100 : 0

      setCurrentPrice(newPrice)
      setPriceChange(change)
      setPriceChangePercent(changePercent)
    }, 3000)

    return () => clearInterval(interval)
  }, [currentPrice, safeAvgPrice])

  return (
    <MobileLayout title={position.ticker} subtitle={position.company} showBackButton={true} onBackClick={onBack}>
      <div className='min-h-screen bg-black text-white flex flex-col'>
        <div className='pb-4'>
          <div className='theme-card p-4'>
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center theme-text-primary font-bold text-sm'>
                  {position.logo ? (
                    <img
                      src={position.logo}
                      alt={position.ticker}
                      className='w-8 h-8 rounded-full object-cover'
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  ) : (
                    <span>{position.ticker.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <div className='flex items-center gap-2'>
                    <div className='theme-text-primary font-medium'>{position.ticker}</div>
                    <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                  </div>
                  <div className='text-sm theme-text-secondary truncate'>{position.company}</div>
                </div>
              </div>

              <div className='text-right'>
                <div className={`flex items-center gap-1 ${unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {unrealizedPnL >= 0 ? <TrendingUp className='w-4 h-4' /> : <TrendingDown className='w-4 h-4' />}
                  <span className='font-medium'>
                    {unrealizedPnL >= 0 ? '+' : ''}${safeToFixed(Math.abs(unrealizedPnL))}
                  </span>
                </div>
                <div className={`text-xs ${unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {unrealizedPnL >= 0 ? '+' : ''}
                  {Math.abs(unrealizedPnLPercent).toFixed(2)}%
                </div>
              </div>
            </div>

            <div className='grid grid-cols-3 gap-4 text-sm'>
              <div>
                <div className='theme-text-secondary'>Shares</div>
                <div className='theme-text-primary font-medium'>{positionShares.toLocaleString()}</div>
              </div>
              <div>
                <div className='theme-text-secondary'>Avg Price</div>
                <div className='theme-text-primary font-medium'>${safeToFixed(safeAvgPrice)}</div>
              </div>
              <div>
                <div className='theme-text-secondary'>Current</div>
                <div className='theme-text-primary font-medium'>${safeToFixed(currentPrice)}</div>
              </div>
            </div>

            <div className='mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs theme-text-secondary'>
              <span>Cost: ${safeToFixed(positionCost)}</span>
              <span>Value: ${safeToFixed(currentValue)}</span>
            </div>

            <div className='mt-1 text-xs text-green-400 text-center'>Live • {new Date().toLocaleTimeString()}</div>
          </div>
        </div>

        {/* TradingView Chart - Takes up remaining space */}
        <div className='flex-1 bg-gray-900 border-t border-gray-800'>
          <TradingViewChart symbol={position.ticker} theme='dark' />
        </div>
      </div>
    </MobileLayout>
  )
}
