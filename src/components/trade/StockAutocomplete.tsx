'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, TrendingUp, TrendingDown, Loader2, Sparkles } from 'lucide-react'
import { stockApi } from '@/lib/stockApi'

interface StockOption {
  symbol: string
  name: string
  logo: string
  currentPrice: number
  currency: string
  change: number
  changePercent: number
}

interface StockAutocompleteProps {
  onSelect: (stock: StockOption) => void
  placeholder?: string
  value?: string
  error?: string
}

export function StockAutocomplete({
  onSelect,
  placeholder = 'Search stocks (e.g., AAPL, MSFT, IBIT)',
  value = '',
  error,
}: StockAutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [options, setOptions] = useState<StockOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const optionsRef = useRef<HTMLDivElement>(null)
  const selectedOptionRef = useRef<HTMLButtonElement>(null)

  // Debounced search with better error handling
  useEffect(() => {
    if (query.length < 1) {
      setOptions([])
      setIsOpen(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      console.log('🔍 Searching for:', query) // Debug log

      try {
        const results = await stockApi.searchWithDetails(query)
        console.log('📊 Search results:', results) // Debug log
        console.log('📊 Found', results.length, 'results for', query) // Debug log

        setOptions(results)
        setIsOpen(results.length > 0)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('❌ Search error:', error)
        setOptions([])
        setIsOpen(false)
      } finally {
        setIsLoading(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [query])

  // Auto-scroll to selected option
  useEffect(() => {
    if (selectedIndex >= 0 && selectedOptionRef.current) {
      selectedOptionRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
    }
  }, [selectedIndex])

  // Enhanced keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && options[selectedIndex]) {
          handleSelect(options[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleSelect = (stock: StockOption) => {
    console.log('🎯 Selected stock:', stock) // Debug log
    setQuery(stock.symbol)
    setIsOpen(false)
    setSelectedIndex(-1)
    onSelect(stock)
    inputRef.current?.blur()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase()
    setQuery(newValue)
  }

  const handleFocus = () => {
    if (options.length > 0) {
      setIsOpen(true)
    }
  }

  const handleBlur = () => {
    // Delay to allow clicking on options
    setTimeout(() => setIsOpen(false), 200)
  }

  return (
    <div className='relative w-full'>
      <div className='relative'>
        <Search className='absolute left-4 top-4 w-4 h-4 theme-text-secondary' />
        <input
          ref={inputRef}
          type='text'
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`theme-input w-full pl-12 pr-12 uppercase text-lg font-medium ${error ? 'border-red-500' : ''}`}
          autoComplete='off'
        />
        {isLoading && <Loader2 className='absolute right-4 top-4 w-4 h-4 theme-text-secondary animate-spin' />}
      </div>

      {error && <p className='text-sm text-red-400 mt-1'>{error}</p>}

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className='text-xs text-gray-500 mt-1'>
          Debug: Query="{query}" | Results={options.length} | Loading={isLoading ? 'Yes' : 'No'} | Open=
          {isOpen ? 'Yes' : 'No'}
        </div>
      )}

      {/* Enhanced Dropdown Options with Better Scrolling */}
      {isOpen && (
        <div
          ref={optionsRef}
          className='absolute top-full left-0 right-0 mt-2 theme-card border-2 border-blue-500/20 backdrop-blur-xl z-[9999]'
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.1)',
            maxHeight: '320px', // Increased height for better visibility
          }}
        >
          {/* Header with glow effect */}
          <div className='p-3 border-b border-gray-700/50 bg-gradient-to-r from-blue-500/10 to-purple-500/10'>
            <div className='flex items-center gap-2 text-sm font-medium theme-text-primary'>
              <Sparkles className='w-4 h-4 text-blue-400' />
              Search Results ({options.length} found)
            </div>
          </div>

          {/* Scrollable Results Container */}
          <div
            className='overflow-y-auto overflow-x-hidden'
            style={{
              maxHeight: '280px', // Content area height
              scrollBehavior: 'smooth',
            }}
          >
            {options.length === 0 && !isLoading && (
              <div className='p-6 text-center'>
                <div className='theme-text-secondary text-sm'>No stocks found for "{query}"</div>
                <div className='text-xs theme-text-secondary opacity-60 mt-1'>
                  Try searching with a ticker symbol like IBIT, AAPL, or MSFT
                </div>
              </div>
            )}

            {options.map((stock, index) => (
              <button
                key={`${stock.symbol}-${index}`}
                ref={index === selectedIndex ? selectedOptionRef : null}
                onClick={() => handleSelect(stock)}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setSelectedIndex(index)} // Highlight on hover
                className={`w-full p-3 text-left transition-all duration-200 border-b border-gray-700/30 last:border-b-0 group ${
                  index === selectedIndex
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30'
                    : 'hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10'
                }`}
              >
                <div className='flex items-center gap-3'>
                  {/* Company Logo/Avatar */}
                  <div className='relative'>
                    <div className='w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md'>
                      {stock.logo ? (
                        <img
                          src={stock.logo}
                          alt={stock.symbol}
                          className='w-7 h-7 rounded-md object-cover'
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement
                            target.style.display = 'none'
                            const sibling = target.nextElementSibling as HTMLElement
                            if (sibling) {
                              sibling.style.display = 'flex'
                            }
                          }}
                        />
                      ) : null}
                      <span
                        className={`theme-text-primary font-bold text-xs ${stock.logo ? 'hidden' : 'flex'}`}
                        style={{ display: stock.logo ? 'none' : 'flex' }}
                      >
                        {stock.symbol.charAt(0)}
                      </span>
                    </div>
                    {/* Glow effect on hover */}
                    <div className='absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200'></div>
                  </div>

                  {/* Stock Info */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <span className='theme-text-primary font-bold text-base'>{stock.symbol}</span>
                      <span className='theme-text-secondary truncate text-xs font-medium'>{stock.name}</span>
                    </div>

                    <div className='flex items-center gap-2'>
                      <span className='theme-text-primary font-semibold text-sm'>
                        ${stock.currentPrice ? stock.currentPrice.toFixed(2) : 'N/A'}
                      </span>
                      {stock.change !== 0 && (
                        <div
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                            stock.change > 0
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {stock.change > 0 ? (
                            <TrendingUp className='w-2.5 h-2.5' />
                          ) : (
                            <TrendingDown className='w-2.5 h-2.5' />
                          )}
                          <span className='text-xs'>
                            {stock.change > 0 ? '+' : ''}
                            {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selection indicator */}
                  {index === selectedIndex && (
                    <div className='w-2 h-8 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full shadow-lg'></div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Custom Scrollbar Styles */}
          <style jsx>{`
            .overflow-y-auto::-webkit-scrollbar {
              width: 6px;
            }
            .overflow-y-auto::-webkit-scrollbar-track {
              background: rgba(55, 65, 81, 0.5);
              border-radius: 3px;
            }
            .overflow-y-auto::-webkit-scrollbar-thumb {
              background: rgba(59, 130, 246, 0.6);
              border-radius: 3px;
            }
            .overflow-y-auto::-webkit-scrollbar-thumb:hover {
              background: rgba(59, 130, 246, 0.8);
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
