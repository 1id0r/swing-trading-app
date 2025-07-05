// src/components/dashboard/MonthlyPnL.tsx

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
