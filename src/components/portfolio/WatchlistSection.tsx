// components/portfolio/WatchlistSection.tsx
import { useState } from 'react'
import { useWatchlistStore } from '@/stores/useWatchlistStore'
import { StockSearch } from '@/components/watchlist/StockSearch'
import {
  FolderPlus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
} from 'lucide-react'

interface WatchlistSectionProps {
  getBestPriceData: (symbol: string) => any
  marketStatus: any
  onWatchlistItemClick: (item: any) => void
}

export function WatchlistSection({ getBestPriceData, marketStatus, onWatchlistItemClick }: WatchlistSectionProps) {
  const {
    folders,
    addFolder,
    deleteFolder,
    renameFolder,
    toggleFolder,
    addItemToFolder,
    removeItemFromFolder,
    moveItemBetweenFolders,
  } = useWatchlistStore()

  const [showAddFolder, setShowAddFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingFolder, setEditingFolder] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<{ item: any; fromFolderId: string } | null>(null)

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

  const handleAddStock = (stock: any, folderId: string) => {
    addItemToFolder(folderId, {
      ticker: stock.ticker,
      company: stock.company,
      logo: stock.logo,
    })
  }

  return (
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
      <StockSearch onAddStock={handleAddStock} folders={folders} placeholder='Search and add stocks to watchlist...' />

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
            <div className='theme-text-secondary mb-2'>No watchlist items</div>
            <div className='text-sm theme-text-secondary'>Search and add stocks to start tracking</div>
          </div>
        ) : (
          folders.map((folder) => (
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
                    <div className='text-center py-4 text-sm watchlist-text-secondary'>No symbols in this folder</div>
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
                        const currentPrice = bestPrice.price
                        const isLiveData = bestPrice.isLive
                        const change = bestPrice.change
                        const changePercent = bestPrice.changePercent

                        const getDisplayStatus = () => {
                          if (currentPrice === 0) {
                            return {
                              status: 'loading',
                              indicator: <Loader2 className='w-3 h-3 animate-spin text-gray-400' />,
                              statusText: 'Loading...',
                              statusColor: 'text-gray-400',
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

                          return {
                            status: 'api',
                            indicator: <div className='w-2 h-2 bg-blue-400 rounded-full'></div>,
                            statusText: 'Recent',
                            statusColor: 'text-blue-400',
                          }
                        }

                        const displayStatus = getDisplayStatus()

                        return (
                          <div
                            key={item.id}
                            className='watchlist-stock-item p-3 hover:bg-gray-800/50 transition-colors'
                            draggable
                            onDragStart={() => handleDragStart(item, folder.id)}
                            onClick={() => onWatchlistItemClick(item)}
                          >
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
                                    <span className='font-medium watchlist-text-primary text-sm'>{item.ticker}</span>
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
                                      ${currentPrice.toFixed(2)}
                                    </div>
                                    <div className='text-xs opacity-75'>{bestPrice.ageLabel}</div>
                                  </div>
                                ) : (
                                  <div className='flex items-center gap-1 text-gray-400'>
                                    <Loader2 className='w-3 h-3 animate-spin' />
                                    <span className='text-xs'>Loading</span>
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
  )
}
