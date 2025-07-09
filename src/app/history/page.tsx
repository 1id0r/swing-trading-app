// src/app/history/page.tsx
'use client'

import { useEffect } from 'react'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { TradeCard } from '@/components/trade/TradeCard'
import { useTradeStore } from '@/stores/useTradeStore'
import { Search } from 'lucide-react' // Removed unused Filter import
import { useState, useMemo } from 'react'

export default function HistoryPage() {
  const { trades, fetchTrades, isLoading, error } = useTradeStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL')

  // Fetch trades when component mounts
  useEffect(() => {
    fetchTrades()
  }, [fetchTrades])

  const filteredTrades = useMemo(() => {
    if (!trades || trades.length === 0) return []

    return trades
      .filter((trade) => {
        const matchesSearch =
          trade.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trade.company.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesFilter = filter === 'ALL' || trade.action === filter
        return matchesSearch && matchesFilter
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [trades, searchTerm, filter])

  return (
    <MobileLayout title='Trade History' subtitle={`${trades?.length || 0} total trades`}>
      <div className='space-y-4'>
        {/* Error Message */}
        {error && (
          <div className='bg-red-500/20 border border-red-500 rounded-lg p-3'>
            <p className='text-red-400 text-sm'>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className='theme-card p-8'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2'></div>
              <p className='theme-text-secondary'>Loading trades...</p>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        {!isLoading && (
          <div className='space-y-3'>
            <div className='relative'>
              <Search className='absolute left-3 top-3 w-4 h-4 theme-text-secondary' />
              <input
                type='text'
                placeholder='Search trades...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full theme-card rounded-lg p-3 pl-10 theme-text-primary placeholder-gray-400 focus:border-blue-500 focus:outline-none'
              />
            </div>

            <div className='flex gap-2'>
              {(['ALL', 'BUY', 'SELL'] as const).map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterOption
                      ? 'bg-blue-600 theme-text-primary'
                      : 'theme-card theme-text-secondary hover:theme-text-primary'
                  }`}
                >
                  {filterOption}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trade List */}
        {!isLoading && (
          <div className='space-y-3'>
            {filteredTrades.length === 0 ? (
              <div className='text-center py-12'>
                <div className='theme-text-secondary mb-2'>No trades found</div>
                <div className='text-sm theme-text-secondary'>
                  {!trades || trades.length === 0
                    ? 'Add your first trade to get started'
                    : 'Try adjusting your search or filter'}
                </div>
              </div>
            ) : (
              filteredTrades.map((trade) => <TradeCard key={trade.id} trade={trade} />)
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  )
}
