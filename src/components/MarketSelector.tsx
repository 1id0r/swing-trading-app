// Create: /src/components/MarketSelector.tsx
'use client'

import { useState, useEffect } from 'react'
import { MarketHoursService, MarketStatus } from '@/lib/marketHours'
import { Clock, Globe } from 'lucide-react'

interface MarketSelectorProps {
  onMarketChange?: (market: 'US' | 'ISRAEL') => void
  symbols: string[]
}

export function MarketSelector({ onMarketChange, symbols }: MarketSelectorProps) {
  const [selectedMarket, setSelectedMarket] = useState<'US' | 'ISRAEL'>('US')
  const [marketStatuses, setMarketStatuses] = useState<{
    us: MarketStatus
    israel: MarketStatus
  } | null>(null)

  useEffect(() => {
    // Auto-detect market based on symbols
    const detectedMarket = MarketHoursService.detectMarket(symbols)
    setSelectedMarket(detectedMarket)

    // Update market statuses
    const updateStatuses = () => {
      const statuses = MarketHoursService.getCombinedMarketStatus(symbols)
      setMarketStatuses(statuses)
    }

    updateStatuses()
    const interval = setInterval(updateStatuses, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [symbols])

  const handleMarketChange = (market: 'US' | 'ISRAEL') => {
    setSelectedMarket(market)
    onMarketChange?.(market)
  }

  if (!marketStatuses) return null

  const currentStatus = selectedMarket === 'US' ? marketStatuses.us : marketStatuses.israel

  return (
    <div className='space-y-2'>
      {/* Market Selector */}
      <div className='flex items-center justify-center gap-2'>
        <Globe className='w-4 h-4 text-gray-400' />
        <div className='flex bg-gray-800 rounded-lg p-1'>
          <button
            onClick={() => handleMarketChange('US')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              selectedMarket === 'US' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            US Market
          </button>
          <button
            onClick={() => handleMarketChange('ISRAEL')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              selectedMarket === 'ISRAEL' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Israeli Market
          </button>
        </div>
      </div>

      {/* Current Market Status */}
      <div className='flex items-center justify-center'>
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
            currentStatus.isOpen ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}
        >
          <Clock className='w-3 h-3' />
          <span>{MarketHoursService.getMarketStatusMessage(currentStatus)}</span>
        </div>
      </div>

      {/* Both Markets Quick View */}
      <div className='flex items-center justify-center gap-4 text-xs text-gray-400'>
        <div className='flex items-center gap-1'>
          <span>US:</span>
          <span className={marketStatuses.us.isOpen ? 'text-green-400' : 'text-yellow-400'}>
            {marketStatuses.us.isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
        <div className='flex items-center gap-1'>
          <span>IL:</span>
          <span className={marketStatuses.israel.isOpen ? 'text-green-400' : 'text-yellow-400'}>
            {marketStatuses.israel.isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>
    </div>
  )
}
