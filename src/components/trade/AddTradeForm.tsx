// components/trade/AddTradeForm.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, Calculator } from 'lucide-react'

// Validation schema
const tradeSchema = z.object({
  ticker: z.string().min(1, 'Ticker is required').max(10, 'Ticker too long'),
  action: z.enum(['BUY', 'SELL']),
  shares: z.number().min(1, 'Must be at least 1 share'),
  pricePerShare: z.number().min(0.01, 'Price must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  fee: z.number().min(0, 'Fee cannot be negative').default(0),
})

type TradeFormData = z.infer<typeof tradeSchema>

interface AddTradeFormProps {
  onSubmit: (data: TradeFormData) => void
  onCancel: () => void
}

export function AddTradeForm({ onSubmit, onCancel }: AddTradeFormProps) {
  const [showCalculator, setShowCalculator] = useState(false)

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
      fee: 9.99,
    },
  })

  const watchedValues = watch()
  const totalValue = (watchedValues.shares || 0) * (watchedValues.pricePerShare || 0)
  const totalCost = totalValue + (watchedValues.fee || 0)

  return (
    <div className='space-y-6'>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
        {/* Ticker Search */}
        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-400'>Stock Ticker</label>
          <div className='relative'>
            <Search className='absolute left-3 top-3 w-4 h-4 text-gray-400' />
            <input
              {...register('ticker')}
              type='text'
              placeholder='e.g., AAPL, MSFT, GOOGL'
              className='w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 pl-10 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none uppercase'
              autoComplete='off'
            />
          </div>
          {errors.ticker && <p className='text-sm text-red-400'>{errors.ticker.message}</p>}
        </div>

        {/* Action Toggle */}
        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-400'>Action</label>
          <div className='flex bg-gray-800/50 border border-gray-700 rounded-lg p-1'>
            <button
              type='button'
              onClick={() => setValue('action', 'BUY')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                watchedValues.action === 'BUY' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              BUY
            </button>
            <button
              type='button'
              onClick={() => setValue('action', 'SELL')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                watchedValues.action === 'SELL' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              SELL
            </button>
          </div>
        </div>

        {/* Trade Details Grid */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-400'>Shares</label>
            <input
              {...register('shares', { valueAsNumber: true })}
              type='number'
              placeholder='100'
              min='1'
              className='w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none'
            />
            {errors.shares && <p className='text-sm text-red-400'>{errors.shares.message}</p>}
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-400'>Price per Share</label>
            <input
              {...register('pricePerShare', { valueAsNumber: true })}
              type='number'
              placeholder='185.30'
              step='0.01'
              min='0.01'
              className='w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none'
            />
            {errors.pricePerShare && <p className='text-sm text-red-400'>{errors.pricePerShare.message}</p>}
          </div>
        </div>

        {/* Date */}
        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-400'>Trade Date</label>
          <input
            {...register('date')}
            type='date'
            className='w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none'
          />
          {errors.date && <p className='text-sm text-red-400'>{errors.date.message}</p>}
        </div>

        {/* Trading Fee */}
        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-400'>Trading Fee</label>
          <input
            {...register('fee', { valueAsNumber: true })}
            type='number'
            placeholder='9.99'
            step='0.01'
            min='0'
            className='w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none'
          />
          {errors.fee && <p className='text-sm text-red-400'>{errors.fee.message}</p>}
        </div>

        {/* Trade Summary */}
        <div className='bg-gray-800/50 rounded-xl p-4 border border-gray-700'>
          <div className='flex items-center gap-2 mb-3'>
            <Calculator className='w-4 h-4 text-blue-400' />
            <h4 className='text-white font-medium'>Trade Summary</h4>
          </div>
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-gray-400'>Shares × Price:</span>
              <span className='text-white'>${totalValue.toFixed(2)}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-400'>Trading Fee:</span>
              <span className='text-white'>${(watchedValues.fee || 0).toFixed(2)}</span>
            </div>
            <hr className='border-gray-700' />
            <div className='flex justify-between font-medium'>
              <span className='text-gray-400'>Total {watchedValues.action === 'BUY' ? 'Cost' : 'Received'}:</span>
              <span className='text-white'>${totalCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-3'>
          <button
            type='button'
            onClick={onCancel}
            className='flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors'
          >
            Cancel
          </button>
          <button
            type='submit'
            className='flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors'
          >
            Add Trade
          </button>
        </div>
      </form>
    </div>
  )
}
