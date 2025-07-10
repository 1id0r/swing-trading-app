// Replace your /src/app/portfolio/page.tsx with this modified version
'use client'

import { useEffect, useState, useMemo } from 'react'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { useTradeStore } from '@/stores/useTradeStore'
import { useRealtimePrices } from '@/hooks/useRealtimePrices'
import { MarketHoursService, MarketStatus } from '@/lib/marketHours'
import { TrendingUp, TrendingDown, RefreshCw, Wifi, WifiOff, Clock, AlertCircle } from 'lucide-react'

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

export default function PortfolioPage() {
  const { positions, portfolioStats, fetchPositions, isLoadingPositions, error } = useTradeStore()
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null)
  // Removed selectedMarket state since we only have US market now
  const selectedMarket = 'US' // Fixed to US only

  // Get symbols from positions
  const symbols = useMemo(() => {
    return positions?.map((p: Position) => p.ticker) || []
  }, [positions])

  // Use real-time prices hook (only when market is open)
  const shouldUseRealtime = marketStatus?.isOpen || false
  const { prices, isConnected, isLoading: pricesLoading } = useRealtimePrices(shouldUseRealtime ? symbols : [])

  // Update market status - always US market now
  useEffect(() => {
    const updateMarketStatus = () => {
      const status = MarketHoursService.getCurrentMarketStatus('US') // Always US
      setMarketStatus(status)
      console.log('📊 Market status updated:', status)
    }

    updateMarketStatus()
    const interval = setInterval(updateMarketStatus, 60000) // Update every minute

    return () => clearInterval(interval)
  }, []) // Removed selectedMarket dependency

  // Removed handleMarketChange function since we don't need it

  useEffect(() => {
    // Load initial positions
    fetchPositions(true).then(() => {
      setLastUpdate(new Date())
    })
  }, [fetchPositions])

  // Update database periodically with WebSocket prices (only when market is open)
  useEffect(() => {
    if (!marketStatus?.isOpen) return

    const interval = setInterval(async () => {
      if (Object.keys(prices).length > 0) {
        console.log('💾 Syncing WebSocket prices to database...')
        await fetchPositions(true)
        setLastUpdate(new Date())
      }
    }, 300000) // 5 minutes

    return () => clearInterval(interval)
  }, [prices, fetchPositions, marketStatus?.isOpen])

  const handleRefreshPrices = async () => {
    if (isRefreshing) return

    try {
      setIsRefreshing(true)
      console.log('🔄 Manual refresh triggered')
      await fetchPositions(true)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error refreshing prices:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Calculate live portfolio stats
  const livePortfolioStats = useMemo(() => {
    if (!positions || positions.length === 0) {
      return {
        totalValue: 0,
        totalCost: 0,
        totalUnrealizedPnL: 0,
        totalPositions: 0,
      }
    }

    let totalValue = 0
    let totalCost = 0

    positions.forEach((position: Position) => {
      const livePrice = prices[position.ticker]
      const currentPrice = livePrice?.price || position.currentPrice || position.averagePrice

      totalCost += position.totalCost
      totalValue += position.totalShares * currentPrice
    })

    return {
      totalValue,
      totalCost,
      totalUnrealizedPnL: totalValue - totalCost,
      totalPositions: positions.length,
    }
  }, [positions, prices])

  // Safe calculations
  const safePositions = positions || []
  const safeStats = livePortfolioStats

  return (
    <MobileLayout title='Portfolio' subtitle={`${safePositions.length} active positions`}>
      <div className='space-y-6'>
        {/* Market Status */}
        {marketStatus && (
          <div className='flex items-center justify-center'>
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                marketStatus.isOpen ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}
            >
              <Clock className='w-3 h-3' />
              <span>{MarketHoursService.getMarketStatusMessage(marketStatus)}</span>
            </div>
          </div>
        )}

        {/* Connection Status */}
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
                  <span className='text-yellow-500'>Connecting...</span>
                </>
              )
            ) : (
              <>
                <AlertCircle className='w-3 h-3 text-gray-500' />
                <span className='text-gray-500'>Market Closed</span>
              </>
            )}
          </div>
          <div className='flex items-center gap-2'>
            {lastUpdate && <span>DB Sync: {lastUpdate.toLocaleTimeString()}</span>}
            <button
              onClick={handleRefreshPrices}
              className='p-1 rounded text-xs bg-blue-500/20 hover:bg-blue-500/40 transition-colors'
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className='bg-red-500/20 border border-red-500 rounded-lg p-3'>
            <p className='text-red-400 text-sm'>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoadingPositions && (
          <div className='theme-card p-8'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2'></div>
              <p className='theme-text-secondary'>Loading portfolio...</p>
            </div>
          </div>
        )}

        {/* Market Closed Info */}
        {!marketStatus?.isOpen && !isLoadingPositions && (
          <div className='bg-blue-500/20 border border-blue-500 rounded-lg p-4'>
            <div className='flex items-center gap-3'>
              <Clock className='w-5 h-5 text-blue-400' />
              <div>
                <p className='text-blue-400 font-medium'>Market is currently closed</p>
                <p className='text-blue-300 text-sm'>
                  Showing last known prices. Live updates will resume when market opens.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Summary */}
        {!isLoadingPositions && (
          <div className='theme-card p-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold theme-text-primary'>Portfolio Summary</h3>
              <div className='flex items-center gap-2'>
                {marketStatus?.isOpen && isConnected && (
                  <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                )}
                <button
                  onClick={handleRefreshPrices}
                  className='p-2 theme-text-secondary hover:theme-text-primary transition-colors'
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold theme-text-primary'>${safeStats.totalValue.toFixed(2)}</div>
                <div className='text-sm theme-text-secondary'>Current Value</div>
              </div>
              <div className='text-center'>
                <div
                  className={`text-2xl font-bold ${
                    safeStats.totalUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {safeStats.totalUnrealizedPnL >= 0 ? '+' : ''}${safeStats.totalUnrealizedPnL.toFixed(2)}
                </div>
                <div className='text-sm theme-text-secondary'>Unrealized P&L</div>
              </div>
            </div>

            <div className='mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 gap-4 text-sm'>
              <div>
                <div className='theme-text-secondary'>Total Invested</div>
                <div className='theme-text-primary font-medium'>${safeStats.totalCost.toFixed(2)}</div>
              </div>
              <div>
                <div className='theme-text-secondary'>Return %</div>
                <div className={`font-medium ${safeStats.totalUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {safeStats.totalCost > 0
                    ? `${((safeStats.totalUnrealizedPnL / safeStats.totalCost) * 100).toFixed(2)}%`
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
              <div className='theme-text-secondary mb-2'>No active positions</div>
              <div className='text-sm theme-text-secondary'>Add some trades to see your portfolio</div>
            </div>
          ) : (
            safePositions.map((position: Position) => {
              // Get live price or fallback to stored price
              const livePrice = prices[position.ticker]
              const currentPrice = livePrice?.price || position.currentPrice || position.averagePrice
              const isLive = !!livePrice?.isLive && marketStatus?.isOpen

              // Calculate live P&L
              const currentValue = position.totalShares * currentPrice
              const unrealizedPnL = currentValue - position.totalCost
              const unrealizedPnLPercent = position.totalCost > 0 ? (unrealizedPnL / position.totalCost) * 100 : 0

              return (
                <div key={position.id} className='theme-card p-4'>
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
                          {isLive && <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>}
                        </div>
                        <div className='text-sm theme-text-secondary truncate'>{position.company}</div>
                      </div>
                    </div>

                    <div className='text-right'>
                      <div
                        className={`flex items-center gap-1 ${unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}
                      >
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
                      <div className={`font-medium ${isLive ? 'text-green-400' : 'theme-text-primary'}`}>
                        ${currentPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className='mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs theme-text-secondary'>
                    <span>Cost: ${position.totalCost.toFixed(2)}</span>
                    <span>Value: ${currentValue.toFixed(2)}</span>
                  </div>

                  {/* Show different status based on market hours */}
                  {marketStatus?.isOpen && livePrice ? (
                    <div className='mt-1 text-xs text-green-400 text-center'>
                      Live • {new Date(livePrice.timestamp).toLocaleTimeString()}
                    </div>
                  ) : (
                    <div className='mt-1 text-xs theme-text-secondary text-center'>
                      Last:{' '}
                      {position.lastPriceUpdate
                        ? new Date(position.lastPriceUpdate).toLocaleTimeString()
                        : 'Not updated'}
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
