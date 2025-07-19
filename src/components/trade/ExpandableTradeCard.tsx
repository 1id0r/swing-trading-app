// components/trade/ExpandableTradeCard.tsx - Compact with expand option
'use client'
import { toFixed } from '@/lib/format'
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

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

interface ExpandableTradeCardProps {
  trade: Trade
  onEdit?: (trade: Trade) => void
  onDelete?: (tradeId: string) => void
  defaultExpanded?: boolean
}

export function ExpandableTradeCard({ trade, onEdit, onDelete, defaultExpanded = false }: ExpandableTradeCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [showActions, setShowActions] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
    return {
      short: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      full: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
  }

  const dateFormatted = formatDate(trade.date)

  return (
    <>
      <div className='theme-card hover:bg-gray-800/50 transition-all duration-200 relative overflow-hidden'>
        {/* Compact Header - Always Visible */}
        <div className='p-3 flex items-center justify-between gap-3'>
          {/* Left: Stock Info + Action */}
          <div className='flex items-center gap-3 min-w-0 flex-1'>
            {/* Avatar */}
            <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0'>
              {trade.ticker.charAt(0)}
            </div>

            {/* Stock Details */}
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-2 mb-1'>
                <span className='theme-text-primary font-semibold text-sm'>{trade.ticker}</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    trade.action === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {trade.action === 'BUY' ? (
                    <ArrowUpRight className='w-2.5 h-2.5' />
                  ) : (
                    <ArrowDownRight className='w-2.5 h-2.5' />
                  )}
                  {trade.action}
                </span>
              </div>
              <div className='theme-text-secondary text-xs truncate'>
                {isExpanded ? trade.company : `${toFixed(trade.shares, 2)} shares @ ${toFixed(trade.pricePerShare, 2)}`}
              </div>
            </div>
          </div>

          {/* Right: Value + Date + Actions */}
          <div className='flex items-center gap-2 flex-shrink-0'>
            {/* Value & Date */}
            <div className='text-right'>
              <div className='theme-text-primary font-semibold text-sm'>${toFixed(totalValue, 2)}</div>
              <div className='theme-text-secondary text-xs'>
                {isExpanded ? dateFormatted.full : dateFormatted.short}
              </div>
            </div>

            {/* Expand/Collapse Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className='p-1.5 hover:bg-gray-700 rounded-lg transition-colors'
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronUp className='w-4 h-4 theme-text-secondary' />
              ) : (
                <ChevronDown className='w-4 h-4 theme-text-secondary' />
              )}
            </button>

            {/* Actions */}
            <div className='relative'>
              <button
                onClick={() => setShowActions(!showActions)}
                className='p-1.5 hover:bg-gray-700 rounded-lg transition-colors'
              >
                <MoreHorizontal className='w-3.5 h-3.5 theme-text-secondary' />
              </button>

              {/* Actions Dropdown */}
              {showActions && (
                <div className='absolute right-0 top-full mt-1 w-28 theme-card py-1 z-10 shadow-xl border border-gray-700'>
                  <button
                    onClick={() => {
                      onEdit?.(trade)
                      setShowActions(false)
                    }}
                    className='w-full flex items-center gap-2 px-3 py-1.5 text-xs theme-text-primary hover:bg-gray-700 transition-colors'
                  >
                    <Edit className='w-3 h-3' />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true)
                      setShowActions(false)
                    }}
                    className='w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/20 transition-colors'
                  >
                    <Trash2 className='w-3 h-3' />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Details - Animated */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          } overflow-hidden`}
        >
          <div className='px-3 pb-3'>
            {/* Divider */}
            <div className='border-t border-gray-700 mb-3'></div>

            {/* Full Company Name */}
            <div className='mb-3'>
              <div className='theme-text-secondary text-xs mb-1'>Company</div>
              <div className='theme-text-primary text-sm'>{trade.company}</div>
            </div>

            {/* Detailed Trade Info - Grid Layout */}
            <div className='grid grid-cols-2 gap-4 mb-3'>
              <div>
                <div className='theme-text-secondary text-xs mb-1'>Shares</div>
                <div className='theme-text-primary font-mono font-semibold text-sm'>{toFixed(trade.shares, 2)}</div>
              </div>

              <div>
                <div className='theme-text-secondary text-xs mb-1'>Price per Share</div>
                <div className='theme-text-primary font-mono font-semibold text-sm'>
                  ${toFixed(trade.pricePerShare, 2)}
                </div>
              </div>

              <div>
                <div className='theme-text-secondary text-xs mb-1'>Total Value</div>
                <div className='theme-text-primary font-mono font-semibold text-base'>${toFixed(totalValue, 2)}</div>
              </div>

              <div>
                <div className='theme-text-secondary text-xs mb-1'>Trade Date</div>
                <div className='theme-text-primary font-medium text-sm'>{dateFormatted.full}</div>
              </div>
            </div>

            {/* Profit/Loss - Full Width */}
            {trade.netProfit !== undefined && (
              <div className='mb-3 p-2 bg-gray-800/30 rounded-lg'>
                <div className='flex items-center justify-between'>
                  <span className='theme-text-secondary text-xs'>Net Profit/Loss</span>
                  <span
                    className={`font-mono font-bold text-base ${
                      trade.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {trade.netProfit >= 0 ? '+' : ''}${toFixed(trade.netProfit, 2)}
                  </span>
                </div>
              </div>
            )}

            {/* Fee Info */}
            {trade.fee > 0 && <div className='text-xs theme-text-secondary'>Trading Fee: ${toFixed(trade.fee, 2)}</div>}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          <div className='theme-card max-w-sm w-full p-4 animate-in fade-in zoom-in-95 duration-200'>
            <h3 className='theme-text-primary text-base font-semibold mb-2'>Delete Trade</h3>
            <p className='theme-text-secondary text-sm mb-4'>
              Delete this {trade.ticker} trade? This cannot be undone.
            </p>

            <div className='flex gap-2'>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className='flex-1 theme-button-secondary text-sm py-2 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className='flex-1 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg px-3 py-2 text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1'
              >
                {isDeleting ? (
                  <>
                    <div className='w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin' />
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
