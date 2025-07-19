// components/portfolio/WatchlistSection.tsx - Refactored with pure Tailwind
'use client'

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
import { cn, themeClass, getPriceChangeClass, getMarketStatusClass } from '@/lib/theme-utils'

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
    <div className='space-y-6'>
      {/* Section Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <h3 className={cn(themeClass('textPrimary'), 'text-xl font-bold')}>Watchlist</h3>
          {marketStatus && (
            <div className='flex items-center gap-2'>
              <div className={cn(getMarketStatusClass(marketStatus.isOpen), 'w-2 h-2 rounded-full')} />
              <span className={cn(themeClass('textSecondary'), 'text-sm font-medium')}>
                {marketStatus.isOpen ? 'Market Open' : 'Market Closed'}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowAddFolder(true)}
          className={cn(
            themeClass('buttonSecondary'),
            'flex items-center gap-2 text-sm hover:scale-105 transition-transform duration-200'
          )}
        >
          <FolderPlus className='w-4 h-4' />
          Add Folder
        </button>
      </div>

      {/* Add Folder Form */}
      {showAddFolder && (
        <div className={cn(themeClass('card'), 'p-4 animate-in slide-in-from-top-2 duration-200')}>
          <div className='space-y-3'>
            <label className={cn(themeClass('textPrimary'), 'text-sm font-medium')}>Folder Name</label>
            <div className='flex gap-2'>
              <input
                type='text'
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder='Enter folder name...'
                className={cn(themeClass('input'), 'flex-1')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddFolder()
                  if (e.key === 'Escape') {
                    setShowAddFolder(false)
                    setNewFolderName('')
                  }
                }}
                autoFocus
              />
              <button
                onClick={handleAddFolder}
                disabled={!newFolderName.trim()}
                className={cn(themeClass('buttonPrimary'), 'disabled:opacity-50 disabled:cursor-not-allowed')}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddFolder(false)
                  setNewFolderName('')
                }}
                className={cn(themeClass('buttonGhost'))}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folders */}
      <div className='space-y-4'>
        {folders.map((folder) => (
          <div
            key={folder.id}
            className={cn(
              themeClass('card'),
              'overflow-hidden transition-all duration-200',
              draggedItem?.fromFolderId !== folder.id && 'hover:shadow-md dark:hover:shadow-slate-900/20'
            )}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, folder.id)}
          >
            {/* Folder Header */}
            <div className='p-4 border-b border-gray-200 dark:border-slate-700'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3 flex-1'>
                  <button
                    onClick={() => toggleFolder(folder.id)}
                    className={cn(themeClass('hover'), 'p-1 rounded-lg transition-colors duration-200')}
                  >
                    {folder.isExpanded ? <ChevronDown className='w-4 h-4' /> : <ChevronRight className='w-4 h-4' />}
                  </button>

                  {editingFolder === folder.id ? (
                    <input
                      type='text'
                      defaultValue={folder.name}
                      className={cn(themeClass('input'), 'text-sm py-1 px-2 min-w-0 flex-1')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRenameFolder(folder.id, e.currentTarget.value)
                        }
                        if (e.key === 'Escape') {
                          setEditingFolder(null)
                        }
                      }}
                      onBlur={(e) => {
                        handleRenameFolder(folder.id, e.target.value)
                      }}
                      autoFocus
                    />
                  ) : (
                    <div className='flex items-center gap-2 flex-1 min-w-0'>
                      <h4 className={cn(themeClass('textPrimary'), 'font-semibold truncate')}>{folder.name}</h4>
                      <span
                        className={cn(
                          themeClass('textSecondary'),
                          'text-xs font-medium px-2 py-1 rounded-full',
                          'bg-gray-100 dark:bg-slate-700'
                        )}
                      >
                        {folder.items.length}
                      </span>
                    </div>
                  )}
                </div>

                {/* Folder Actions */}
                <div className='flex items-center gap-1'>
                  <button
                    onClick={() => setEditingFolder(folder.id)}
                    className={cn(themeClass('hover'), 'p-2 rounded-lg transition-colors duration-200')}
                  >
                    <Edit className={cn(themeClass('textSecondary'), 'w-3 h-3')} />
                  </button>
                  <button
                    onClick={() => deleteFolder(folder.id)}
                    className='p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200'
                  >
                    <Trash2 className='w-3 h-3 text-red-500' />
                  </button>
                </div>
              </div>

              {/* Add Stock Search */}
              {folder.isExpanded && (
                <div className='mt-3'>
                  <StockSearch
                    onStockSelect={(stock) => handleAddStock(stock, folder.id)}
                    placeholder={`Add stock to ${folder.name}...`}
                    className='w-full'
                  />
                </div>
              )}
            </div>

            {/* Folder Content */}
            {folder.isExpanded && (
              <div className='divide-y divide-gray-100 dark:divide-slate-700'>
                {folder.items.length === 0 ? (
                  <div className='p-6 text-center'>
                    <div className={cn(themeClass('textSecondary'), 'text-sm font-medium mb-1')}>
                      No stocks in this folder
                    </div>
                    <p className={cn(themeClass('textMuted'), 'text-xs')}>Use the search above to add stocks</p>
                  </div>
                ) : (
                  folder.items.map((item) => {
                    const priceData = getBestPriceData(item.ticker)
                    const isLoading = !priceData
                    const hasError = priceData?.error

                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => handleDragStart(item, folder.id)}
                        onClick={() => onWatchlistItemClick(item)}
                        className={cn(
                          'grid grid-cols-12 gap-3 p-4 cursor-pointer transition-all duration-200 group',
                          'hover:bg-gray-50 dark:hover:bg-slate-700/50',
                          'active:scale-[0.99]'
                        )}
                      >
                        {/* Stock Info */}
                        <div className='col-span-6 flex items-center gap-3 min-w-0'>
                          <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0'>
                            {item.ticker.charAt(0)}
                          </div>
                          <div className='min-w-0 flex-1'>
                            <div className={cn(themeClass('textPrimary'), 'font-semibold text-sm truncate')}>
                              {item.ticker}
                            </div>
                            <div className={cn(themeClass('textSecondary'), 'text-xs truncate')}>{item.company}</div>
                          </div>
                        </div>

                        {/* Price */}
                        <div className='col-span-3 text-center'>
                          {isLoading ? (
                            <Loader2 className='w-4 h-4 animate-spin mx-auto text-gray-400' />
                          ) : hasError ? (
                            <AlertCircle className='w-4 h-4 mx-auto text-red-400' />
                          ) : (
                            <div className={cn(themeClass('textPrimary'), 'text-sm font-mono font-semibold')}>
                              ${priceData.price?.toFixed(2) || '---'}
                            </div>
                          )}
                        </div>

                        {/* Change */}
                        <div className='col-span-2 text-center'>
                          {!isLoading && !hasError && priceData.changePercent !== undefined ? (
                            <div className='flex flex-col items-center'>
                              <div
                                className={cn(
                                  getPriceChangeClass(priceData.changePercent),
                                  'text-xs font-semibold flex items-center gap-1'
                                )}
                              >
                                {priceData.changePercent > 0 ? (
                                  <TrendingUp className='w-3 h-3' />
                                ) : priceData.changePercent < 0 ? (
                                  <TrendingDown className='w-3 h-3' />
                                ) : null}
                                {priceData.changePercent >= 0 ? '+' : ''}
                                {priceData.changePercent.toFixed(2)}%
                              </div>
                            </div>
                          ) : (
                            <span className={cn(themeClass('textMuted'), 'text-xs')}>---</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className='col-span-1 flex justify-end'>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeItemFromFolder(folder.id, item.id)
                            }}
                            className='p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 opacity-0 group-hover:opacity-100'
                          >
                            <Trash2 className='w-3 h-3 text-red-400' />
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        ))}

        {/* Empty State */}
        {folders.length === 0 && (
          <div className={cn(themeClass('card'), 'p-8 text-center')}>
            <div className='w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4'>
              <FolderPlus className={cn(themeClass('textSecondary'), 'w-6 h-6')} />
            </div>
            <h4 className={cn(themeClass('textPrimary'), 'font-semibold mb-2')}>No watchlist folders yet</h4>
            <p className={cn(themeClass('textSecondary'), 'text-sm mb-4')}>
              Create folders to organize your watchlist stocks
            </p>
            <button onClick={() => setShowAddFolder(true)} className={cn(themeClass('buttonPrimary'))}>
              Create Your First Folder
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
