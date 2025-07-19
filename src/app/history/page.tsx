// src/app/history/page.tsx - Updated with expandable cards
'use client'

import { useEffect } from 'react'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { ExpandableTradeCard } from '@/components/trade/ExpandableTradeCard'
import { useTradeStore } from '@/stores/useTradeStore'
import { Search, Trash2, TrendingUp, TrendingDown, DollarSign, Hash, ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { toFixed } from '@/lib/format'

export default function HistoryPage() {
  const { user } = useAuth()
  const { trades, fetchTrades, deleteTrade, isLoading, error } = useTradeStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [expandAll, setExpandAll] = useState(false)

  // Fetch trades when component mounts
  useEffect(() => {
    if (!user) return
    fetchTrades()
  }, [fetchTrades, user])

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

  // Summary calculations
  const summary = useMemo(() => {
    const totalValue = filteredTrades.reduce((sum, t) => sum + (t.totalValue ?? t.shares * t.pricePerShare), 0)
    const totalProfit = filteredTrades.reduce((sum, t) => sum + (t.netProfit ?? 0), 0)
    const buyTrades = filteredTrades.filter((t) => t.action === 'BUY').length
    const sellTrades = filteredTrades.filter((t) => t.action === 'SELL').length

    return { totalValue, totalProfit, buyTrades, sellTrades }
  }, [filteredTrades])

  const handleDeleteTrade = async (tradeId: string) => {
    try {
      setDeleteError(null)
      await deleteTrade(tradeId)
      console.log('✅ Trade deleted successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete trade'
      setDeleteError(errorMessage)
      console.error('❌ Failed to delete trade:', error)
      setTimeout(() => setDeleteError(null), 5000)
    }
  }

  const handleEditTrade = (trade: any) => {
    console.log('Edit trade:', trade)
    // TODO: Implement edit functionality
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
          <div className='theme-card p-6'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2'></div>
              <p className='theme-text-secondary text-sm'>Loading trades...</p>
            </div>
          </div>
        )}

        {/* Compact Summary Stats */}
        {!isLoading && filteredTrades.length > 0 && (
          <div className='grid grid-cols-2 gap-3'>
            <div className='theme-card p-3'>
              <div className='flex items-center gap-2 mb-1'>
                <Hash className='w-4 h-4 theme-text-secondary' />
                <span className='theme-text-secondary text-xs'>Trades</span>
              </div>
              <div className='theme-text-primary font-semibold'>{filteredTrades.length}</div>
              <div className='text-xs theme-text-secondary'>
                {summary.buyTrades} BUY • {summary.sellTrades} SELL
              </div>
            </div>

            <div className='theme-card p-3'>
              <div className='flex items-center gap-2 mb-1'>
                <DollarSign className='w-4 h-4 theme-text-secondary' />
                <span className='theme-text-secondary text-xs'>Total Value</span>
              </div>
              <div className='theme-text-primary font-semibold'>${toFixed(summary.totalValue)}</div>
              {summary.totalProfit !== 0 && (
                <div
                  className={`text-xs flex items-center gap-1 ${
                    summary.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {summary.totalProfit >= 0 ? <TrendingUp className='w-3 h-3' /> : <TrendingDown className='w-3 h-3' />}
                  {summary.totalProfit >= 0 ? '+' : ''}${toFixed(summary.totalProfit)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search and Filter Controls */}
        {!isLoading && (
          <div className='space-y-3'>
            <div className='relative'>
              <Search className='absolute left-3 top-2.5 w-4 h-4 theme-text-secondary' />
              <input
                type='text'
                placeholder='Search trades...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full theme-input text-sm py-2 pl-10 pr-4'
              />
            </div>

            {/* Filter Buttons + Expand All Control */}
            <div className='flex items-center justify-between gap-2'>
              <div className='flex gap-2'>
                {(['ALL', 'BUY', 'SELL'] as const).map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filter === filterOption
                        ? 'bg-blue-600 text-white'
                        : 'theme-card theme-text-secondary hover:theme-text-primary'
                    }`}
                  >
                    {filterOption}
                    {filterOption !== 'ALL' && (
                      <span className='ml-1 opacity-70'>
                        ({filterOption === 'BUY' ? summary.buyTrades : summary.sellTrades})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Expand/Collapse All */}
              {filteredTrades.length > 0 && (
                <button
                  onClick={() => setExpandAll(!expandAll)}
                  className='flex items-center gap-1 px-3 py-1.5 theme-card theme-text-secondary hover:theme-text-primary rounded-lg text-xs font-medium transition-colors'
                >
                  {expandAll ? (
                    <>
                      <ChevronUp className='w-3 h-3' />
                      Collapse All
                    </>
                  ) : (
                    <>
                      <ChevronDown className='w-3 h-3' />
                      Expand All
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Expandable Trade List */}
        {!isLoading && (
          <div className='space-y-2'>
            {filteredTrades.length === 0 ? (
              <div className='text-center py-8'>
                <div className='theme-text-secondary mb-2 text-sm'>No trades found</div>
                <div className='text-xs theme-text-secondary'>
                  {!trades || trades.length === 0
                    ? 'Add your first trade to get started'
                    : 'Try adjusting your search or filter'}
                </div>
              </div>
            ) : (
              filteredTrades.map((trade) => (
                <ExpandableTradeCard
                  key={trade.id}
                  trade={trade}
                  onEdit={handleEditTrade}
                  onDelete={handleDeleteTrade}
                  defaultExpanded={expandAll}
                />
              ))
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  )
}
