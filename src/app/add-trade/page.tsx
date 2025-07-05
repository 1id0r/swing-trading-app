'use client'

import { useRouter } from 'next/navigation'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { AddTradeForm } from '@/components/trade/AddTradeForm'
import { useTradeStore } from '@/stores/useTradeStore'
import { toast } from 'sonner' // You'll need to install this

export default function AddTradePage() {
  const router = useRouter()
  const { addTrade } = useTradeStore()

  const handleSubmit = (data: any) => {
    try {
      addTrade({
        ...data,
        company: `${data.ticker} Company`, // This would come from stock API
        currency: 'USD', // This would be detected from ticker
      })

      toast.success('Trade added successfully!')
      router.push('/dashboard')
    } catch (error) {
      toast.error('Failed to add trade')
      console.error('Error adding trade:', error)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <MobileLayout title='Add Trade' showBackButton onBackClick={handleCancel}>
      <AddTradeForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </MobileLayout>
  )
}
