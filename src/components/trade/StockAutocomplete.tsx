// components/trade/StockAutocomplete.tsx (Fixed TypeScript Issues)
'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
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
  placeholder = 'Search stocks (e.g., AAPL, MSFT)',
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

  // Debounced search
  useEffect(() => {
    if (query.length < 1) {
      setOptions([])
      setIsOpen(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      try {
        const results = await stockApi.searchWithDetails(query)
        setOptions(results)
        setIsOpen(results.length > 0)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Search error:', error)
        setOptions([])
        setIsOpen(false)
      } finally {
        setIsLoading(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [query])

  // Keyboard navigation
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
    setTimeout(() => setIsOpen(false), 150)
  }

  return (
    <div className='relative'>
      <div className='relative'>
        <Search className='absolute left-3 top-3 w-4 h-4 theme-text-secondary  ' />
        <input
          ref={inputRef}
          type='text'
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full theme-card border rounded-lg p-3 pl-10 pr-10 theme-text-primary   placeholder-gray-400 focus:border-blue-500 focus:outline-none uppercase ${
            error ? 'border-red-500' : 'border-gray-700'
          }`}
          autoComplete='off'
        />
        {isLoading && <Loader2 className='absolute right-3 top-3 w-4 h-4 theme-text-secondary   animate-spin' />}
      </div>

      {error && <p className='text-sm text-red-400 mt-1'>{error}</p>}

      {/* Dropdown Options */}
      {isOpen && (
        <div
          ref={optionsRef}
          className='absolute top-full left-0 right-0 mt-1 bg-gray-800    rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto'
        >
          {options.length === 0 && !isLoading && (
            <div className='p-4 text-center theme-text-secondary  '>No stocks found for "{query}"</div>
          )}

          {options.map((stock, index) => (
            <button
              key={stock.symbol}
              onClick={() => handleSelect(stock)}
              className={`w-full p-3 text-left hover:bg-gray-700/50 transition-colors border-b border-gray-700 last:border-b-0 ${
                index === selectedIndex ? 'bg-gray-700/50' : ''
              }`}
            >
              <div className='flex items-center gap-3'>
                {/* Company Logo */}
                <div className='w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0'>
                  {stock.logo ? (
                    <img
                      src={stock.logo}
                      alt={stock.symbol}
                      className='w-8 h-8 rounded-full object-cover'
                      onError={(e) => {
                        // Fixed: Properly typed event target
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
                    className={`theme-text-primary   font-bold text-sm ${stock.logo ? 'hidden' : 'flex'}`}
                    style={{ display: stock.logo ? 'none' : 'flex' }}
                  >
                    {stock.symbol.charAt(0)}
                  </span>
                </div>

                {/* Stock Info */}
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2'>
                    <span className='theme-text-primary   font-medium'>{stock.symbol}</span>
                    <span className='theme-text-secondary   truncate text-sm'>{stock.name}</span>
                  </div>

                  <div className='flex items-center gap-2 mt-1'>
                    <span className='theme-text-primary   font-medium'>${stock.currentPrice.toFixed(2)}</span>
                    {stock.change !== 0 && (
                      <div
                        className={`flex items-center gap-1 text-xs ${
                          stock.change > 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {stock.change > 0 ? <TrendingUp className='w-3 h-3' /> : <TrendingDown className='w-3 h-3' />}
                        <span>
                          {stock.change > 0 ? '+' : ''}
                          {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
