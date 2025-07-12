// Debug version of AddTradeForm with extensive logging
'use client'

import React, { useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calculator, Calendar, DollarSign, Hash, TrendingUp, TrendingDown } from 'lucide-react'
import { StockAutocomplete } from './StockAutocomplete'

interface StockOption {
  symbol: string
  name: string
  logo?: string
  currentPrice?: number
  currency?: string
  change?: number
  changePercent?: number
}

// Updated Zod schema with proper validation
const tradeSchema = z.object({
  ticker: z.string().min(1, 'Ticker is required'),
  company: z.string().min(1, 'Company name is required'),
  action: z.enum(['BUY', 'SELL']),
  shares: z.number().min(0.0001, 'Shares must be at least 0.0001').max(1000000, 'Shares cannot exceed 1,000,000'),
  pricePerShare: z.number().min(0.01, 'Price must be greater than 0'),
  fee: z.number().min(0, 'Fee cannot be negative').optional().default(0),
  date: z.string().min(1, 'Date is required'),
})

type TradeFormData = z.infer<typeof tradeSchema>

interface AddTradeFormProps {
  onSubmit: (data: TradeFormData & { company: string; logo?: string; currency: string }) => void
  onCancel: () => void
  defaultCommission?: number
}

export function AddTradeForm({ onSubmit, onCancel, defaultCommission = 9.99 }: AddTradeFormProps) {
  const [selectedStock, setSelectedStock] = useState<StockOption | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid, isSubmitting: formSubmitting },
  } = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    mode: 'onChange', // Enable real-time validation
    defaultValues: {
      action: 'BUY',
      date: new Date().toISOString().split('T')[0],
      fee: defaultCommission,
    },
  })

  const watchedValues = watch()

  // Debug: Log form state
  console.log('🔍 Form Debug:', {
    isValid,
    errors,
    selectedStock,
    watchedValues,
    formSubmitting,
    isSubmitting,
  })

  // Safe calculations with fallbacks
  const shares = watchedValues.shares || 0
  const pricePerShare = watchedValues.pricePerShare || 0
  const fee = watchedValues.fee || 0
  const totalValue = shares * pricePerShare
  const totalCost = watchedValues.action === 'BUY' ? totalValue + fee : totalValue - fee

  // Handle stock selection
  const handleStockSelect = (stock: StockOption) => {
    console.log('🎯 Stock selected:', stock)
    setSelectedStock(stock)
    setValue('ticker', stock.symbol, { shouldValidate: true })
    setValue('company', stock.name, { shouldValidate: true })

    if (stock.currentPrice && stock.currentPrice > 0) {
      setValue('pricePerShare', stock.currentPrice, { shouldValidate: true })
    }

    trigger(['ticker', 'company'])
  }

  // Handle form submission with extensive debugging
  const onFormSubmit: SubmitHandler<TradeFormData> = async (data) => {
    console.log('🚀 Form submission started')
    console.log('📋 Form data:', data)
    console.log('📈 Selected stock:', selectedStock)

    // Validate that we have a selected stock
    if (!selectedStock) {
      console.error('❌ No stock selected')
      alert('Please select a stock first!')
      return
    }

    setIsSubmitting(true)

    try {
      console.log('📤 Calling onSubmit with data:', {
        ...data,
        company: selectedStock.name,
        logo: selectedStock.logo,
        currency: selectedStock.currency || 'USD',
      })

      await onSubmit({
        ...data,
        company: selectedStock.name,
        logo: selectedStock.logo,
        currency: selectedStock.currency || 'USD',
      })

      console.log('✅ onSubmit completed successfully')
    } catch (error) {
      console.error('❌ onSubmit failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Debug button click
  const handleSubmitClick = (e: React.MouseEvent) => {
    console.log('🖱️ Submit button clicked')
    console.log('🔍 Button disabled?', !selectedStock || isSubmitting || formSubmitting)
    console.log('🔍 Form errors:', errors)
    console.log('🔍 Form valid?', isValid)
  }

  return (
    <div className='theme-bg-gradient min-h-screen theme-text-primary relative'>
      <div className='max-w-md mx-auto'>
        {/* Debug Panel - Remove in production */}
        <div className='mx-4 mt-2 p-2 bg-gray-800 rounded text-xs'>
          <p>
            Debug: Valid={isValid ? '✅' : '❌'} | Stock={selectedStock ? '✅' : '❌'} | Errors=
            {Object.keys(errors).length}
          </p>
          {Object.keys(errors).length > 0 && <p className='text-red-400'>Errors: {Object.keys(errors).join(', ')}</p>}
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className='space-y-6'>
          {/* Header */}
          <div className='futuristic-header !rounded-3xl !margin-0 mx-4 mt-6'>
            <div className='text-center'>
              <h1 className='text-2xl font-bold theme-text-primary mb-2'>Add Trade</h1>
              <p className='theme-text-secondary text-sm opacity-80'>Enter your complete trade details below</p>
            </div>
          </div>

          {/* Trade Form */}
          <div className='theme-card mx-4 p-6 relative overflow-visible'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='p-2 rounded-xl bg-blue-500/10'>
                <Calculator className='w-5 h-5 text-blue-400' />
              </div>
              <h3 className='futuristic-section-title !mb-0'>Trade Details</h3>
            </div>

            <div className='space-y-6'>
              {/* Stock Search */}
              <div className='space-y-3 relative'>
                <label className='text-sm font-semibold theme-text-primary block'>Search Stock</label>
                <div className='relative z-50'>
                  <StockAutocomplete
                    onSelect={handleStockSelect}
                    placeholder='Type ticker or company name...'
                    error={errors.ticker?.message}
                  />
                </div>

                {/* Hidden inputs for validation */}
                <input {...register('ticker')} type='hidden' />
                <input {...register('company')} type='hidden' />

                {errors.ticker && <p className='text-sm text-red-400 font-medium'>{errors.ticker.message}</p>}

                {selectedStock && (
                  <div className='p-3 bg-green-500/10 border border-green-500/20 rounded-lg'>
                    <p className='text-green-400 text-sm font-medium'>
                      ✅ Selected: {selectedStock.symbol} - {selectedStock.name}
                    </p>
                  </div>
                )}
              </div>

              {/* Trade Action */}
              <div className='space-y-3'>
                <label className='text-sm font-semibold theme-text-primary block'>Action</label>
                <div className='grid grid-cols-2 gap-3'>
                  <button
                    type='button'
                    onClick={() => {
                      console.log('🔄 Setting action to BUY')
                      setValue('action', 'BUY', { shouldValidate: true })
                    }}
                    className={`futuristic-action-button ${watchedValues.action === 'BUY' ? 'buy-active' : ''}`}
                  >
                    <TrendingUp className='w-5 h-5 mb-1' />
                    <span className='font-semibold'>BUY</span>
                  </button>

                  <button
                    type='button'
                    onClick={() => {
                      console.log('🔄 Setting action to SELL')
                      setValue('action', 'SELL', { shouldValidate: true })
                    }}
                    className={`futuristic-action-button ${watchedValues.action === 'SELL' ? 'sell-active' : ''}`}
                  >
                    <TrendingDown className='w-5 h-5 mb-1' />
                    <span className='font-semibold'>SELL</span>
                  </button>
                </div>
              </div>

              {/* Inputs Grid */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
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
                      step='0.0001'
                      min='0.0001'
                      placeholder='3.4'
                      className='theme-input w-full pl-12'
                      onChange={(e) => {
                        console.log('📊 Shares changed:', e.target.value)
                      }}
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
                      onChange={(e) => {
                        console.log('💰 Price changed:', e.target.value)
                      }}
                    />
                  </div>
                  {errors.pricePerShare && (
                    <p className='text-sm text-red-400 font-medium'>{errors.pricePerShare.message}</p>
                  )}
                </div>

                {/* Date */}
                <div className='space-y-3'>
                  <label className='text-sm font-semibold theme-text-primary'>Trade Date</label>
                  <div className='relative'>
                    <Calendar className='absolute left-4 top-4 w-4 h-4 theme-text-secondary opacity-60' />
                    <input
                      {...register('date')}
                      type='date'
                      className='theme-input w-full pl-12'
                      onChange={(e) => {
                        console.log('📅 Date changed:', e.target.value)
                      }}
                    />
                  </div>
                  {errors.date && <p className='text-sm text-red-400 font-medium'>{errors.date.message}</p>}
                </div>

                {/* Fee */}
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
              <div className='futuristic-trade-summary p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20'>
                <h4 className='text-sm font-semibold theme-text-primary mb-3'>Trade Summary</h4>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <span className='theme-text-secondary'>Total Value:</span>
                    <span className='theme-text-primary font-medium ml-2'>${totalValue.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className='theme-text-secondary'>Total Cost:</span>
                    <span className='theme-text-primary font-medium ml-2'>${totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex gap-4 pt-4'>
                <button
                  type='button'
                  onClick={() => {
                    console.log('❌ Cancel clicked')
                    onCancel()
                  }}
                  className='theme-button-secondary flex-1 !py-4 font-semibold'
                >
                  Cancel
                </button>

                <button
                  type='submit'
                  onClick={handleSubmitClick}
                  className={`theme-button-primary flex-1 !py-4 font-semibold ${
                    !selectedStock || isSubmitting || formSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={!selectedStock || isSubmitting || formSubmitting}
                >
                  {isSubmitting || formSubmitting ? 'Adding...' : 'Add Trade'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
