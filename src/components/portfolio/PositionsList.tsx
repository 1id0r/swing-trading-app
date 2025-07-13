// components/portfolio/PositionsList.tsx
import { TrendingUp, TrendingDown } from 'lucide-react'

interface Position {
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

interface PositionsListProps {
  positions: Position[]
  isLoading: boolean
  getBestPriceData: (symbol: string) => any
  marketStatus: any
  onPositionClick: (position: Position) => void
}

export function PositionsList({
  positions,
  isLoading,
  getBestPriceData,
  marketStatus,
  onPositionClick,
}: PositionsListProps) {
  if (positions.length === 0 && !isLoading) {
    return (
      <div className='text-center py-12'>
        <div className='theme-text-secondary mb-2'>No active positions</div>
        <div className='text-sm theme-text-secondary'>Add some trades to see your portfolio</div>
      </div>
    )
  }

  return (
    <div className='space-y-3'>
      {positions.map((position: Position) => {
        const bestPrice = getBestPriceData(position.ticker)
        const currentPrice = bestPrice.price || position.currentPrice || position.averagePrice
        const isLiveData = bestPrice.isLive

        // Calculate live P&L
        const currentValue = position.totalShares * currentPrice
        const unrealizedPnL = currentValue - position.totalCost
        const unrealizedPnLPercent = position.totalCost > 0 ? (unrealizedPnL / position.totalCost) * 100 : 0

        return (
          <div
            key={position.id}
            className='theme-card p-4 cursor-pointer hover:bg-gray-800/70 transition-colors'
            onClick={() => onPositionClick(position)}
          >
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
                    {isLiveData && marketStatus?.isOpen && (
                      <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                    )}
                    {!isLiveData && !marketStatus?.isOpen && <div className='w-2 h-2 bg-gray-500 rounded-full'></div>}
                    {!isLiveData && marketStatus?.isOpen && bestPrice.dataAge === 'fallback' && (
                      <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                    )}
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
                <div
                  className={`font-medium ${
                    isLiveData && marketStatus?.isOpen
                      ? 'text-green-400'
                      : bestPrice.showAsStale
                      ? 'text-gray-400'
                      : 'theme-text-primary'
                  }`}
                >
                  ${currentPrice.toFixed(2)}
                </div>
              </div>
            </div>

            <div className='mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs theme-text-secondary'>
              <span>Cost: ${position.totalCost.toFixed(2)}</span>
              <span>Value: ${currentValue.toFixed(2)}</span>
            </div>

            {/* Show status based on data source */}
            <div className='mt-1 text-xs text-center'>
              <span
                className={`${
                  bestPrice.isLive ? 'text-green-400' : bestPrice.showAsStale ? 'text-gray-400' : 'text-blue-400'
                }`}
              >
                {bestPrice.ageLabel}
                {bestPrice.timestamp > 0 && ` • ${new Date(bestPrice.timestamp).toLocaleTimeString()}`}
                {!marketStatus?.isOpen && ' (Market Closed)'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
