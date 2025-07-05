// src/components/dashboard/StatsCards.tsx
import { TrendingUp, PieChart, DollarSign, Activity } from 'lucide-react'
import { useTradeStore } from '@/stores/useTradeStore'

interface StatCardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down' | 'neutral'
}

function StatCard({ title, value, subtitle, icon: Icon, trend = 'neutral' }: StatCardProps) {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'theme-text-secondary  ',
  }

  return (
    <div className='theme-card theme-card   p-4   '>
      <div className='flex items-center gap-2 mb-2'>
        <Icon className='w-4 h-4 text-blue-400' />
        <span className='text-sm theme-text-secondary  '>{title}</span>
      </div>
      <div className='text-2xl font-bold theme-text-primary  '>{value}</div>
      <div className={`text-sm ${trendColors[trend]}`}>{subtitle}</div>
    </div>
  )
}

export function StatsCards() {
  const { dashboardStats, portfolioStats, isLoadingDashboard } = useTradeStore()

  // Safe defaults
  const stats = dashboardStats || {
    totalPnL: 0,
    activePositions: 0,
    totalValue: 0,
    winRate: 0,
    thisMonthPnL: 0,
  }

  const portfolio = portfolioStats || {
    totalValue: 0,
    totalCost: 0,
    totalUnrealizedPnL: 0,
    totalPositions: 0,
  }

  if (isLoadingDashboard) {
    return (
      <div className='theme-card grid grid-cols-2 gap-4'>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className='theme-card   p-4    animate-pulse'>
            <div className='h-4 bg-gray-700 rounded mb-2'></div>
            <div className='h-8 bg-gray-700 rounded mb-1'></div>
            <div className='h-3 bg-gray-700 rounded'></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className='grid grid-cols-2 gap-4'>
      <StatCard
        title='Total P&L'
        value={`${stats.totalPnL.toFixed(2)}`}
        subtitle={
          stats.totalPnL >= 0
            ? `+${((stats.totalPnL / (portfolio.totalCost || 1)) * 100).toFixed(1)}%`
            : `${((stats.totalPnL / (portfolio.totalCost || 1)) * 100).toFixed(1)}%`
        }
        icon={TrendingUp}
        trend={stats.totalPnL >= 0 ? 'up' : 'down'}
      />
      <StatCard
        title='Active Positions'
        value={stats.activePositions.toString()}
        subtitle={`${portfolio.totalValue.toFixed(0)} invested`}
        icon={PieChart}
        trend='neutral'
      />
      <StatCard
        title='This Month'
        value={`${stats.thisMonthPnL.toFixed(2)}`}
        subtitle='Current month P&L'
        icon={DollarSign}
        trend={stats.thisMonthPnL >= 0 ? 'up' : 'down'}
      />
      <StatCard
        title='Win Rate'
        value={`${stats.winRate.toFixed(0)}%`}
        subtitle='Profitable trades'
        icon={Activity}
        trend={stats.winRate >= 50 ? 'up' : 'down'}
      />
    </div>
  )
}
