// /src/components/portfolio/StockDetailPage.tsx
'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react'
import { MobileLayout } from '@/components/layout/MobileLayout'

// TradingView Chart Component with Volume & RSI
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
      // Add technical indicators
      studies: [
        'Volume@tv-basicstudies', // Volume indicator
        'RSI@tv-basicstudies', // RSI (Relative Strength Index)
        'EMA@tv-basicstudies-15', // EMA 15
        'EMA@tv-basicstudies-50', // EMA 50
        'EMA@tv-basicstudies-100', // EMA 100
        'EMA@tv-basicstudies-150', // EMA 150
      ],
      // Configure the layout to show volume at bottom
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      // Volume will appear at the bottom, RSI will be overlaid on price chart
      show_popup_button: true,
      popup_width: '1000',
      popup_height: '650',
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
    averagePrice: number
    totalCost: number
    currentPrice?: number
    lastPriceUpdate?: string
  }
  onBack: () => void
}

export const StockDetailPage: React.FC<StockDetailPageProps> = ({ position, onBack }) => {
  const [currentPrice, setCurrentPrice] = useState(position.currentPrice || position.averagePrice)
  const [priceChange, setPriceChange] = useState(0)
  const [priceChangePercent, setPriceChangePercent] = useState(0)

  // Calculate P&L
  const currentValue = position.totalShares * currentPrice
  const unrealizedPnL = currentValue - position.totalCost
  const unrealizedPnLPercent = position.totalCost > 0 ? (unrealizedPnL / position.totalCost) * 100 : 0

  // Mock real-time price updates (replace with actual WebSocket or API calls)
  useEffect(() => {
    const interval = setInterval(() => {
      const mockChange = (Math.random() - 0.5) * 2 // Random change between -1 and 1
      const newPrice = Math.max(0.01, currentPrice + mockChange) // Ensure price doesn't go negative
      const change = newPrice - position.averagePrice
      const changePercent = position.averagePrice > 0 ? (change / position.averagePrice) * 100 : 0

      setCurrentPrice(newPrice)
      setPriceChange(change)
      setPriceChangePercent(changePercent)
    }, 3000)

    return () => clearInterval(interval)
  }, [currentPrice, position.averagePrice])

  return (
    <MobileLayout title={position.ticker} subtitle={position.company} showBackButton={true} onBackClick={onBack}>
      <div className='min-h-screen bg-black text-white flex flex-col'>
        {/* Portfolio Card */}
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
                    {unrealizedPnL >= 0 ? '+' : ''}${Math.abs(unrealizedPnL).toFixed(2)}
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
                <div className='theme-text-primary font-medium'>{position.totalShares.toLocaleString()}</div>
              </div>
              <div>
                <div className='theme-text-secondary'>Avg Price</div>
                <div className='theme-text-primary font-medium'>${position.averagePrice.toFixed(2)}</div>
              </div>
              <div>
                <div className='theme-text-secondary'>Current</div>
                <div className='theme-text-primary font-medium'>${currentPrice.toFixed(2)}</div>
              </div>
            </div>

            <div className='mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs theme-text-secondary'>
              <span>Cost: ${position.totalCost.toFixed(2)}</span>
              <span>Value: ${currentValue.toFixed(2)}</span>
            </div>

            <div className='mt-1 text-xs text-green-400 text-center'>Live • {new Date().toLocaleTimeString()}</div>
          </div>
        </div>

        {/* TradingView Chart with Volume & RSI - Takes up remaining space */}
        <div className='flex-1 bg-gray-900 border-t border-gray-800'>
          <TradingViewChart symbol={position.ticker} theme='dark' />
        </div>
      </div>
    </MobileLayout>
  )
}
