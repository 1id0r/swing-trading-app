// app/add-trade/page.tsx (Updated for Database)
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { AddTradeForm } from '@/components/trade/AddTradeForm'
import { useTradeStore } from '@/stores/useTradeStore'

export default function AddTradePage() {
  const router = useRouter()
  const { addTrade, isLoading } = useTradeStore()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: any) => {
    try {
      setError(null)

      // Prepare trade data for API
      const tradeData = {
        ticker: data.ticker,
        company: data.company,
        logo: data.logo || '',
        action: data.action,
        shares: data.shares,
        pricePerShare: data.pricePerShare,
        fee: data.fee || 0,
        currency: data.currency,
        date: data.date,
      }

      await addTrade(tradeData)

      // Show success and navigate back
      router.push('/dashboard')
    } catch (error) {
      console.error('Error adding trade:', error)
      setError(error instanceof Error ? error.message : 'Failed to add trade')
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <MobileLayout title='Add Trade' showBackButton onBackClick={handleCancel}>
      <div className='space-y-4'>
        {/* Error Message */}
        {error && (
          <div className='bg-red-500/20 border border-red-500 rounded-lg p-3'>
            <p className='text-red-400 text-sm'>{error}</p>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className='bg-blue-500/20 border border-blue-500 rounded-lg p-3'>
            <p className='text-blue-400 text-sm'>Adding trade...</p>
          </div>
        )}

        <AddTradeForm onSubmit={handleSubmit} onCancel={handleCancel} defaultCommission={9.99} />
      </div>
    </MobileLayout>
  )
}
