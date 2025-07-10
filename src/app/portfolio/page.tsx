// Replace your /src/app/portfolio/page.tsx with this version that uses the watchlist store
'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { useTradeStore } from '@/stores/useTradeStore'
import { useWatchlistStore } from '@/stores/useWatchlistStore'
import { useRealtimePrices } from '@/hooks/useRealtimePrices'
import { MarketHoursService, MarketStatus } from '@/lib/marketHours'
import { StockSearch } from '@/components/watchlist/StockSearch'
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
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null)
  const [activeTab, setActiveTab] = useState<'portfolio' | 'watchlist'>('portfolio')
  const [draggedItem, setDraggedItem] = useState<{ item: any; fromFolderId: string } | null>(null)
  const [showAddFolder, setShowAddFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingFolder, setEditingFolder] = useState<string | null>(null)

  // Get symbols from positions and watchlist
  const symbols = useMemo(() => {
    const positionSymbols = positions?.map((p: Position) => p.ticker) || []
    const watchlistSymbols = getAllSymbols()
    return [...new Set([...positionSymbols, ...watchlistSymbols])]
  }, [positions, getAllSymbols])

  // Use real-time prices hook (only when market is open)
  const shouldUseRealtime = marketStatus?.isOpen || false
  const { prices, isConnected, isLoading: pricesLoading } = useRealtimePrices(shouldUseRealtime ? symbols : [])

  // Update market status
  useEffect(() => {
    const updateMarketStatus = () => {
      const status = MarketHoursService.getCurrentMarketStatus('US')
      setMarketStatus(status)
      console.log('📊 Market status updated:', status)
    }

    updateMarketStatus()
    const interval = setInterval(updateMarketStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  // Handle position click to navigate to stock detail
  const handlePositionClick = (position: Position) => {
    router.push(`/portfolio/${position.ticker}`)
  }

  // Handle watchlist item click
  const handleWatchlistItemClick = (item: any) => {
    router.push(`/portfolio/${item.ticker}`)
  }

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
      <div className='space-y-6'>
        {/* Tab Switcher */}
        <div className='flex bg-gray-800 rounded-lg p-1'>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
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
            className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
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
            {lastUpdate && <span>Last: {lastUpdate.toLocaleTimeString()}</span>}
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
                    <div
                      className={`font-medium ${safeStats.totalUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}
                    >
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
                              {isLive && <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>}
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
                    <div className='space-y-2 '>
                      {folder.items.length === 0 ? (
                        <div className='text-center py-4 text-sm watchlist-text-secondary'>
                          No symbols in this folder
                        </div>
                      ) : (
                        <>
                          {/* Header Row - TradingView Style */}
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
                            const livePrice = prices[item.ticker]
                            const currentPrice = livePrice?.price || 0
                            const isLive = !!livePrice?.isLive && marketStatus?.isOpen
                            const change = livePrice?.change || 0
                            const changePercent = livePrice?.changePercent || 0

                            return (
                              <div
                                key={item.id}
                                className='watchlist-stock-item p-3'
                                draggable
                                onDragStart={() => handleDragStart(item, folder.id)}
                                onClick={() => handleWatchlistItemClick(item)}
                              >
                                {/* Stock Item Layout - Trading View Style */}
                                <div className='grid grid-cols-12 gap-3 items-center'>
                                  {/* Symbol & Company - Left Aligned */}
                                  <div className='col-span-4 flex items-center gap-2'>
                                    <div className='w-10 h-  rounded-full flex items-center justify-center text-white font-bold text-xs'>
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
                                        <span>{item.ticker.charAt(0)}</span>
                                      )}
                                    </div>
                                    <div className='min-w-0'>
                                      <div className='flex items-center gap-2'>
                                        <span className='font-medium watchlist-text-primary text-sm'>
                                          {item.ticker}
                                        </span>
                                        {isLive && <div className='w-1.5 h-1.5 watchlist-live-dot rounded-full'></div>}
                                      </div>
                                      <div className='text-xs watchlist-text-secondary truncate'>{item.company}</div>
                                    </div>
                                  </div>

                                  {/* Current Price - Center */}
                                  <div className='col-span-3 watchlist-col-price'>
                                    <div
                                      className={`font-medium text-sm watchlist-price-animate ${
                                        isLive ? 'watchlist-price-positive' : 'watchlist-text-primary'
                                      }`}
                                    >
                                      ${currentPrice.toFixed(2)}
                                    </div>
                                  </div>

                                  {/* Change Points - Center */}
                                  <div className='col-span-2 watchlist-col-change'>
                                    {change !== 0 ? (
                                      <div
                                        className={`flex items-center justify-center gap-1 text-sm watchlist-price-animate ${
                                          change >= 0 ? 'watchlist-price-positive' : 'watchlist-price-negative'
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
                                      <span className='text-sm watchlist-text-secondary'>-</span>
                                    )}
                                  </div>

                                  {/* Change Percentage - Center */}
                                  <div className='col-span-2 watchlist-col-change'>
                                    {changePercent !== 0 ? (
                                      <div
                                        className={`text-sm font-medium watchlist-price-animate ${
                                          changePercent >= 0 ? 'watchlist-price-positive' : 'watchlist-price-negative'
                                        }`}
                                      >
                                        {changePercent >= 0 ? '+' : ''}
                                        {changePercent.toFixed(2)}%
                                      </div>
                                    ) : (
                                      <span className='text-sm watchlist-text-secondary'>-</span>
                                    )}
                                  </div>

                                  {/* Actions - Right */}
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

            {/* Drag and Drop Instructions */}
            {draggedItem && (
              <div className='fixed top-4 left-1/2 transform -translate-x-1/2 watchlist-drag-overlay text-white px-4 py-2 shadow-lg z-50'>
                <div className='flex items-center gap-2'>
                  <Move className='w-4 h-4' />
                  <span>Drop on a folder to move "{draggedItem.item.ticker}"</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  )
}
