// components/trade/AddTradeForm.tsx (Final Fix for Undefined Values)
'use client'

import { useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calculator, Building2 } from 'lucide-react'
import { StockAutocomplete } from './StockAutocomplete'

// Updated validation schema - all fields optional initially, validated on submit
const tradeSchema = z
  .object({
    ticker: z.string().min(1, 'Please select a stock'),
    action: z.enum(['BUY', 'SELL']),
    shares: z.number().min(1, 'Must be at least 1 share').optional(),
    pricePerShare: z.number().min(0.01, 'Price must be greater than 0').optional(),
    date: z.string().min(1, 'Date is required'),
    fee: z.number().min(0, 'Fee cannot be negative').optional(),
  })
  .refine(
    (data) => {
      return data.shares !== undefined && data.shares > 0
    },
    {
      message: 'Shares is required',
      path: ['shares'],
    }
  )
  .refine(
    (data) => {
      return data.pricePerShare !== undefined && data.pricePerShare > 0
    },
    {
      message: 'Price per share is required',
      path: ['pricePerShare'],
    }
  )

type TradeFormData = z.infer<typeof tradeSchema>

interface SelectedStock {
  symbol: string
  name: string
  logo: string
  currentPrice: number
  currency: string
  change: number
  changePercent: number
}

interface AddTradeFormProps {
  onSubmit: (data: {
    ticker: string
    action: 'BUY' | 'SELL'
    shares: number
    pricePerShare: number
    date: string
    fee: number
    company: string
    currency: string
    logo: string
  }) => void
  onCancel: () => void
  defaultCommission?: number
}

export function AddTradeForm({ onSubmit, onCancel, defaultCommission = 9.99 }: AddTradeFormProps) {
  const [selectedStock, setSelectedStock] = useState<SelectedStock | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    clearErrors,
  } = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      action: 'BUY',
      date: new Date().toISOString().split('T')[0],
      fee: defaultCommission,
      ticker: '',
      shares: undefined,
      pricePerShare: undefined,
    },
  })

  const watchedValues = watch()

  // Safe calculations with fallbacks
  const shares = watchedValues.shares || 0
  const pricePerShare = watchedValues.pricePerShare || 0
  const fee = watchedValues.fee || 0

  const totalValue = shares * pricePerShare
  const totalCost = totalValue + fee

  const handleStockSelect = (stock: SelectedStock) => {
    setSelectedStock(stock)
    setValue('ticker', stock.symbol)
    setValue('pricePerShare', stock.currentPrice)
    clearErrors('ticker')
  }

  const handleFormSubmit: SubmitHandler<TradeFormData> = (data) => {
    if (!selectedStock) {
      return
    }

    // Ensure all required fields have values
    const submissionData = {
      ticker: data.ticker,
      action: data.action,
      shares: data.shares || 0,
      pricePerShare: data.pricePerShare || 0,
      date: data.date,
      fee: data.fee || 0,
      company: selectedStock.name,
      currency: selectedStock.currency,
      logo: selectedStock.logo,
    }

    onSubmit(submissionData)
  }

  return (
    <div className='space-y-6'>
      <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-4'>
        {/* Stock Search with Autocomplete */}
        <div className='space-y-2'>
          <label className='text-sm font-medium theme-text-secondary  '>Stock</label>
          <StockAutocomplete
            onSelect={handleStockSelect}
            value={watchedValues.ticker || ''}
            error={errors.ticker?.message}
          />
        </div>

        {/* Selected Stock Display */}
        {selectedStock && (
          <div className='theme-card rounded-lg p-3   '>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0'>
                {selectedStock.logo ? (
                  <img
                    src={selectedStock.logo}
                    alt={selectedStock.symbol}
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
                  className={`theme-text-primary   font-bold text-sm ${selectedStock.logo ? 'hidden' : 'flex'}`}
                  style={{ display: selectedStock.logo ? 'none' : 'flex' }}
                >
                  {selectedStock.symbol.charAt(0)}
                </span>
              </div>

              <div className='flex-1'>
                <div className='flex items-center gap-2'>
                  <span className='theme-text-primary   font-medium'>{selectedStock.symbol}</span>
                  <Building2 className='w-3 h-3 theme-text-secondary  ' />
                </div>
                <div className='text-sm theme-text-secondary   truncate'>{selectedStock.name}</div>
              </div>

              <div className='text-right'>
                <div className='theme-text-primary   font-medium'>${selectedStock.currentPrice.toFixed(2)}</div>
                <div className={`text-xs ${selectedStock.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedStock.change > 0 ? '+' : ''}
                  {selectedStock.changePercent.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Toggle */}
        <div className='space-y-2'>
          <label className='text-sm font-medium theme-text-secondary  '>Action</label>
          <div className='flex theme-card    rounded-lg p-1'>
            <button
              type='button'
              onClick={() => setValue('action', 'BUY')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                watchedValues.action === 'BUY'
                  ? 'bg-green-600 theme-text-primary  '
                  : 'theme-text-secondary   hover:theme-text-primary  '
              }`}
            >
              BUY
            </button>
            <button
              type='button'
              onClick={() => setValue('action', 'SELL')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                watchedValues.action === 'SELL'
                  ? 'bg-red-600 theme-text-primary  '
                  : 'theme-text-secondary   hover:theme-text-primary  '
              }`}
            >
              SELL
            </button>
          </div>
        </div>

        {/* Trade Details Grid */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium theme-text-secondary  '>Shares</label>
            <input
              {...register('shares', {
                valueAsNumber: true,
                setValueAs: (value) => (value === '' ? undefined : Number(value)),
              })}
              type='number'
              placeholder='100'
              min='1'
              className='w-full theme-card    rounded-lg p-3 theme-text-primary   placeholder-gray-400 focus:border-blue-500 focus:outline-none'
            />
            {errors.shares && <p className='text-sm text-red-400'>{errors.shares.message}</p>}
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium theme-text-secondary  '>Price per Share</label>
            <input
              {...register('pricePerShare', {
                valueAsNumber: true,
                setValueAs: (value) => (value === '' ? undefined : Number(value)),
              })}
              type='number'
              placeholder='185.30'
              step='0.01'
              min='0.01'
              className='w-full theme-card    rounded-lg p-3 theme-text-primary   placeholder-gray-400 focus:border-blue-500 focus:outline-none'
            />
            {errors.pricePerShare && <p className='text-sm text-red-400'>{errors.pricePerShare.message}</p>}
          </div>
        </div>

        {/* Date */}
        <div className='space-y-2'>
          <label className='text-sm font-medium theme-text-secondary  '>Trade Date</label>
          <input
            {...register('date')}
            type='date'
            className='w-full theme-card    rounded-lg p-3 theme-text-primary   focus:border-blue-500 focus:outline-none'
          />
          {errors.date && <p className='text-sm text-red-400'>{errors.date.message}</p>}
        </div>

        {/* Commission Fee */}
        <div className='space-y-2'>
          <label className='text-sm font-medium theme-text-secondary  '>Commission</label>
          <input
            {...register('fee', {
              valueAsNumber: true,
              setValueAs: (value) => (value === '' ? defaultCommission : Number(value)),
            })}
            type='number'
            placeholder='9.99'
            step='0.01'
            min='0'
            className='w-full theme-card    rounded-lg p-3 theme-text-primary   placeholder-gray-400 focus:border-blue-500 focus:outline-none'
          />
          {errors.fee && <p className='text-sm text-red-400'>{errors.fee.message}</p>}
        </div>

        {/* Trade Summary - Only show if we have valid numbers */}
        {selectedStock && shares > 0 && pricePerShare > 0 && (
          <div className='theme-card   p-4   '>
            <div className='flex items-center gap-2 mb-3'>
              <Calculator className='w-4 h-4 text-blue-400' />
              <h4 className='theme-text-primary   font-medium'>Trade Summary</h4>
            </div>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='theme-text-secondary  '>
                  {shares.toLocaleString()} × ${pricePerShare.toFixed(2)}:
                </span>
                <span className='theme-text-primary  '>${totalValue.toFixed(2)}</span>
              </div>
              <div className='flex justify-between'>
                <span className='theme-text-secondary  '>Commission:</span>
                <span className='theme-text-primary  '>${fee.toFixed(2)}</span>
              </div>
              <hr className='border-gray-700' />
              <div className='flex justify-between font-medium'>
                <span className='theme-text-secondary  '>
                  Total {watchedValues.action === 'BUY' ? 'Cost' : 'Received'}:
                </span>
                <span className='theme-text-primary  '>${totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex gap-3'>
          <button
            type='button'
            onClick={onCancel}
            className='flex-1 bg-gray-700 hover:bg-gray-600 theme-text-primary   py-3 rounded-lg font-medium transition-colors'
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={!selectedStock || shares <= 0 || pricePerShare <= 0}
            className='flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed theme-text-primary   py-3 rounded-lg font-medium transition-colors'
          >
            Add Trade
          </button>
        </div>
      </form>
    </div>
  )
}
