// src/app/history/page.tsx - Updated with delete functionality
'use client'

import { useEffect } from 'react'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { TradeCard } from '@/components/trade/TradeCard'
import { useTradeStore } from '@/stores/useTradeStore'
import { Search, Trash2 } from 'lucide-react'
import { useState, useMemo } from 'react'

export default function HistoryPage() {
  const { trades, fetchTrades, deleteTrade, isLoading, error } = useTradeStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL')
  const [deleteError, setDeleteError] = useState<string | null>(null)

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

  const handleDeleteTrade = async (tradeId: string) => {
    try {
      setDeleteError(null)
      await deleteTrade(tradeId)

      // Show success message briefly
      // You could implement a toast notification here instead
      console.log('✅ Trade deleted successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete trade'
      setDeleteError(errorMessage)
      console.error('❌ Failed to delete trade:', error)

      // Clear error after 5 seconds
      setTimeout(() => setDeleteError(null), 5000)
    }
  }

  const handleEditTrade = (trade: any) => {
    // TODO: Implement edit functionality
    // This could navigate to an edit page or open a modal
    console.log('Edit trade:', trade)
    // For now, just log - you can implement this later
  }

  return (
    <MobileLayout title='Trade History' subtitle={`${trades?.length || 0} total trades`}>
      <div className='space-y-4'>
        {/* Error Messages */}
        {error && (
          <div className='bg-red-500/20 border border-red-500 rounded-lg p-3'>
            <p className='text-red-400 text-sm'>{error}</p>
          </div>
        )}

        {deleteError && (
          <div className='bg-red-500/20 border border-red-500 rounded-lg p-3 flex items-center gap-2'>
            <Trash2 className='w-4 h-4 text-red-400' />
            <p className='text-red-400 text-sm'>{deleteError}</p>
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
              filteredTrades.map((trade) => (
                <TradeCard key={trade.id} trade={trade} onEdit={handleEditTrade} onDelete={handleDeleteTrade} />
              ))
            )}
          </div>
        )}

        {/* Summary Stats */}
        {!isLoading && filteredTrades.length > 0 && (
          <div className='theme-card p-4 mt-6'>
            <h4 className='text-sm font-semibold theme-text-primary mb-3'>
              {filter === 'ALL' ? 'All Trades' : `${filter} Trades`} Summary
            </h4>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='theme-text-secondary'>Total Trades:</span>
                <span className='theme-text-primary font-medium ml-2'>{filteredTrades.length}</span>
              </div>
              <div>
                <span className='theme-text-secondary'>Total Value:</span>
                <span className='theme-text-primary font-medium ml-2'>
                  $
                  {filteredTrades
                    .reduce((sum, trade) => sum + (trade.totalValue || trade.shares * trade.pricePerShare), 0)
                    .toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  )
}
