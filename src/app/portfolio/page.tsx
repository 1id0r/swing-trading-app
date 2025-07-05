'use client'

import { MobileLayout } from '@/components/layout/MobileLayout'
import { useTradeStore } from '@/stores/useTradeStore'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

export default function PortfolioPage() {
  const { positions } = useTradeStore()

  const totalValue = positions.reduce(
    (sum, pos) => sum + (pos.currentPrice ? pos.totalShares * pos.currentPrice : pos.totalCost),
    0
  )

  const totalCost = positions.reduce((sum, pos) => sum + pos.totalCost, 0)
  const totalUnrealizedPnL = positions.reduce((sum, pos) => sum + (pos.unrealizedPnL || 0), 0)

  return (
    <MobileLayout title='Portfolio' subtitle={`${positions.length} active positions`}>
      <div className='space-y-6'>
        {/* Portfolio Summary */}
        <div className='bg-gray-800/50 rounded-xl p-4 border border-gray-700'>
          <h3 className='text-lg font-semibold text-white mb-4'>Portfolio Summary</h3>

          <div className='grid grid-cols-2 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-white'>${totalValue.toFixed(2)}</div>
              <div className='text-sm text-gray-400'>Current Value</div>
            </div>
            <div className='text-center'>
              <div className={`text-2xl font-bold ${totalUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toFixed(2)}
              </div>
              <div className='text-sm text-gray-400'>Unrealized P&L</div>
            </div>
          </div>
        </div>

        {/* Positions */}
        <div className='space-y-3'>
          {positions.length === 0 ? (
            <div className='text-center py-12'>
              <div className='text-gray-400 mb-2'>No active positions</div>
              <div className='text-sm text-gray-500'>Add some trades to see your portfolio</div>
            </div>
          ) : (
            positions.map((position) => (
              <div key={position.ticker} className='bg-gray-800/50 rounded-xl p-4 border border-gray-700'>
                <div className='flex items-center justify-between mb-3'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm'>
                      {position.ticker.charAt(0)}
                    </div>
                    <div>
                      <div className='text-white font-medium'>{position.ticker}</div>
                      <div className='text-sm text-gray-400'>{position.company}</div>
                    </div>
                  </div>

                  <div className='text-right'>
                    {position.unrealizedPnL !== undefined && (
                      <div
                        className={`flex items-center gap-1 ${
                          position.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {position.unrealizedPnL >= 0 ? (
                          <TrendingUp className='w-4 h-4' />
                        ) : (
                          <TrendingDown className='w-4 h-4' />
                        )}
                        <span className='font-medium'>
                          {position.unrealizedPnL >= 0 ? '+' : ''}${position.unrealizedPnL.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className='grid grid-cols-3 gap-4 text-sm'>
                  <div>
                    <div className='text-gray-400'>Shares</div>
                    <div className='text-white font-medium'>{position.totalShares.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className='text-gray-400'>Avg Price</div>
                    <div className='text-white font-medium'>${position.averagePrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className='text-gray-400'>Current</div>
                    <div className='text-white font-medium'>${position.currentPrice?.toFixed(2) || '--'}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </MobileLayout>
  )
}
