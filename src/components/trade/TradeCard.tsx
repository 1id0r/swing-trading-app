// components/trade/TradeCard.tsx
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react'

interface Trade {
  id: string
  ticker: string
  company: string
  action: 'BUY' | 'SELL'
  shares: number
  price: number
  date: string
  profit?: number
  fee: number
}

interface TradeCardProps {
  trade: Trade
  onEdit?: (trade: Trade) => void
  onDelete?: (tradeId: string) => void
}

export function TradeCard({ trade, onEdit, onDelete }: TradeCardProps) {
  const totalValue = trade.shares * trade.price

  return (
    <div className='theme-card   p-4    hover:bg-gray-800/70 transition-colors'>
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center theme-text-primary   font-bold text-sm'>
            {trade.ticker.charAt(0)}
          </div>
          <div>
            <div className='theme-text-primary   font-medium'>{trade.ticker}</div>
            <div className='text-sm theme-text-secondary  '>{trade.company}</div>
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
            <button className='theme-text-secondary   hover:theme-text-primary   p-1'>
              <MoreHorizontal className='w-4 h-4' />
            </button>
          )}
        </div>
      </div>

      <div className='grid grid-cols-3 gap-4 text-sm'>
        <div>
          <div className='theme-text-secondary  '>Shares</div>
          <div className='theme-text-primary   font-medium'>{trade.shares.toLocaleString()}</div>
        </div>
        <div>
          <div className='theme-text-secondary  '>Price</div>
          <div className='theme-text-primary   font-medium'>${trade.price.toFixed(2)}</div>
        </div>
        <div>
          <div className='theme-text-secondary  '>P&L</div>
          <div
            className={`font-medium ${
              trade.profit !== undefined
                ? trade.profit > 0
                  ? 'text-green-400'
                  : 'text-red-400'
                : 'theme-text-secondary  '
            }`}
          >
            {trade.profit !== undefined ? `$${trade.profit.toFixed(2)}` : 'Open'}
          </div>
        </div>
      </div>

      <div className='mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs theme-text-secondary  '>
        <span>{new Date(trade.date).toLocaleDateString()}</span>
        <span>Total: ${totalValue.toFixed(2)}</span>
      </div>
    </div>
  )
}
