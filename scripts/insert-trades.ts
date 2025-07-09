// Script to manually insert trades for user: cmcs2nsie0000s928twke031r
// Run this with: npx tsx scripts/insert-trades.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const userId = 'cmcs2nsie0000s928twke031r'

const trades = [
  // From Image 1
  {
    ticker: 'NKTR',
    company: 'Nektar Therapeutics',
    action: 'BUY', // מכירה = SELL
    shares: 8,
    totalTradeValue: 252.40, // Will calculate pricePerShare from this
    date: new Date('2025-01-25'),
    currency: 'USD'
  },
  {
    ticker: 'NKTR',
    company: 'Nektar Therapeutics', 
    action: 'SELL', // קנייה = BUY
    shares: 8,
    totalTradeValue: 266.40,
    date: new Date('2025-01-25'),
    currency: 'USD'
  },
  {
    ticker: 'SRFM',
    company: 'Surf Air Mobility',
    action: 'BUY',
    shares: 30,
    totalTradeValue: 145.32,
    date: new Date('2025-01-25'),
    currency: 'USD'
  },
  {
    ticker: 'INDI',
    company: 'indie Semiconductor',
    action: 'BUY',
    shares: 75,
    totalTradeValue: 275.25,
    date: new Date('2025-01-25'),
    currency: 'USD'
  },
  {
    ticker: 'SRFM',
    company: 'Surf Air Mobility',
    action: 'SELL',
    shares: 30,
    totalTradeValue: 147.60,
    date: new Date('2025-01-25'),
    currency: 'USD'
  },
  {
    ticker: 'INDI',
    company: 'indie Semiconductor',
    action: 'SELL',
    shares: 75,
    totalTradeValue: 298.50,
    date: new Date('2025-01-25'),
    currency: 'USD'
  },
  {
    ticker: 'NKTR',
    company: 'Nektar Therapeutics',
    action: 'BUY',
    shares: 10,
    totalTradeValue: 260.94,
    date: new Date('2025-01-24'),
    currency: 'USD'
  },
  {
    ticker: 'NKTR',
    company: 'Nektar Therapeutics',
    action: 'SELL',
    shares: 10,
    totalTradeValue: 203.50,
    date: new Date('2025-01-24'),
    currency: 'USD'
  },

  // From Image 2
  {
    ticker: 'PLTR',
    company: 'Palantir Technologies',
    action: 'SELL',
    shares: 1.2334,
    totalTradeValue: 159.99,
    date: new Date('2025-07-01'),
    currency: 'USD'
  },
  {
    ticker: 'NVDA',
    company: 'NVIDIA Corporation',
    action: 'SELL',
    shares: 1.9067,
    totalTradeValue: 299.99,
    date: new Date('2025-06-30'),
    currency: 'USD'
  },
  {
    ticker: 'NKTR',
    company: 'Nektar Therapeutics',
    action: 'BUY',
    shares: 12.5391,
    totalTradeValue: 329.78,
    date: new Date('2025-06-30'),
    currency: 'USD'
  },
  {
    ticker: 'SOFI',
    company: 'SoFi Technologies',
    action: 'SELL',
    shares: 10.8108,
    totalTradeValue: 199.78,
    date: new Date('2025-06-30'),
    currency: 'USD'
  },
  {
    ticker: 'META',
    company: 'Meta Platforms Inc',
    action: 'SELL',
    shares: 0.4715,
    totalTradeValue: 349.96,
    date: new Date('2025-06-30'),
    currency: 'USD'
  },
  {
    ticker: 'PLTR',
    company: 'Palantir Technologies',
    action: 'SELL',
    shares: 2.4061,
    totalTradeValue: 350.00,
    date: new Date('2025-06-26'),
    currency: 'USD'
  },
  {
    ticker: 'SRFM',
    company: 'Surf Air Mobility',
    action: 'BUY',
    shares: 42.6384,
    totalTradeValue: 143.90,
    date: new Date('2025-06-26'),
    currency: 'USD'
  },
  {
    ticker: 'SRFM',
    company: 'Surf Air Mobility',
    action: 'SELL',
    shares: 42.6384,
    totalTradeValue: 150.00,
    date: new Date('2025-06-26'),
    currency: 'USD'
  },
  {
    ticker: 'NKTR',
    company: 'Nektar Therapeutics',
    action: 'SELL',
    shares: 12.5391,
    totalTradeValue: 400.00,
    date: new Date('2025-06-26'),
    currency: 'USD'
  },

  // From Image 3
  {
    ticker: 'HOOD',
    company: 'Robinhood Markets',
    action: 'SELL',
    shares: 7.996,
    totalTradeValue: 800.00,
    date: new Date('2025-07-02'),
    currency: 'USD'
  },
  {
    ticker: 'NAMM',
    company: 'Namco Bandai Holdings',
    action: 'BUY',
    shares: 46.5201,
    totalTradeValue: 485.20,
    date: new Date('2025-07-02'),
    currency: 'USD'
  },
  {
    ticker: 'NAMM',
    company: 'Namco Bandai Holdings',
    action: 'SELL',
    shares: 46.5201,
    totalTradeValue: 500.00,
    date: new Date('2025-07-02'),
    currency: 'USD'
  },
  {
    ticker: 'PLTR',
    company: 'Palantir Technologies',
    action: 'SELL',
    shares: 1.2334,
    totalTradeValue: 159.99,
    date: new Date('2025-07-01'),
    currency: 'USD'
  },
  {
    ticker: 'NVDA',
    company: 'NVIDIA Corporation',
    action: 'SELL',
    shares: 1.9067,
    totalTradeValue: 299.99,
    date: new Date('2025-06-30'),
    currency: 'USD'
  },
  {
    ticker: 'NKTR',
    company: 'Nektar Therapeutics',
    action: 'BUY',
    shares: 12.5391,
    totalTradeValue: 329.78,
    date: new Date('2025-06-30'),
    currency: 'USD'
  },
  {
    ticker: 'SOFI',
    company: 'SoFi Technologies',
    action: 'SELL',
    shares: 10.8108,
    totalTradeValue: 199.78,
    date: new Date('2025-06-30'),
    currency: 'USD'
  },
  {
    ticker: 'META',
    company: 'Meta Platforms Inc',
    action: 'SELL',
    shares: 0.4715,
    totalTradeValue: 349.96,
    date: new Date('2025-06-30'),
    currency: 'USD'
  },
  {
    ticker: 'PLTR',
    company: 'Palantir Technologies',
    action: 'SELL',
    shares: 2.4061,
    totalTradeValue: 350.00,
    date: new Date('2025-06-26'),
    currency: 'USD'
  }
]

async function insertTrades() {
  try {
    console.log(`Inserting ${trades.length} trades for user: ${userId}`)
    
    for (const trade of trades) {
      // Calculate price per share from total trade value
      const pricePerShare = trade.totalTradeValue / trade.shares
      const totalValue = trade.totalTradeValue
      const totalCost = totalValue // Assuming no fees for now
      
      const insertedTrade = await prisma.trade.create({
        data: {
          userId,
          ticker: trade.ticker,
          company: trade.company,
          action: trade.action,
          shares: trade.shares,
          pricePerShare: pricePerShare,
          fee: 0, // Set to 0 or add actual fee amounts
          currency: trade.currency,
          date: trade.date,
          totalValue,
          totalCost,
          // P&L fields will be calculated later for SELL trades
        }
      })
      
      console.log(`✅ Inserted ${trade.action} ${trade.shares} ${trade.ticker} @ ${pricePerShare.toFixed(4)}/share (Total: ${trade.totalTradeValue})`)
    }
    
    console.log('🎉 All trades inserted successfully!')
    
  } catch (error) {
    console.error('❌ Error inserting trades:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the insertion
insertTrades()