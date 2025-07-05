// components/dashboard/StatsCards.tsx
import { TrendingUp, PieChart, DollarSign, Activity } from 'lucide-react'

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
    neutral: 'text-gray-400',
  }

  return (
    <div className='bg-gray-800/50 rounded-xl p-4 border border-gray-700'>
      <div className='flex items-center gap-2 mb-2'>
        <Icon className='w-4 h-4 text-blue-400' />
        <span className='text-sm text-gray-400'>{title}</span>
      </div>
      <div className='text-2xl font-bold text-white'>{value}</div>
      <div className={`text-sm ${trendColors[trend]}`}>{subtitle}</div>
    </div>
  )
}

export function StatsCards() {
  return (
    <div className='grid grid-cols-2 gap-4'>
      <StatCard title='Total P&L' value='$6,580.70' subtitle='+12.5% this month' icon={TrendingUp} trend='up' />
      <StatCard title='Active Positions' value='8' subtitle='$45,200 invested' icon={PieChart} trend='neutral' />
      <StatCard title='This Month' value='$1,780.45' subtitle='10 trades' icon={DollarSign} trend='up' />
      <StatCard title='Win Rate' value='72%' subtitle='18/25 profitable' icon={Activity} trend='up' />
    </div>
  )
}

// components/dashboard/MonthlyPnL.tsx
interface MonthlyData {
  month: string
  profit: number
  trades: number
}

const monthlyData: MonthlyData[] = [
  { month: 'Jan 2024', profit: 2450.3, trades: 12 },
  { month: 'Feb 2024', profit: -850.2, trades: 8 },
  { month: 'Mar 2024', profit: 3200.15, trades: 15 },
  { month: 'Apr 2024', profit: 1780.45, trades: 10 },
]

export function MonthlyPnL() {
  return (
    <div className='bg-gray-800/50 rounded-xl border border-gray-700'>
      <div className='p-4 border-b border-gray-700'>
        <h3 className='text-lg font-semibold text-white'>Monthly Summary</h3>
        <p className='text-sm text-gray-400'>Track your trading performance</p>
      </div>

      <div className='p-4 space-y-3'>
        {monthlyData.map((month, index) => (
          <div
            key={index}
            className='flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors'
          >
            <div>
              <div className='text-white font-medium'>{month.month}</div>
              <div className='text-sm text-gray-400'>{month.trades} trades</div>
            </div>
            <div className='text-right'>
              <div className={`font-bold ${month.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {month.profit > 0 ? '+' : ''}${month.profit.toFixed(2)}
              </div>
              <div className='text-sm text-gray-400'>Net P&L</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
