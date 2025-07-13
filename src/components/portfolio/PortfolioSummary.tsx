// components/portfolio/PortfolioSummary.tsx
import { RefreshCw } from 'lucide-react'

interface PortfolioSummaryProps {
  isLoading: boolean
  stats: {
    totalValue: number
    totalCost: number
    totalUnrealizedPnL: number
    totalPositions: number
  }
  marketStatus: any
  isConnected: boolean
  isRefreshing: boolean
  onRefresh: () => void
}

export function PortfolioSummary({
  isLoading,
  stats,
  marketStatus,
  isConnected,
  isRefreshing,
  onRefresh,
}: PortfolioSummaryProps) {
  if (isLoading) {
    return (
      <div className='theme-card p-8'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2'></div>
          <p className='theme-text-secondary'>Loading portfolio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='theme-card p-4'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold theme-text-primary'>Portfolio Summary</h3>
        <div className='flex items-center gap-2'>
          {marketStatus?.isOpen && isConnected && (
            <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
          )}
          {!marketStatus?.isOpen && <div className='w-2 h-2 bg-gray-500 rounded-full'></div>}
          <button
            onClick={onRefresh}
            className='p-2 theme-text-secondary hover:theme-text-primary transition-colors'
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='text-center'>
          <div className='text-2xl font-bold theme-text-primary'>${stats.totalValue.toFixed(2)}</div>
          <div className='text-sm theme-text-secondary'>Current Value</div>
        </div>
        <div className='text-center'>
          <div className={`text-2xl font-bold ${stats.totalUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.totalUnrealizedPnL >= 0 ? '+' : ''}${stats.totalUnrealizedPnL.toFixed(2)}
          </div>
          <div className='text-sm theme-text-secondary'>Unrealized P&L</div>
        </div>
      </div>
    </div>
  )
}
