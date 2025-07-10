// Create this file: /src/components/watchlist/StockSearch.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Loader2 } from 'lucide-react'

interface StockSearchResult {
  ticker: string
  company: string
  logo?: string
  exchange?: string
}

interface StockSearchProps {
  onAddStock: (stock: StockSearchResult, folderId: string) => void
  folders: Array<{ id: string; name: string }>
  placeholder?: string
}

export function StockSearch({ onAddStock, folders, placeholder = 'Search stocks...' }: StockSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<StockSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedFolderId, setSelectedFolderId] = useState(folders[0]?.id || '')
  const searchRef = useRef<HTMLDivElement>(null)

  // Search for stocks using existing API
  const searchStocks = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      // Use the existing search-with-details endpoint
      const response = await fetch(`/api/stocks/search-with-details?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (data.results) {
        // Transform the results to match our interface
        const transformedResults = data.results.map((stock: any) => ({
          ticker: stock.symbol,
          company: stock.name,
          logo: stock.logo || '',
          exchange: stock.exchange || '',
        }))
        setResults(transformedResults)
      } else {
        setResults([])
      }
    } catch (error) {
      console.error('Error searching stocks:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchStocks(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAddStock = (stock: StockSearchResult) => {
    onAddStock(stock, selectedFolderId)
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  return (
    <div ref={searchRef} className='relative'>
      <div className='flex gap-2'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-3 w-4 h-4 text-gray-400' />
          <input
            type='text'
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowResults(true)
            }}
            onFocus={() => setShowResults(true)}
            className='w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none'
          />
          {isLoading && <Loader2 className='absolute right-3 top-3 w-4 h-4 text-gray-400 animate-spin' />}
        </div>

        <select
          value={selectedFolderId}
          onChange={(e) => setSelectedFolderId(e.target.value)}
          className='px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none'
        >
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </div>

      {/* Search Results */}
      {showResults && query.length >= 2 && (
        <div className='absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto'>
          {isLoading ? (
            <div className='p-4 text-center text-gray-400'>
              <Loader2 className='w-5 h-5 mx-auto mb-2 animate-spin' />
              Searching...
            </div>
          ) : results.length > 0 ? (
            <>
              {results.map((stock) => (
                <div
                  key={stock.ticker}
                  className='flex items-center justify-between p-3 hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-700 last:border-b-0'
                  onClick={() => handleAddStock(stock)}
                >
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs'>
                      {stock.logo ? (
                        <img src={stock.logo} alt={stock.ticker} className='w-6 h-6 rounded-full object-cover' />
                      ) : (
                        <span>{stock.ticker.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <div className='font-medium text-white'>{stock.ticker}</div>
                      <div className='text-sm text-gray-400 truncate max-w-48'>{stock.company}</div>
                      {stock.exchange && <div className='text-xs text-gray-500'>{stock.exchange}</div>}
                    </div>
                  </div>
                  <Plus className='w-4 h-4 text-gray-400' />
                </div>
              ))}
            </>
          ) : query.length >= 2 && !isLoading ? (
            <div className='p-4 text-center text-gray-400'>No stocks found for "{query}"</div>
          ) : null}
        </div>
      )}
    </div>
  )
}
