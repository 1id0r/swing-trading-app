// components/trade/TradeCard.tsx - Refactored with pure Tailwind
'use client'
import { toFixed } from '@/lib/format'
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { cn, themeClass, getPriceChangeClass } from '@/lib/theme-utils'

interface Trade {
  id: string
  ticker: string
  company: string
  action: 'BUY' | 'SELL'
  shares: number
  pricePerShare: number
  date: string
  netProfit?: number
  fee: number
  totalValue?: number
  totalCost?: number
}

interface TradeCardProps {
  trade: Trade
  onEdit?: (trade: Trade) => void
  onDelete?: (tradeId: string) => void
}

export function TradeCard({ trade, onEdit, onDelete }: TradeCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Use totalValue if available, otherwise calculate from shares * pricePerShare
  const totalValue = trade.totalValue || trade.shares * trade.pricePerShare

  const handleDelete = async () => {
    if (!onDelete) return

    setIsDeleting(true)
    try {
      await onDelete(trade.id)
      setShowDeleteConfirm(false)
      setShowActions(false)
    } catch (error) {
      console.error('Failed to delete trade:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <>
      <div
        className={cn(
          themeClass('card'),
          themeClass('cardHover'),
          'p-4 transition-all duration-200 relative',
          'hover:scale-[1.02] hover:shadow-lg dark:hover:shadow-slate-900/20'
        )}
      >
        {/* Main Content */}
        <div className='flex items-center justify-between mb-3'>
          {/* Left side - Company info */}
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg'>
              {trade.ticker.charAt(0)}
            </div>
            <div>
              <div className={cn(themeClass('textPrimary'), 'font-semibold text-lg')}>{trade.ticker}</div>
              <div className={cn(themeClass('textSecondary'), 'text-sm')}>{trade.company}</div>
            </div>
          </div>

          {/* Right side - Action badge */}
          <div className='flex items-center gap-2'>
            <div
              className={cn(
                'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold',
                trade.action === 'BUY'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              )}
            >
              {trade.action === 'BUY' ? <ArrowUpRight className='w-3 h-3' /> : <ArrowDownRight className='w-3 h-3' />}
              {trade.action}
            </div>

            {/* More actions button */}
            <div className='relative'>
              <button
                onClick={() => setShowActions(!showActions)}
                className={cn(themeClass('hover'), 'p-2 rounded-lg transition-colors duration-200')}
              >
                <MoreHorizontal className={cn(themeClass('textSecondary'), 'w-4 h-4')} />
              </button>

              {/* Actions dropdown */}
              {showActions && (
                <div className={cn(themeClass('card'), 'absolute right-0 top-full mt-2 w-32 py-1 z-10 shadow-xl')}>
                  <button
                    onClick={() => {
                      onEdit?.(trade)
                      setShowActions(false)
                    }}
                    className={cn(
                      themeClass('hover'),
                      themeClass('textPrimary'),
                      'w-full flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors duration-200'
                    )}
                  >
                    <Edit className='w-3 h-3' />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true)
                      setShowActions(false)
                    }}
                    className='w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200'
                  >
                    <Trash2 className='w-3 h-3' />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trade Details */}
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div>
            <div className={cn(themeClass('textSecondary'), 'mb-1')}>Shares</div>
            <div className={cn(themeClass('textPrimary'), 'font-mono font-semibold')}>
              {trade.shares.toLocaleString()}
            </div>
          </div>

          <div>
            <div className={cn(themeClass('textSecondary'), 'mb-1')}>Price per Share</div>
            <div className={cn(themeClass('textPrimary'), 'font-mono font-semibold')}>
              ${toFixed(trade.pricePerShare, 2)}
            </div>
          </div>

          <div>
            <div className={cn(themeClass('textSecondary'), 'mb-1')}>Total Value</div>
            <div className={cn(themeClass('textPrimary'), 'font-mono font-semibold text-lg')}>
              ${toFixed(totalValue, 2)}
            </div>
          </div>

          <div>
            <div className={cn(themeClass('textSecondary'), 'mb-1')}>Date</div>
            <div className={cn(themeClass('textPrimary'), 'font-medium')}>{formatDate(trade.date)}</div>
          </div>
        </div>

        {/* Profit/Loss if available */}
        {trade.netProfit !== undefined && (
          <div className='mt-4 pt-4 border-t border-gray-200 dark:border-slate-700'>
            <div className='flex items-center justify-between'>
              <span className={cn(themeClass('textSecondary'), 'text-sm')}>Net Profit/Loss</span>
              <span className={cn(getPriceChangeClass(trade.netProfit), 'font-mono font-bold text-lg')}>
                {trade.netProfit >= 0 ? '+' : ''}${toFixed(trade.netProfit, 2)}
              </span>
            </div>
          </div>
        )}

        {/* Fee info */}
        {trade.fee > 0 && (
          <div className='mt-2'>
            <span className={cn(themeClass('textMuted'), 'text-xs')}>Fee: ${toFixed(trade.fee, 2)}</span>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          <div className={cn(themeClass('card'), 'max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200')}>
            <h3 className={cn(themeClass('textPrimary'), 'text-lg font-semibold mb-2')}>Delete Trade</h3>
            <p className={cn(themeClass('textSecondary'), 'mb-6')}>
              Are you sure you want to delete this {trade.ticker} trade? This action cannot be undone.
            </p>

            <div className='flex gap-3'>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className={cn(themeClass('buttonSecondary'), 'flex-1 disabled:opacity-50')}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className='flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium rounded-xl px-4 py-2 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2'
              >
                {isDeleting ? (
                  <>
                    <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
