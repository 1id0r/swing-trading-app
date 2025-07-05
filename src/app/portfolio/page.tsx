// app/portfolio/page.tsx (Fixed with Null Checks)
'use client'

import { useEffect } from 'react'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { useTradeStore } from '@/stores/useTradeStore'
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'

export default function PortfolioPage() {
  const { positions, portfolioStats, fetchPositions, updatePositionPrices, isLoadingPositions, error } = useTradeStore()

  useEffect(() => {
    // Load positions when component mounts
    fetchPositions(true) // Update prices on initial load
  }, [fetchPositions])

  const handleRefreshPrices = async () => {
    try {
      await updatePositionPrices()
    } catch (error) {
      console.error('Error refreshing prices:', error)
    }
  }

  // Safe calculations with null checks
  const safePositions = positions || []
  const safeStats = portfolioStats || {
    totalValue: 0,
    totalCost: 0,
    totalUnrealizedPnL: 0,
    totalPositions: 0,
  }

  return (
    <MobileLayout title='Portfolio' subtitle={`${safePositions.length} active positions`}>
      <div className='space-y-6'>
        {/* Error Message */}
        {error && (
          <div className='bg-red-500/20 border border-red-500 rounded-lg p-3'>
            <p className='text-red-400 text-sm'>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoadingPositions && (
          <div className='bg-gray-800/50 rounded-xl p-8 border border-gray-700'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2'></div>
              <p className='text-gray-400'>Loading portfolio...</p>
            </div>
          </div>
        )}

        {/* Portfolio Summary */}
        {!isLoadingPositions && (
          <div className='bg-gray-800/50 rounded-xl p-4 border border-gray-700'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-white'>Portfolio Summary</h3>
              <button
                onClick={handleRefreshPrices}
                className='p-2 text-gray-400 hover:text-white transition-colors'
                disabled={isLoadingPositions}
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingPositions ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-white'>${(safeStats.totalValue || 0).toFixed(2)}</div>
                <div className='text-sm text-gray-400'>Current Value</div>
              </div>
              <div className='text-center'>
                <div
                  className={`text-2xl font-bold ${
                    (safeStats.totalUnrealizedPnL || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {(safeStats.totalUnrealizedPnL || 0) >= 0 ? '+' : ''}${(safeStats.totalUnrealizedPnL || 0).toFixed(2)}
                </div>
                <div className='text-sm text-gray-400'>Unrealized P&L</div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className='mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 gap-4 text-sm'>
              <div>
                <div className='text-gray-400'>Total Invested</div>
                <div className='text-white font-medium'>${(safeStats.totalCost || 0).toFixed(2)}</div>
              </div>
              <div>
                <div className='text-gray-400'>Return %</div>
                <div
                  className={`font-medium ${
                    (safeStats.totalUnrealizedPnL || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {safeStats.totalCost > 0
                    ? `${(((safeStats.totalUnrealizedPnL || 0) / safeStats.totalCost) * 100).toFixed(2)}%`
                    : '0.00%'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Positions List */}
        <div className='space-y-3'>
          {safePositions.length === 0 && !isLoadingPositions ? (
            <div className='text-center py-12'>
              <div className='text-gray-400 mb-2'>No active positions</div>
              <div className='text-sm text-gray-500'>Add some trades to see your portfolio</div>
            </div>
          ) : (
            safePositions.map((position) => {
              // Safe calculations for each position
              const currentPrice = position.currentPrice || 0
              const unrealizedPnL = position.unrealizedPnL || 0
              const unrealizedPnLPercent = position.unrealizedPnLPercent || 0
              const totalShares = position.totalShares || 0
              const averagePrice = position.averagePrice || 0
              const currentValue = totalShares * currentPrice

              return (
                <div key={position.id} className='bg-gray-800/50 rounded-xl p-4 border border-gray-700'>
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm'>
                        {position.logo ? (
                          <img
                            src={position.logo}
                            alt={position.ticker}
                            className='w-8 h-8 rounded-full object-cover'
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement
                              target.style.display = 'none'
                              const sibling = target.nextElementSibling as HTMLSpanElement
                              if (sibling) {
                                sibling.style.display = 'flex'
                              }
                            }}
                          />
                        ) : null}
                        <span
                          className={`text-white font-bold text-sm ${position.logo ? 'hidden' : 'flex'}`}
                          style={{ display: position.logo ? 'none' : 'flex' }}
                        >
                          {position.ticker.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className='text-white font-medium'>{position.ticker}</div>
                        <div className='text-sm text-gray-400 truncate'>{position.company}</div>
                      </div>
                    </div>

                    <div className='text-right'>
                      <div
                        className={`flex items-center gap-1 ${unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {unrealizedPnL >= 0 ? <TrendingUp className='w-4 h-4' /> : <TrendingDown className='w-4 h-4' />}
                        <span className='font-medium'>
                          {unrealizedPnL >= 0 ? '+' : ''}${unrealizedPnL.toFixed(2)}
                        </span>
                      </div>
                      <div className={`text-xs ${unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {unrealizedPnL >= 0 ? '+' : ''}
                        {unrealizedPnLPercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <div className='grid grid-cols-3 gap-4 text-sm'>
                    <div>
                      <div className='text-gray-400'>Shares</div>
                      <div className='text-white font-medium'>{totalShares.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className='text-gray-400'>Avg Price</div>
                      <div className='text-white font-medium'>${averagePrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className='text-gray-400'>Current</div>
                      <div className='text-white font-medium'>
                        {currentPrice > 0 ? `$${currentPrice.toFixed(2)}` : '--'}
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className='mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs text-gray-400'>
                    <span>Cost: ${position.totalCost.toFixed(2)}</span>
                    <span>Value: ${currentValue > 0 ? currentValue.toFixed(2) : position.totalCost.toFixed(2)}</span>
                  </div>

                  {/* Price Update Time */}
                  {position.lastPriceUpdate && (
                    <div className='mt-1 text-xs text-gray-500 text-center'>
                      Updated: {new Date(position.lastPriceUpdate).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </MobileLayout>
  )
}
