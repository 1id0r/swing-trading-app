// src/components/dashboard/MonthlyPnL.tsx (Fixed)
import { useTradeStore } from '@/stores/useTradeStore'
import { useSettingsStore, settingsUtils } from '@/stores/useSettingsStore'

interface MonthlyData {
  month: string
  profit: number
  trades: number
}

export function MonthlyPnL() {
  const { trades, isLoading } = useTradeStore()
  const { settings } = useSettingsStore()

  // Calculate monthly data from real trades
  const calculateMonthlyData = (): MonthlyData[] => {
    if (!trades || trades.length === 0) return []

    const monthlyMap = new Map<string, { profit: number; trades: number }>()

    trades.forEach((trade) => {
      const date = new Date(trade.date)
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      const monthLabel = date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { profit: 0, trades: 0 })
      }

      const monthData = monthlyMap.get(monthKey)!
      monthData.trades += 1

      // Only add profit for sell trades (realized P&L)
      if (trade.action === 'SELL' && trade.netProfit !== null) {
        monthData.profit += trade.netProfit || 0
      }
    })

    // Convert to array and sort by date
    return Array.from(monthlyMap.entries())
      .map(([monthKey, data]) => {
        const [year, month] = monthKey.split('-').map(Number)
        const date = new Date(year, month)
        return {
          month: date.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          }),
          profit: data.profit,
          trades: data.trades,
        }
      })
      .sort((a, b) => {
        const dateA = new Date(a.month)
        const dateB = new Date(b.month)
        return dateB.getTime() - dateA.getTime() // Most recent first
      })
      .slice(0, 6) // Show last 6 months
  }

  const monthlyData = calculateMonthlyData()

  if (isLoading) {
    return (
      <div className='bg-gray-800/50 rounded-xl border border-gray-700'>
        <div className='p-4 border-b border-gray-700'>
          <div className='h-6 bg-gray-700 rounded mb-2 w-1/3'></div>
          <div className='h-4 bg-gray-700 rounded w-1/2'></div>
        </div>
        <div className='p-4 space-y-3'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='flex items-center justify-between p-3 bg-gray-900/50 rounded-lg animate-pulse'>
              <div className='space-y-1'>
                <div className='h-4 bg-gray-700 rounded w-20'></div>
                <div className='h-3 bg-gray-700 rounded w-16'></div>
              </div>
              <div className='text-right space-y-1'>
                <div className='h-4 bg-gray-700 rounded w-16'></div>
                <div className='h-3 bg-gray-700 rounded w-12'></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='bg-gray-800/50 rounded-xl border border-gray-700'>
      <div className='p-4 border-b border-gray-700'>
        <h3 className='text-lg font-semibold text-white'>Monthly Summary</h3>
        <p className='text-sm text-gray-400'>Track your trading performance</p>
      </div>

      <div className='p-4'>
        {monthlyData.length === 0 ? (
          <div className='text-center py-8'>
            <div className='text-gray-400 mb-2'>No trading data yet</div>
            <div className='text-sm text-gray-500'>Start adding trades to see monthly performance</div>
          </div>
        ) : (
          <div className='space-y-3'>
            {monthlyData.map((month: MonthlyData, index: number) => (
              <div
                key={index}
                className='flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors'
              >
                <div>
                  <div className='text-white font-medium'>{month.month}</div>
                  <div className='text-sm text-gray-400'>{month.trades} trades</div>
                </div>
                <div className='text-right'>
                  <div
                    className={`font-bold ${
                      month.profit > 0 ? 'text-green-400' : month.profit < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}
                  >
                    {month.profit > 0 ? '+' : ''}
                    {settings
                      ? settingsUtils.formatCurrency(month.profit, settings.displayCurrency)
                      : `$${month.profit.toFixed(2)}`}
                  </div>
                  <div className='text-sm text-gray-400'>Net P&L</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
