'use client'

import { MobileLayout } from '@/components/layout/MobileLayout'
import { StatsCards, MonthlyPnL, QuickActions } from '@/components/dashboard'

export default function DashboardPage() {
  return (
    <MobileLayout title='Trading Portfolio' subtitle='Track your swing trades'>
      <div className='space-y-6'>
        <StatsCards />
        <MonthlyPnL />
        <QuickActions />
      </div>
    </MobileLayout>
  )
}
