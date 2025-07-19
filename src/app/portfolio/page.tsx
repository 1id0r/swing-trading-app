'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { useTradeStore } from '@/stores/useTradeStore'
import { useWatchlistStore } from '@/stores/useWatchlistStore'
import { useWatchlistInit } from '@/hooks/useWatchlistInit'
import { useRealtimePrices } from '@/hooks/useRealtimePrices'
import { useMarketAwareData } from '@/hooks/useMarketAwareData'
import { MarketHoursService, MarketStatus } from '@/lib/marketHours'
import { StockSearch } from '@/components/watchlist/StockSearch'
import { marketAwareApi } from '@/lib/marketAwareApi'
import { useAuth } from '@/app/contexts/AuthContext'
import { toFixed } from '@/lib/format' // Use your existing utility

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

// ✅ Enhanced safe number helpers
const safeNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value)
  return isNaN(num) || !isFinite(num) ? defaultValue : num
}

const safeToFixed = (value: any, decimals: number = 2): string => {
  const num = safeNumber(value, 0)
  return num.toFixed(decimals)
}

const safeCalculation = (fn: () => number, defaultValue: number = 0): number => {
  try {
    const result = fn()
    return safeNumber(result, defaultValue)
  } catch (error) {
    console.warn('Safe calculation failed:', error)
    return defaultValue
  }
}

export default function PortfolioPage() {
  const router = useRouter()
  const { positions, portfolioStats, fetchPositions, isLoadingPositions, error } = useTradeStore()

  useWatchlistInit()

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
    loading: watchlistLoading,
    error: watchlistError,
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

  // Market-aware data hook
  const {
    data: marketData,
    lastMarketPrices,
    lastUpdate: marketLastUpdate,
    isLive,
    isLoading: pricesLoading,
    marketStatus,
    refresh,
  } = useMarketAwareData(symbols)

  // WebSocket prices
  const { prices, isConnected } = useRealtimePrices(marketStatus?.isOpen ? symbols : [])

  // Initialize loading states
  useEffect(() => {
    const newStates: Record<string, 'loading' | 'live' | 'fallback' | 'error'> = {}
    symbols.forEach((symbol) => {
      newStates[symbol] = 'loading'
    })
    setDataLoadingStates(newStates)
  }, [symbols])

  // ✅ Enhanced getBestPriceData with better null/NaN handling
  const getBestPriceData = (symbol: string) => {
    const livePrice = prices[symbol]
    const marketPrice = marketData?.[symbol]
    const directPrice = directPrices[symbol]
    const fallback = fallbackData[symbol]
    const lastMarketPrice = lastMarketPrices?.[symbol]

    // 1. Prefer live WebSocket data
    if (livePrice?.isLive && safeNumber(livePrice.price) > 0) {
      return {
        price: safeNumber(livePrice.price),
        change: safeNumber(livePrice.change),
        changePercent: safeNumber(livePrice.changePercent),
        isLive: true,
        ageLabel: 'Live',
        showAsStale: false,
        dataAge: 'live',
        timestamp: safeNumber(livePrice.timestamp, Date.now()),
      }
    }

    // 2. Use market-aware data
    if (marketPrice?.c && safeNumber(marketPrice.c) > 0) {
      return {
        price: safeNumber(marketPrice.c),
        change: safeNumber(marketPrice.d),
        changePercent: safeNumber(marketPrice.dp),
        isLive: isLive,
        ageLabel: isLive ? 'API Live' : 'Last Close',
        showAsStale: !isLive,
        dataAge: isLive ? 'recent' : 'closed',
        timestamp: safeNumber(marketLastUpdate, Date.now()),
      }
    }

    // 3. Use direct API data
    if (directPrice?.c && safeNumber(directPrice.c) > 0) {
      return {
        price: safeNumber(directPrice.c),
        change: safeNumber(directPrice.d),
        changePercent: safeNumber(directPrice.dp),
        isLive: false,
        ageLabel: marketStatus?.isOpen ? 'API Live' : 'Last Close',
        showAsStale: false,
        dataAge: 'direct_api',
        timestamp: Date.now(),
      }
    }

    // 4. Use lastMarketPrices
    if (lastMarketPrice) {
      if (Array.isArray(lastMarketPrice) && lastMarketPrice.length >= 2) {
        const price = safeNumber(lastMarketPrice[1])
        if (price > 0) {
          return {
            price,
            change: 0,
            changePercent: 0,
            isLive: false,
            ageLabel: 'Last Close',
            showAsStale: false,
            dataAge: 'last_market',
            timestamp: safeNumber(lastMarketPrice[0], Date.now()),
          }
        }
      } else if (lastMarketPrice.price && safeNumber(lastMarketPrice.price) > 0) {
        return {
          price: safeNumber(lastMarketPrice.price),
          change: safeNumber(lastMarketPrice.change),
          changePercent: safeNumber(lastMarketPrice.changePercent),
          isLive: false,
          ageLabel: 'Last Close',
          showAsStale: false,
          dataAge: 'last_market',
          timestamp: safeNumber(lastMarketPrice.timestamp, Date.now()),
        }
      }
    }

    // 5. Fallback data
    if (fallback?.price && safeNumber(fallback.price) > 0) {
      return {
        price: safeNumber(fallback.price),
        change: safeNumber(fallback.change),
        changePercent: safeNumber(fallback.changePercent),
        isLive: false,
        ageLabel: 'Cached',
        showAsStale: true,
        dataAge: 'fallback',
        timestamp: safeNumber(fallback.timestamp, Date.now()),
      }
    }

    // 6. No data available
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

  // Handle position click
  const handlePositionClick = (position: Position) => {
    router.push(`/portfolio/${position.ticker}`)
  }

  // Handle watchlist item click
  const handleWatchlistItemClick = (item: any) => {
    router.push(`/watchlist/${item.ticker}`)
  }

  useEffect(() => {
    if (!user) return
    fetchPositions(true).then(() => setLastUpdate(new Date()))
  }, [user, fetchPositions])

  useEffect(() => {
    if (!user) return
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

      if (marketStatus?.isOpen) {
        await Promise.all([refresh(), fetchPositions(true)])
      } else {
        await fetchPositions(true)
      }

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error refreshing prices:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // ✅ Enhanced portfolio stats calculation with safe math
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

      // ✅ Use safe number conversion for all calculations
      const shares = safeNumber(position.totalShares)
      const avgPrice = safeNumber(position.averagePrice)
      const currentPrice = safeNumber(bestPrice.price) || avgPrice // Fallback to avg price
      const cost = safeNumber(position.totalCost)

      // ✅ Safe calculations
      const positionCost = cost || shares * avgPrice // Calculate if missing
      const positionValue = shares * currentPrice

      totalCost += positionCost
      totalValue += positionValue

      console.log(`💰 Safe calc for ${position.ticker}:`, {
        shares,
        avgPrice,
        currentPrice,
        cost: positionCost,
        value: positionValue,
      })
    })

    // ✅ Final safe calculations
    const unrealizedPnL = safeCalculation(() => totalValue - totalCost)

    return {
      totalValue: safeNumber(totalValue),
      totalCost: safeNumber(totalCost),
      totalUnrealizedPnL: unrealizedPnL,
      totalPositions: positions.length,
    }
  }, [positions, prices, marketData, directPrices, fallbackData, lastMarketPrices])

  // Watchlist functions
  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      await addFolder(newFolderName.trim())
      setNewFolderName('')
      setShowAddFolder(false)
    } catch (error) {
      console.error('Failed to add folder:', error)
    }
  }

  const handleRenameFolder = async (folderId: string, newName: string) => {
    try {
      await renameFolder(folderId, newName)
      setEditingFolder(null)
    } catch (error) {
      console.error('Failed to rename folder:', error)
    }
  }

  const handleDragStart = (item: any, fromFolderId: string) => {
    setDraggedItem({ item, fromFolderId })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, toFolderId: string) => {
    e.preventDefault()

    if (!draggedItem || draggedItem.fromFolderId === toFolderId) {
      setDraggedItem(null)
      return
    }

    try {
      await moveItemBetweenFolders(draggedItem.fromFolderId, toFolderId, draggedItem.item.id)
      setDraggedItem(null)
    } catch (error) {
      console.error('Failed to move item:', error)
      setDraggedItem(null)
    }
  }

  const handleAddStock = async (stock: any, folderId: string) => {
    if (!folderId || !stock.ticker) {
      console.error('Invalid input for adding stock')
      return
    }

    const folder = folders.find((f) => f.id === folderId)
    if (!folder) {
      console.error('Folder not found:', folderId)
      return
    }

    try {
      await addItemToFolder(folderId, {
        ticker: stock.ticker,
        company: stock.company,
        logo: stock.logo,
      })
    } catch (error) {
      console.error('Failed to add stock:', error)
    }
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
              Watchlist ({folders.reduce((total, folder) => total + folder.items.length, 0)})
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
                  <button
                    onClick={handleRefreshPrices}
                    className='p-2 theme-text-secondary hover:theme-text-primary transition-colors'
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='text-center'>
                    <div className='text-2xl font-bold theme-text-primary'>${safeToFixed(safeStats.totalValue)}</div>
                    <div className='text-sm theme-text-secondary'>Current Value</div>
                  </div>
                  <div className='text-center'>
                    <div
                      className={`text-2xl font-bold ${
                        safeStats.totalUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {safeStats.totalUnrealizedPnL >= 0 ? '+' : ''}$
                      {safeToFixed(Math.abs(safeStats.totalUnrealizedPnL))}
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

                  // ✅ Safe calculations for position
                  const shares = safeNumber(position.totalShares)
                  const avgPrice = safeNumber(position.averagePrice)
                  const currentPrice = safeNumber(bestPrice.price) || avgPrice
                  const totalCost = safeNumber(position.totalCost) || shares * avgPrice

                  const currentValue = safeCalculation(() => shares * currentPrice)
                  const unrealizedPnL = safeCalculation(() => currentValue - totalCost)
                  const unrealizedPnLPercent = safeCalculation(() =>
                    totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0
                  )

                  const isLiveData = bestPrice.isLive

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
                              {unrealizedPnL >= 0 ? '+' : ''}${safeToFixed(Math.abs(unrealizedPnL))}
                            </span>
                          </div>
                          <div className={`text-xs ${unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {unrealizedPnL >= 0 ? '+' : ''}
                            {safeToFixed(Math.abs(unrealizedPnLPercent))}%
                          </div>
                        </div>
                      </div>

                      <div className='grid grid-cols-3 gap-4 text-sm'>
                        <div>
                          <div className='theme-text-secondary'>Shares</div>
                          <div className='theme-text-primary font-medium'>{toFixed(shares, 2)}</div>
                        </div>
                        <div>
                          <div className='theme-text-secondary'>Avg Price</div>
                          <div className='theme-text-primary font-medium'>${safeToFixed(avgPrice)}</div>
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
                            ${safeToFixed(currentPrice)}
                          </div>
                        </div>
                      </div>

                      <div className='mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs theme-text-secondary'>
                        <span>Cost: ${safeToFixed(totalCost)}</span>
                        <span>Value: ${safeToFixed(currentValue)}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}

        {/* Watchlist Tab Content - Keep existing implementation */}
        {activeTab === 'watchlist' && (
          <div className='space-y-4'>
            {/* Mobile Drag Indicator */}
            {isDragging && (
              <div className='fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg'>
                <div className='flex items-center gap-2'>
                  <Move className='w-4 h-4' />
                  <span>Moving {draggedItem?.item.ticker}</span>
                </div>
              </div>
            )}

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

            {/* Stock Search - Only show if we have folders */}
            {folders.length > 0 && (
              <StockSearch
                onAddStock={handleAddStock}
                folders={folders}
                placeholder='Search and add stocks to watchlist...'
              />
            )}

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
              {folders.length === 0 ? (
                <div className='text-center py-12'>
                  <div className='text-gray-400 mb-2'>No watchlist folders</div>
                  <div className='text-sm text-gray-400'>Create a folder to start tracking stocks</div>
                </div>
              ) : (
                folders.map((folder) => (
                  <div
                    key={folder.id}
                    data-folder-id={folder.id}
                    className={`watchlist-folder-card p-4 transition-all duration-200 ${
                      dragOverFolder === folder.id && isDragging ? 'ring-2 ring-blue-500 bg-blue-500/10 scale-105' : ''
                    }`}
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

                        <span className='text-xs watchlist-text-secondary'>({folder.items?.length || 0})</span>
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
                        {!folder.items || folder.items.length === 0 ? (
                          <div className='text-center py-4 text-gray-400 text-sm'>
                            No stocks in this folder. Use search above to add stocks.
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
                                  className={`watchlist-stock-item p-3 hover:bg-gray-800/50 transition-colors select-none ${
                                    isDragging && draggedItem?.item.id === item.id ? 'opacity-50 scale-95' : ''
                                  }`}
                                  draggable
                                  onDragStart={() => handleDragStart(item, folder.id)}
                                  onTouchStart={(e) => handleTouchStart(e, item, folder.id)}
                                  onTouchMove={handleTouchMove}
                                  onTouchEnd={handleTouchEnd}
                                  onClick={() => !isDragging && handleWatchlistItemClick(item)}
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
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  )
}
