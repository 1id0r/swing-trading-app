// /src/components/watchlist/WatchlistChartView.tsx
'use client'

import React, { useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import { MobileLayout } from '@/components/layout/MobileLayout'

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

// Watchlist Chart View Component - MINIMAL VERSION (Chart Only)
interface WatchlistChartViewProps {
  ticker: string
  company: string
  logo?: string
  onBack: () => void
}

export const WatchlistChartView: React.FC<WatchlistChartViewProps> = ({ ticker, company, logo, onBack }) => {
  return (
    <MobileLayout title={ticker} subtitle={company} showBackButton={true} onBackClick={onBack}>
      <div className='min-h-screen bg-black text-white flex flex-col'>
        {/* TradingView Chart - Takes up ALL space, no portfolio card */}
        <div className='flex-1 bg-black'>
          <TradingViewChart symbol={ticker} theme='dark' />
        </div>
      </div>
    </MobileLayout>
  )
}
