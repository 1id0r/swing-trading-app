// components/portfolio/ConnectionStatus.tsx
import { Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react'

interface ConnectionStatusProps {
  marketStatus: any
  isConnected: boolean
  marketLastUpdate: number
  isRefreshing: boolean
  onRefresh: () => void
}

export function ConnectionStatus({
  marketStatus,
  isConnected,
  marketLastUpdate,
  isRefreshing,
  onRefresh,
}: ConnectionStatusProps) {
  return (
    <div className='flex items-center justify-between text-xs theme-text-secondary'>
      <div className='flex items-center gap-2'>
        {marketStatus?.isOpen ? (
          isConnected ? (
            <>
              <Wifi className='w-3 h-3 text-green-500' />
              <span className='text-green-500'>Live Data</span>
            </>
          ) : (
            <>
              <WifiOff className='w-3 h-3 text-yellow-500' />
              <span className='text-yellow-500'>API Only</span>
            </>
          )
        ) : (
          <>
            <AlertCircle className='w-3 h-3 text-gray-500' />
            <span className='text-gray-500'>Market Closed - Last Prices</span>
          </>
        )}
      </div>
      <div className='flex items-center gap-2'>
        {marketLastUpdate > 0 && (
          <span>
            Last: {new Date(marketLastUpdate).toLocaleTimeString()}
            {!marketStatus?.isOpen && ' (Close)'}
          </span>
        )}
        <button
          onClick={onRefresh}
          className='p-1 rounded text-xs bg-blue-500/20 hover:bg-blue-500/40 transition-colors'
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  )
}
