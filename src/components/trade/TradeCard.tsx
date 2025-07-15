// components/trade/TradeCard.tsx - Updated with delete functionality
'use client'
import { toFixed } from '@/lib/format'
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface Trade {
  id: string
  ticker: string
  company: string
  action: 'BUY' | 'SELL'
  shares: number
  pricePerShare: number // Changed from 'price' to 'pricePerShare'
  date: string
  netProfit?: number // Changed from 'profit' to 'netProfit'
  fee: number
  totalValue?: number // Added totalValue field
  totalCost?: number // Added totalCost field
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
      // You could add a toast notification here
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
      <div className='theme-card p-4 hover:bg-gray-800/70 transition-colors relative'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center theme-text-primary font-bold text-sm'>
              {trade.ticker.charAt(0)}
            </div>
            <div>
              <div className='theme-text-primary font-medium'>{trade.ticker}</div>
              <div className='text-sm theme-text-secondary'>{trade.company}</div>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <div
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                trade.action === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {trade.action === 'BUY' ? <ArrowUpRight className='w-3 h-3' /> : <ArrowDownRight className='w-3 h-3' />}
              {trade.action}
            </div>

            {(onEdit || onDelete) && (
              <div className='relative'>
                <button
                  onClick={() => setShowActions(!showActions)}
                  className='theme-text-secondary hover:theme-text-primary p-1 rounded-lg hover:bg-gray-700/50'
                >
                  <MoreHorizontal className='w-4 h-4' />
                </button>

                {/* Actions Dropdown */}
                {showActions && (
                  <div className='absolute right-0 top-8 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 min-w-[120px]'>
                    {onEdit && (
                      <button
                        onClick={() => {
                          onEdit(trade)
                          setShowActions(false)
                        }}
                        className='w-full px-3 py-2 text-left text-sm theme-text-secondary hover:theme-text-primary hover:bg-gray-700/50 flex items-center gap-2'
                      >
                        <Edit className='w-3 h-3' />
                        Edit Trade
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(true)
                          setShowActions(false)
                        }}
                        className='w-full px-3 py-2 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2'
                      >
                        <Trash2 className='w-3 h-3' />
                        Delete Trade
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className='grid grid-cols-4 gap-3 text-sm'>
          <div>
            <div className='theme-text-secondary'>Shares</div>
            <div className='theme-text-primary font-medium'>${toFixed(trade.shares)}</div>
          </div>
          <div>
            <div className='theme-text-secondary'>Price</div>
            <div className='theme-text-primary font-medium'>${toFixed(trade.pricePerShare)}</div>
          </div>
          <div>
            <div className='theme-text-secondary'>Total</div>
            <div className='theme-text-primary font-medium'>{Number(totalValue ?? 0).toFixed(2)}</div>
          </div>
          <div>
            <div className='theme-text-secondary'>P&L</div>
            <div
              className={`font-medium ${
                trade.netProfit !== undefined && trade.netProfit !== null
                  ? trade.netProfit > 0
                    ? 'text-green-400'
                    : trade.netProfit < 0
                    ? 'text-red-400'
                    : 'theme-text-secondary'
                  : 'theme-text-secondary'
              }`}
            >
              {trade.netProfit !== undefined && trade.netProfit !== null
                ? `${trade.netProfit > 0 ? '+' : ''}$${trade.netProfit.toFixed(2)}`
                : 'N/A'}
            </div>
          </div>
        </div>

        <div className='mt-3 pt-2 border-t border-gray-700'>
          <div className='text-xs theme-text-secondary'>
            {formatDate(trade.date)} • Fee: ${toFixed(trade.fee)}
          </div>
        </div>

        {/* Click outside to close actions */}
        {showActions && <div className='fixed inset-0 z-0' onClick={() => setShowActions(false)} />}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          <div className='bg-gray-800 border border-gray-600 rounded-xl p-6 max-w-sm w-full'>
            <div className='text-center'>
              <div className='w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Trash2 className='w-6 h-6 text-red-400' />
              </div>

              <h3 className='text-lg font-semibold theme-text-primary mb-2'>Delete Trade</h3>

              <p className='theme-text-secondary text-sm mb-6'>
                Are you sure you want to delete this {trade.action.toLowerCase()} trade for {trade.ticker}? This action
                cannot be undone and will affect your portfolio calculations.
              </p>

              <div className='flex gap-3'>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className='flex-1 px-4 py-2 text-sm font-medium theme-text-secondary border border-gray-600 rounded-lg hover:bg-gray-700/50 transition-colors'
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className='flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
