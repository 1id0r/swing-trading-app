'use client'

import React, { useState, useEffect } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calculator, Calendar, DollarSign, Hash, TrendingUp, TrendingDown } from 'lucide-react'
import { StockAutocomplete } from './StockAutocomplete'
import { StockSearchResult } from '@/lib/stockApi'

// Zod validation schema
const tradeSchema = z.object({
  ticker: z.string().min(1, 'Stock ticker is required'),
  action: z.enum(['BUY', 'SELL'], { required_error: 'Please select an action' }),
  shares: z.number().min(1, 'Shares must be at least 1'),
  pricePerShare: z.number().min(0.01, 'Price must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  fee: z.number().min(0, 'Fee cannot be negative').default(0),
})

type TradeFormData = z.infer<typeof tradeSchema>

interface AddTradeFormProps {
  onSubmit: (data: TradeFormData & { company: string; logo?: string; currency: string }) => void
  onCancel: () => void
  defaultCommission?: number
}

export function AddTradeForm({ onSubmit, onCancel, defaultCommission = 9.99 }: AddTradeFormProps) {
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      action: 'BUY',
      date: new Date().toISOString().split('T')[0],
      fee: defaultCommission,
    },
  })

  const watchedValues = watch()

  // Safe calculations with fallbacks
  const shares = watchedValues.shares || 0
  const pricePerShare = watchedValues.pricePerShare || 0
  const fee = watchedValues.fee || 0
  const totalValue = shares * pricePerShare
  const totalCost = watchedValues.action === 'BUY' ? totalValue + fee : totalValue - fee

  // Handle stock selection
  const handleStockSelect = (stock: StockSearchResult) => {
    setSelectedStock(stock)
    setValue('ticker', stock.ticker)
    setValue('pricePerShare', stock.currentPrice)
  }

  // Handle form submission
  const onFormSubmit: SubmitHandler<TradeFormData> = (data) => {
    if (!selectedStock) return

    onSubmit({
      ...data,
      company: selectedStock.name,
      logo: selectedStock.logo,
      currency: selectedStock.currency,
    })
  }

  return (
    <div className='theme-bg-gradient min-h-screen theme-text-primary'>
      <form onSubmit={handleSubmit(onFormSubmit)} className='space-y-6 p-6'>
        {/* Header */}
        <div className='futuristic-header !rounded-3xl !margin-0'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold theme-text-primary mb-2'>Add Trade</h1>
            <p className='theme-text-secondary text-sm opacity-80'>Search for a stock and enter your trade details</p>
          </div>
        </div>

        {/* Stock Search */}
        <div className='theme-card p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='p-2 rounded-xl bg-blue-500/10'>
              <TrendingUp className='w-5 h-5 text-blue-400' />
            </div>
            <h3 className='futuristic-section-title !mb-0'>Stock Selection</h3>
          </div>

          <div className='space-y-3'>
            <label className='text-sm font-semibold theme-text-primary block'>Search Stock</label>
            <StockAutocomplete onSelect={handleStockSelect} placeholder='Type ticker or company name...' />
            {errors.ticker && <p className='text-sm text-red-400 font-medium'>{errors.ticker.message}</p>}
          </div>
        </div>

        {/* Trade Action */}
        <div className='theme-card p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='p-2 rounded-xl bg-blue-500/10'>
              <TrendingUp className='w-5 h-5 text-blue-400' />
            </div>
            <h3 className='futuristic-section-title !mb-0'>Trade Action</h3>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <button
              type='button'
              onClick={() => setValue('action', 'BUY')}
              className={`futuristic-action-button ${watchedValues.action === 'BUY' ? 'buy-active' : ''}`}
            >
              <TrendingUp className='w-5 h-5 mb-1' />
              <span className='font-semibold'>BUY</span>
            </button>

            <button
              type='button'
              onClick={() => setValue('action', 'SELL')}
              className={`futuristic-action-button ${watchedValues.action === 'SELL' ? 'sell-active' : ''}`}
            >
              <TrendingDown className='w-5 h-5 mb-1' />
              <span className='font-semibold'>SELL</span>
            </button>
          </div>
        </div>

        {/* Trade Details */}
        <div className='theme-card p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='p-2 rounded-xl bg-blue-500/10'>
              <Calculator className='w-5 h-5 text-blue-400' />
            </div>
            <h3 className='futuristic-section-title !mb-0'>Trade Details</h3>
          </div>

          <div className='grid grid-cols-2 gap-4 mb-6'>
            {/* Shares */}
            <div className='space-y-3'>
              <label className='text-sm font-semibold theme-text-primary'>Shares</label>
              <div className='relative'>
                <Hash className='absolute left-4 top-4 w-4 h-4 theme-text-secondary opacity-60' />
                <input
                  {...register('shares', {
                    valueAsNumber: true,
                    setValueAs: (value) => (value === '' ? undefined : Number(value)),
                  })}
                  type='number'
                  placeholder='100'
                  min='1'
                  className='theme-input w-full pl-12'
                />
              </div>
              {errors.shares && <p className='text-sm text-red-400 font-medium'>{errors.shares.message}</p>}
            </div>

            {/* Price per Share */}
            <div className='space-y-3'>
              <label className='text-sm font-semibold theme-text-primary'>Price per Share</label>
              <div className='relative'>
                <DollarSign className='absolute left-4 top-4 w-4 h-4 theme-text-secondary opacity-60' />
                <input
                  {...register('pricePerShare', {
                    valueAsNumber: true,
                    setValueAs: (value) => (value === '' ? undefined : Number(value)),
                  })}
                  type='number'
                  placeholder='185.30'
                  step='0.01'
                  min='0.01'
                  className='theme-input w-full pl-12'
                />
              </div>
              {errors.pricePerShare && (
                <p className='text-sm text-red-400 font-medium'>{errors.pricePerShare.message}</p>
              )}
            </div>
          </div>

          {/* Date */}
          <div className='space-y-3 mb-6'>
            <label className='text-sm font-semibold theme-text-primary'>Trade Date</label>
            <div className='relative'>
              <Calendar className='absolute left-4 top-4 w-4 h-4 theme-text-secondary opacity-60' />
              <input {...register('date')} type='date' className='theme-input w-full pl-12' />
            </div>
            {errors.date && <p className='text-sm text-red-400 font-medium'>{errors.date.message}</p>}
          </div>

          {/* Commission Fee */}
          <div className='space-y-3'>
            <label className='text-sm font-semibold theme-text-primary'>Commission</label>
            <div className='relative'>
              <DollarSign className='absolute left-4 top-4 w-4 h-4 theme-text-secondary opacity-60' />
              <input
                {...register('fee', {
                  valueAsNumber: true,
                  setValueAs: (value) => (value === '' ? 0 : Number(value)),
                })}
                type='number'
                placeholder='9.99'
                step='0.01'
                min='0'
                className='theme-input w-full pl-12'
              />
            </div>
            {errors.fee && <p className='text-sm text-red-400 font-medium'>{errors.fee.message}</p>}
          </div>
        </div>

        {/* Trade Summary */}
        {selectedStock && shares > 0 && pricePerShare > 0 && (
          <div className='theme-card p-6 !border-blue-500/30 !bg-blue-500/5'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='p-2 rounded-xl bg-blue-500/20'>
                <Calculator className='w-5 h-5 text-blue-400' />
              </div>
              <h4 className='text-lg font-bold theme-text-primary'>Trade Summary</h4>
            </div>

            <div className='space-y-3'>
              <div className='flex justify-between items-center py-2'>
                <span className='theme-text-secondary'>
                  {shares.toLocaleString()} × ${pricePerShare.toFixed(2)}
                </span>
                <span className='theme-text-primary font-semibold'>${totalValue.toFixed(2)}</span>
              </div>

              <div className='flex justify-between items-center py-2'>
                <span className='theme-text-secondary'>Commission</span>
                <span className='theme-text-primary font-semibold'>${fee.toFixed(2)}</span>
              </div>

              <div className='border-t theme-border pt-3'>
                <div className='flex justify-between items-center'>
                  <span className='text-lg font-bold theme-text-primary'>
                    Total {watchedValues.action === 'BUY' ? 'Cost' : 'Received'}
                  </span>
                  <span className='text-xl font-bold text-blue-400'>${totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex gap-4 pt-4'>
          <button type='button' onClick={onCancel} className='theme-button-secondary flex-1 !py-4'>
            Cancel
          </button>

          <button
            type='submit'
            disabled={!selectedStock || shares <= 0 || pricePerShare <= 0}
            className='theme-button-primary flex-1 !py-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none'
          >
            Add {watchedValues.action} Trade
          </button>
        </div>
      </form>
    </div>
  )
}
