// Enhanced Portfolio Page with Market Hours - No API calls when market closed
'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { useTradeStore } from '@/stores/useTradeStore'
import { useWatchlistStore } from '@/stores/useWatchlistStore'
import { useRealtimePrices } from '@/hooks/useRealtimePrices'
import { useMarketAwareData } from '@/hooks/useMarketAwareData'
import { MarketHoursService, MarketStatus } from '@/lib/marketHours'
import { StockSearch } from '@/components/watchlist/StockSearch'
import { marketAwareApi } from '@/lib/marketAwareApi'
import { useAuth } from '@/app/contexts/AuthContext'

import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  FolderPlus,
  Edit,
  Trash2,
  Move,
  Eye,
  BarChart3,
  Loader2,
} from 'lucide-react'
import { toFixed } from '@/lib/format'

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
  const router = useRouter()
  const { positions, portfolioStats, fetchPositions, isLoadingPositions, error } = useTradeStore()
  const {
    folders,
    addFolder,
    deleteFolder,
    renameFolder,
    toggleFolder,
    addItemToFolder,
    removeItemFromFolder,
    moveItemBetweenFolders,
    getAllSymbols,
  } = useWatchlistStore()

  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'portfolio' | 'watchlist'>('portfolio')
  const [draggedItem, setDraggedItem] = useState<{ item: any; fromFolderId: string } | null>(null)
  const [showAddFolder, setShowAddFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingFolder, setEditingFolder] = useState<string | null>(null)
  const [directPrices, setDirectPrices] = useState<Record<string, any>>({})
  const [loadingDirectPrices, setLoadingDirectPrices] = useState(false)
  const { user } = useAuth()

  // State for fallback data (only used when market is open)
  const [fallbackData, setFallbackData] = useState<Record<string, any>>({})
  const [dataLoadingStates, setDataLoadingStates] = useState<Record<string, 'loading' | 'live' | 'fallback' | 'error'>>(
    {}
  )

  // Get symbols from positions and watchlist
  const symbols = useMemo(() => {
    const positionSymbols = positions?.map((p: Position) => p.ticker) || []
    const watchlistSymbols = getAllSymbols()
    return [...new Set([...positionSymbols, ...watchlistSymbols])]
  }, [positions, getAllSymbols])

  // Market-aware data hook (respects market hours)
  const {
    data: marketData,
    lastMarketPrices,
    lastUpdate: marketLastUpdate,
    isLive,
    isLoading: pricesLoading,
    marketStatus,
    refresh,
  } = useMarketAwareData(symbols)

  // WebSocket prices (only when market is open)
  const { prices, isConnected } = useRealtimePrices(marketStatus?.isOpen ? symbols : [])

  // Initialize loading states
  useEffect(() => {
    const newStates: Record<string, 'loading' | 'live' | 'fallback' | 'error'> = {}
    symbols.forEach((symbol) => {
      newStates[symbol] = 'loading'
    })
    setDataLoadingStates(newStates)
  }, [symbols])

  const testMarketAwareApi = async () => {
    console.log('🧪 Testing marketAwareApi directly...')
    try {
      const testSymbols = ['MSFT', 'NVDA', 'AAPL']
      const result = await marketAwareApi.getBatchQuotes(testSymbols)
      console.log('🧪 Direct API test result:', result)
    } catch (error) {
      console.error('🧪 Direct API test failed:', error)
    }
  }
  const safeToFixed = (value: number | null | undefined, decimals: number = 2): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.00'
    }
    return Number(value).toFixed(decimals)
  }
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lastMarketPrices')
      if (stored) {
        const parsed = JSON.parse(stored)
        console.log('💾 localStorage lastMarketPrices:', parsed)
      } else {
        console.log('💾 No lastMarketPrices in localStorage')
      }
    } catch (error) {
      console.log('💾 Error reading localStorage:', error)
    }
  }, [])

  useEffect(() => {
    console.log('🔍 Portfolio page - useMarketAwareData returned:', {
      marketDataKeys: Object.keys(marketData),
      lastMarketPricesKeys: Object.keys(lastMarketPrices || {}),
      lastMarketPricesData: lastMarketPrices,
      isLive,
      marketStatus: marketStatus?.isOpen,
      symbols,
    })
  }, [marketData, lastMarketPrices, isLive, marketStatus, symbols])

  useEffect(() => {
    const fetchDirectPrices = async () => {
      if (symbols.length === 0) return

      setLoadingDirectPrices(true)
      try {
        console.log('🔄 Fetching direct prices for:', symbols)

        const response = await fetch('/api/stocks/batch-quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols }),
        })

        if (response.ok) {
          const data = await response.json()
          setDirectPrices(data.quotes)
          console.log('✅ Direct prices fetched:', data.quotes)
        }
      } catch (error) {
        console.error('❌ Failed to fetch direct prices:', error)
      } finally {
        setLoadingDirectPrices(false)
      }
    }

    fetchDirectPrices()

    // Refresh every 30 seconds if market is open
    if (marketStatus?.isOpen) {
      const interval = setInterval(fetchDirectPrices, 30000)
      return () => clearInterval(interval)
    }
  }, [symbols, marketStatus?.isOpen])

  // Fetch fallback data for symbols (only when market is open)
  const fetchFallbackData = async (symbolsToFetch: string[]) => {
    if (symbolsToFetch.length === 0) return

    // Don't fetch if market is closed
    if (!marketStatus?.isOpen) {
      console.log('🔒 Market closed - skipping fallback data fetch')
      return
    }

    try {
      console.log('📊 Fetching fallback data for:', symbolsToFetch)

      const response = await fetch('/api/stocks/batch-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: symbolsToFetch }),
      })

      if (response.ok) {
        const data = await response.json()
        const newFallbackData = { ...fallbackData }
        const newStates = { ...dataLoadingStates }

        symbolsToFetch.forEach((symbol) => {
          const quote = data.quotes[symbol]
          if (quote && quote.c > 0) {
            newFallbackData[symbol] = {
              price: quote.c,
              change: quote.d || 0,
              changePercent: quote.dp || 0,
              previousClose: quote.pc || 0,
              timestamp: Date.now(),
            }

            // Only set to fallback if we don't have live data
            if (!prices[symbol] || !prices[symbol].isLive) {
              newStates[symbol] = 'fallback'
            }

            console.log(`✅ Fallback data for ${symbol}: $${quote.c} (${quote.d >= 0 ? '+' : ''}${quote.d})`)
          } else {
            newStates[symbol] = 'error'
            console.warn(`⚠️ No valid data for ${symbol}`)
          }
        })

        setFallbackData(newFallbackData)
        setDataLoadingStates(newStates)
      }
    } catch (error) {
      console.error('Failed to fetch fallback data:', error)
      const newStates = { ...dataLoadingStates }
      symbolsToFetch.forEach((symbol) => {
        newStates[symbol] = 'error'
      })
      setDataLoadingStates(newStates)
    }
  }

  // Load fallback data immediately when market opens
  useEffect(() => {
    if (symbols.length === 0 || !marketStatus?.isOpen) return

    // Immediately load fallback data for all symbols when market is open
    fetchFallbackData(symbols)

    // Set up staggered timeouts for symbols that might be slow
    const timeouts: NodeJS.Timeout[] = []

    symbols.forEach((symbol, index) => {
      // Refresh specific symbols that don't get live data within 10 seconds
      const timeout = setTimeout(() => {
        if (!prices[symbol] || !prices[symbol].isLive) {
          console.log(`⏰ Refreshing slow symbol: ${symbol}`)
          fetchFallbackData([symbol])
        }
      }, 10000 + index * 2000) // 10s, 12s, 14s, etc.

      timeouts.push(timeout)
    })

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [symbols, marketStatus?.isOpen])

  // Update loading states based on live data
  useEffect(() => {
    const newStates = { ...dataLoadingStates }
    let hasChanges = false

    Object.keys(prices).forEach((symbol) => {
      const price = prices[symbol]
      if (price && price.isLive && newStates[symbol] !== 'live') {
        newStates[symbol] = 'live'
        hasChanges = true
        console.log(`🔴 ${symbol} now has live data`)
      }
    })

    if (hasChanges) {
      setDataLoadingStates(newStates)
    }
  }, [prices, dataLoadingStates])

  // DEBUG VERSION: Replace your getBestPriceData function with this temporarily to see what's happening

  const getBestPriceData = (symbol: string) => {
    const livePrice = prices[symbol]
    const marketPrice = marketData[symbol] // This might be empty
    const directPrice = directPrices[symbol] // ✅ NEW: Use direct API data
    const fallback = fallbackData[symbol]

    console.log(`🔍 DEBUG - getBestPriceData for ${symbol}:`, {
      livePrice,
      marketPrice,
      directPrice, // ✅ NEW: Check direct price
      fallback,
      marketStatus: marketStatus?.isOpen,
      isLive,
    })

    // Prefer live WebSocket data (only available when market is open)
    if (livePrice && livePrice.isLive && livePrice.price > 0) {
      console.log(`✅ ${symbol}: Using live price: $${livePrice.price}`)
      return {
        price: livePrice.price,
        change: livePrice.change,
        changePercent: livePrice.changePercent,
        isLive: true,
        ageLabel: 'Live',
        showAsStale: false,
        dataAge: 'live',
        timestamp: livePrice.timestamp,
      }
    }

    // Use market-aware data (respects market hours)
    if (marketPrice && marketPrice.c > 0) {
      console.log(`✅ ${symbol}: Using market data: $${marketPrice.c}`)
      return {
        price: marketPrice.c,
        change: marketPrice.d || 0,
        changePercent: marketPrice.dp || 0,
        isLive: isLive,
        ageLabel: isLive ? 'API Live' : 'Last Close',
        showAsStale: !isLive,
        dataAge: isLive ? 'recent' : 'closed',
        timestamp: marketLastUpdate,
      }
    }

    // ✅ NEW: Use direct API data (this should work!)
    if (directPrice && directPrice.c > 0) {
      console.log(`✅ ${symbol}: Using direct API price: $${directPrice.c}`)
      return {
        price: directPrice.c,
        change: directPrice.d || 0,
        changePercent: directPrice.dp || 0,
        isLive: false,
        ageLabel: marketStatus?.isOpen ? 'API Live' : 'Last Close',
        showAsStale: false, // Don't show as stale since this is current data
        dataAge: 'direct_api',
        timestamp: Date.now(),
      }
    }

    // Fallback to existing fallback data
    if (fallback && fallback.price > 0) {
      console.log(`✅ ${symbol}: Using fallback data: $${fallback.price}`)
      return {
        price: fallback.price,
        change: fallback.change,
        changePercent: fallback.changePercent,
        isLive: false,
        ageLabel: 'Cached',
        showAsStale: true,
        dataAge: 'fallback',
        timestamp: fallback.timestamp,
      }
    }

    // No data available
    console.log(`❌ ${symbol}: No data available`)
    return {
      price: 0,
      change: 0,
      changePercent: 0,
      isLive: false,
      ageLabel: 'No Data',
      showAsStale: true,
      dataAge: 'none',
      timestamp: 0,
    }
  }
  // Handle position click to navigate to stock detail
  const handlePositionClick = (position: Position) => {
    router.push(`/portfolio/${position.ticker}`)
  }

  // Handle watchlist item click
  const handleWatchlistItemClick = (item: any) => {
    router.push(`/watchlist/${item.ticker}`)
  }

  useEffect(() => {
    if (!user) return // ⬅️ wait until Firebase user is ready
    fetchPositions(true).then(() => setLastUpdate(new Date()))
  }, [user, fetchPositions])
  useEffect(() => {
    if (!user) return // ⬅️ same guard
    if (!marketStatus?.isOpen) return

    const interval = setInterval(async () => {
      await fetchPositions(true)
      setLastUpdate(new Date())
    }, 300000)

    return () => clearInterval(interval)
  }, [user, marketStatus?.isOpen, fetchPositions])
  const handleRefreshPrices = async () => {
    if (isRefreshing) return

    try {
      setIsRefreshing(true)
      console.log('🔄 Manual refresh triggered')

      if (marketStatus?.isOpen) {
        // Market is open - refresh everything
        await Promise.all([
          refresh(), // Market-aware refresh
          fetchPositions(true),
          fetchFallbackData(symbols),
        ])
      } else {
        // Market is closed - only refresh positions from database
        console.log('🔒 Market closed - only refreshing database positions')
        await fetchPositions(true)
      }

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error refreshing prices:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Calculate live portfolio stats
  // ✅ FIXED: Update your livePortfolioStats useMemo to include lastMarketPrices

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
      const bestPrice = getBestPriceData(position.ticker)
      const currentPrice = bestPrice.price || position.currentPrice || position.averagePrice

      totalCost += position.totalCost
      totalValue += position.totalShares * currentPrice

      console.log(`💰 Portfolio calc for ${position.ticker}:`, {
        shares: position.totalShares,
        bestPrice: bestPrice.price,
        currentPrice,
        avgPrice: position.averagePrice,
        cost: position.totalCost,
        value: position.totalShares * currentPrice,
      })
    })

    console.log(`💰 Total Portfolio Stats:`, {
      totalValue,
      totalCost,
      totalUnrealizedPnL: totalValue - totalCost,
      totalPositions: positions.length,
    })

    return {
      totalValue,
      totalCost,
      totalUnrealizedPnL: totalValue - totalCost,
      totalPositions: positions.length,
    }
  }, [positions, prices, marketData, directPrices, fallbackData])

  // Watchlist functions
  const handleAddFolder = () => {
    if (!newFolderName.trim()) return
    addFolder(newFolderName.trim())
    setNewFolderName('')
    setShowAddFolder(false)
  }

  const handleRenameFolder = (folderId: string, newName: string) => {
    renameFolder(folderId, newName)
    setEditingFolder(null)
  }

  // Drag and drop functions
  const handleDragStart = (item: any, fromFolderId: string) => {
    setDraggedItem({ item, fromFolderId })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, toFolderId: string) => {
    e.preventDefault()

    if (!draggedItem || draggedItem.fromFolderId === toFolderId) {
      setDraggedItem(null)
      return
    }

    moveItemBetweenFolders(draggedItem.fromFolderId, toFolderId, draggedItem.item.id)
    setDraggedItem(null)
  }

  // Handle adding stock from search
  const handleAddStock = (stock: any, folderId: string) => {
    addItemToFolder(folderId, {
      ticker: stock.ticker,
      company: stock.company,
      logo: stock.logo,
    })
  }

  const safePositions = positions || []
  const safeStats = livePortfolioStats

  return (
    <MobileLayout title='Portfolio' subtitle={`${safePositions.length} active positions`}>
      <div className='space-y-2'>
        {/* Tab Switcher */}
        <div className='flex rounded-xl p-1'>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex-1 px-2 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'portfolio' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className='flex items-center justify-center gap-2'>
              <BarChart3 className='w-4 h-4' />
              Portfolio
            </div>
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`flex-1 px-2 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'watchlist' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className='flex items-center justify-center gap-2'>
              <Eye className='w-4 h-4' />
              Watchlist
            </div>
          </button>
        </div>

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
            {/* Show last update time */}
            {marketLastUpdate > 0 && (
              <span>
                Last: {new Date(marketLastUpdate).toLocaleTimeString()}
                {!marketStatus?.isOpen && ' (Close)'}
              </span>
            )}
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

        {/* Portfolio Tab Content */}
        {activeTab === 'portfolio' && (
          <>
            {/* Loading State */}
            {isLoadingPositions && (
              <div className='theme-card p-8'>
                <div className='text-center'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2'></div>
                  <p className='theme-text-secondary'>Loading portfolio...</p>
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
                    {!marketStatus?.isOpen && <div className='w-2 h-2 bg-gray-500 rounded-full'></div>}
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
                      onClick={() => handlePositionClick(position)}
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
                              {!isLiveData && !marketStatus?.isOpen && (
                                <div className='w-2 h-2 bg-gray-500 rounded-full'></div>
                              )}
                              {!isLiveData && marketStatus?.isOpen && bestPrice.dataAge === 'fallback' && (
                                <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                              )}
                            </div>
                            <div className='text-sm theme-text-secondary truncate'>{position.company}</div>
                          </div>
                        </div>

                        <div className='text-right'>
                          <div
                            className={`flex items-center gap-1 ${
                              unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {unrealizedPnL >= 0 ? (
                              <TrendingUp className='w-4 h-4' />
                            ) : (
                              <TrendingDown className='w-4 h-4' />
                            )}
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
                          <div className='theme-text-primary font-medium'>
                            {Number(position.totalShares).toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className='theme-text-secondary'>Avg Price</div>
                          <div className='theme-text-primary font-medium'>${safeToFixed(position.averagePrice)}</div>
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
                            ${(currentPrice || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className='mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs theme-text-secondary'>
                        <span> Cost: ${Number(position.totalCost ?? 0).toFixed(2)}</span>
                        <span>Value: ${(currentValue || 0).toFixed(2)}</span>
                      </div>

                      {/* Show status based on data source */}
                      <div className='mt-1 text-xs text-center'>
                        <span
                          className={`${
                            bestPrice.isLive
                              ? 'text-green-400'
                              : bestPrice.showAsStale
                              ? 'text-gray-400'
                              : 'text-blue-400'
                          }`}
                        >
                          {bestPrice.ageLabel}
                          {bestPrice.timestamp > 0 && ` • ${new Date(bestPrice.timestamp).toLocaleTimeString()}`}
                          {!marketStatus?.isOpen && ' (Market Closed)'}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}

        {/* Watchlist Tab Content */}
        {activeTab === 'watchlist' && (
          <div className='space-y-4'>
            {/* Add Folder Button */}
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-semibold watchlist-text-primary'>Watchlist</h3>
              <button
                onClick={() => setShowAddFolder(true)}
                className='flex items-center gap-2 px-3 py-2 watchlist-button-primary text-sm'
              >
                <FolderPlus className='w-4 h-4' />
                Add Folder
              </button>
            </div>

            {/* Stock Search */}
            <StockSearch
              onAddStock={handleAddStock}
              folders={folders}
              placeholder='Search and add stocks to watchlist...'
            />

            {/* Add Folder Input */}
            {showAddFolder && (
              <div className='watchlist-add-folder-card'>
                <div className='flex gap-2'>
                  <input
                    type='text'
                    placeholder='Folder name'
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className='flex-1 watchlist-folder-input'
                    onKeyPress={(e) => e.key === 'Enter' && handleAddFolder()}
                  />
                  <button onClick={handleAddFolder} className='px-4 py-2 watchlist-button-primary'>
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddFolder(false)
                      setNewFolderName('')
                    }}
                    className='px-4 py-2 watchlist-button-secondary'
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Watchlist Folders */}
            <div className='space-y-3 watchlist-container'>
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className='watchlist-folder-card p-4'
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, folder.id)}
                >
                  {/* Folder Header */}
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => toggleFolder(folder.id)}
                        className='p-1 hover:bg-gray-700 rounded transition-colors'
                      >
                        {folder.isExpanded ? (
                          <ChevronDown className='w-4 h-4 watchlist-text-secondary' />
                        ) : (
                          <ChevronRight className='w-4 h-4 watchlist-text-secondary' />
                        )}
                      </button>

                      {editingFolder === folder.id ? (
                        <input
                          type='text'
                          defaultValue={folder.name}
                          className='px-2 py-1 watchlist-folder-input text-sm'
                          onBlur={(e) => handleRenameFolder(folder.id, e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameFolder(folder.id, e.currentTarget.value)
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <h4
                          className='font-medium watchlist-text-primary cursor-pointer'
                          onClick={() => toggleFolder(folder.id)}
                        >
                          {folder.name}
                        </h4>
                      )}

                      <span className='text-xs watchlist-text-secondary'>({folder.items.length})</span>
                    </div>

                    {/* Folder Actions */}
                    <div className='flex items-center gap-1'>
                      <button
                        onClick={() => setEditingFolder(folder.id)}
                        className='p-1 hover:bg-gray-700 rounded transition-colors'
                      >
                        <Edit className='w-3 h-3 watchlist-icon' />
                      </button>
                      <button
                        onClick={() => deleteFolder(folder.id)}
                        className='p-1 hover:bg-gray-700 rounded transition-colors'
                      >
                        <Trash2 className='w-3 h-3 text-red-400' />
                      </button>
                    </div>
                  </div>

                  {/* Folder Items */}
                  {folder.isExpanded && (
                    <div className='space-y-2'>
                      {folder.items.length === 0 ? (
                        <div className='text-center py-4 text-sm watchlist-text-secondary'>
                          No symbols in this folder
                        </div>
                      ) : (
                        <>
                          {/* Header Row */}
                          <div className='watchlist-table-header'>
                            <div className='grid grid-cols-12 gap-3 items-center text-xs watchlist-text-secondary font-medium'>
                              <div className='col-span-4 watchlist-col-symbol'>Symbol</div>
                              <div className='col-span-3 watchlist-col-price'>Last</div>
                              <div className='col-span-2 watchlist-col-change'>Chg</div>
                              <div className='col-span-2 watchlist-col-change'>Chg%</div>
                              <div className='col-span-1'></div>
                            </div>
                          </div>

                          {/* Stock Items */}
                          {folder.items.map((item) => {
                            const bestPrice = getBestPriceData(item.ticker)
                            const loadingState = dataLoadingStates[item.ticker]
                            const currentPrice = bestPrice.price
                            const isLiveData = bestPrice.isLive
                            const change = bestPrice.change
                            const changePercent = bestPrice.changePercent

                            // Get display status
                            const getDisplayStatus = () => {
                              if (loadingState === 'loading' && currentPrice === 0) {
                                return {
                                  status: 'loading',
                                  indicator: <Loader2 className='w-3 h-3 animate-spin text-gray-400' />,
                                  statusText: 'Loading...',
                                  statusColor: 'text-gray-400',
                                }
                              }

                              if (loadingState === 'error') {
                                return {
                                  status: 'error',
                                  indicator: <AlertCircle className='w-3 h-3 text-red-400' />,
                                  statusText: 'Error',
                                  statusColor: 'text-red-400',
                                }
                              }

                              if (isLiveData && marketStatus?.isOpen) {
                                return {
                                  status: 'live',
                                  indicator: <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>,
                                  statusText: 'Live',
                                  statusColor: 'text-green-400',
                                }
                              }

                              if (!marketStatus?.isOpen) {
                                return {
                                  status: 'closed',
                                  indicator: <div className='w-2 h-2 bg-gray-400 rounded-full'></div>,
                                  statusText: 'Closed',
                                  statusColor: 'text-gray-400',
                                }
                              }

                              if (loadingState === 'fallback' || bestPrice.ageLabel === 'API Live') {
                                const ageInMinutes = bestPrice.timestamp
                                  ? (Date.now() - bestPrice.timestamp) / 60000
                                  : 0
                                return {
                                  status: 'api',
                                  indicator: <div className='w-2 h-2 bg-blue-400 rounded-full'></div>,
                                  statusText: ageInMinutes < 5 ? 'Recent' : `${Math.floor(ageInMinutes)}m ago`,
                                  statusColor: 'text-blue-400',
                                }
                              }

                              return {
                                status: 'unknown',
                                indicator: <div className='w-2 h-2 bg-gray-400 rounded-full'></div>,
                                statusText: '-',
                                statusColor: 'text-gray-400',
                              }
                            }

                            const displayStatus = getDisplayStatus()

                            return (
                              <div
                                key={item.id}
                                className='watchlist-stock-item p-3 hover:bg-gray-800/50 transition-colors'
                                draggable
                                onDragStart={() => handleDragStart(item, folder.id)}
                                onClick={() => handleWatchlistItemClick(item)}
                              >
                                {/* Stock Item Layout */}
                                <div className='grid grid-cols-12 gap-3 items-center'>
                                  {/* Symbol & Company */}
                                  <div className='col-span-4 flex items-center gap-2'>
                                    <div className='w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs'>
                                      {item.logo ? (
                                        <img
                                          src={item.logo}
                                          alt={item.ticker}
                                          className='w-6 h-6 rounded-full object-cover'
                                          onError={(e) => {
                                            const target = e.currentTarget as HTMLImageElement
                                            target.style.display = 'none'
                                          }}
                                        />
                                      ) : (
                                        <div className='w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center'>
                                          <span className='text-xs'>{item.ticker.charAt(0)}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className='min-w-0 flex-1'>
                                      <div className='flex items-center gap-2'>
                                        <span className='font-medium watchlist-text-primary text-sm'>
                                          {item.ticker}
                                        </span>
                                        {displayStatus.indicator}
                                      </div>
                                      <div className='text-xs watchlist-text-secondary truncate flex items-center gap-2'>
                                        <span>{item.company}</span>
                                        <span className={`text-xs ${displayStatus.statusColor}`}>
                                          {displayStatus.statusText}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Current Price */}
                                  <div className='col-span-3 watchlist-col-price'>
                                    {currentPrice > 0 ? (
                                      <div className='space-y-1'>
                                        <div
                                          className={`font-medium text-sm ${
                                            isLiveData && marketStatus?.isOpen
                                              ? 'text-green-400'
                                              : bestPrice.showAsStale
                                              ? 'text-gray-400'
                                              : 'watchlist-text-primary'
                                          }`}
                                        >
                                          ${toFixed(currentPrice, 2)}
                                        </div>
                                        <div className='text-xs opacity-75'>{bestPrice.ageLabel}</div>
                                      </div>
                                    ) : (
                                      <div className='flex items-center gap-1 text-gray-400'>
                                        {displayStatus.status === 'loading' ? (
                                          <>
                                            <Loader2 className='w-3 h-3 animate-spin' />
                                            <span className='text-xs'>Loading</span>
                                          </>
                                        ) : (
                                          <span className='text-sm'>$0.00</span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Change Points */}
                                  <div className='col-span-2 watchlist-col-change'>
                                    {currentPrice > 0 && change !== 0 ? (
                                      <div
                                        className={`flex items-center justify-center gap-1 text-sm ${
                                          change >= 0 ? 'text-green-400' : 'text-red-400'
                                        }`}
                                      >
                                        {change >= 0 ? (
                                          <TrendingUp className='w-3 h-3' />
                                        ) : (
                                          <TrendingDown className='w-3 h-3' />
                                        )}
                                        <span className='font-medium'>
                                          {change >= 0 ? '+' : ''}
                                          {change.toFixed(2)}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className='text-sm text-gray-400 text-center'>-</span>
                                    )}
                                  </div>

                                  {/* Change Percentage */}
                                  <div className='col-span-2 watchlist-col-change'>
                                    {currentPrice > 0 && changePercent !== 0 ? (
                                      <div
                                        className={`text-sm font-medium text-center ${
                                          changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                                        }`}
                                      >
                                        {changePercent >= 0 ? '+' : ''}
                                        {changePercent.toFixed(2)}%
                                      </div>
                                    ) : (
                                      <span className='text-sm text-gray-400 text-center'>-</span>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <div className='col-span-1 flex justify-end'>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        removeItemFromFolder(folder.id, item.id)
                                      }}
                                      className='p-1 hover:bg-gray-700 rounded transition-colors'
                                    >
                                      <Trash2 className='w-3 h-3 text-red-400' />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  )
}
