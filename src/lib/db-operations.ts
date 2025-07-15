// File: /src/lib/db-operations.ts
import { pool } from './database'
import { nanoid } from 'nanoid'

// Types - matching your current Prisma schema
export interface User {
  id: string
  firebaseUid: string
  email: string
  displayName?: string
  createdAt: Date
  updatedAt: Date
}

export interface Trade {
  id: string
  userId: string
  ticker: string
  company: string
  action: 'BUY' | 'SELL'
  shares: number
  pricePerShare: number
  fee: number
  currency: string
  logo?: string
  date: Date
  totalValue: number
  totalCost: number
  realizedPnl?: number
  costBasis?: number
  createdAt: Date
  updatedAt: Date
}

export interface Position {
  id: string
  userId: string
  ticker: string
  company: string
  logo?: string
  currency: string
  totalShares: number
  averagePrice: number
  totalCost: number
  currentPrice?: number
  lastPriceUpdate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface UserSettings {
  id: string
  userId: string
  defaultCurrency: string
  displayCurrency: string
  taxRate: number
  defaultFee: number
  theme: string
  createdAt: Date
  updatedAt: Date
}

// Helper function to convert snake_case to camelCase
function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj
  
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase)
  }
  
  const converted: any = {}
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    converted[camelKey] = obj[key]
  }
  return converted
}

// User Operations
export const userOps = {
  async createOrUpdateUser(firebaseUid: string, email: string, displayName?: string): Promise<User> {
    const client = await pool.connect()
    try {
      // Try to find existing user
      const existingResult = await client.query(
        'SELECT * FROM users WHERE firebase_uid = $1',
        [firebaseUid]
      )

      if (existingResult.rows.length > 0) {
        // Update existing user
        const result = await client.query(
          `UPDATE users 
           SET email = $2, display_name = $3, updated_at = CURRENT_TIMESTAMP
           WHERE firebase_uid = $1
           RETURNING *`,
          [firebaseUid, email, displayName]
        )
        return toCamelCase(result.rows[0])
      } else {
        // Create new user
        const id = nanoid()
        const result = await client.query(
          `INSERT INTO users (id, firebase_uid, email, display_name)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [id, firebaseUid, email, displayName]
        )
        return toCamelCase(result.rows[0])
      }
    } finally {
      client.release()
    }
  },

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [firebaseUid]
    )
    return result.rows[0] ? toCamelCase(result.rows[0]) : null
  },

  async getUserById(id: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    )
    return result.rows[0] ? toCamelCase(result.rows[0]) : null
  }
}

// Trade Operations
export const tradeOps = {
  async createTrade(trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trade> {
    const id = nanoid()
    const result = await pool.query(
      `INSERT INTO trades (
        id, user_id, ticker, company, action, shares, price_per_share, 
        fee, currency, logo, date, total_value, total_cost, realized_pnl, cost_basis
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        id, trade.userId, trade.ticker, trade.company, trade.action,
        trade.shares, trade.pricePerShare, trade.fee, trade.currency,
        trade.logo, trade.date, trade.totalValue, trade.totalCost,
        trade.realizedPnl, trade.costBasis
      ]
    )
    return toCamelCase(result.rows[0])
  },

  async getTradesByUser(
    userId: string, 
    options: { ticker?: string; limit?: number; offset?: number } = {}
  ): Promise<{ trades: Trade[]; total: number }> {
    let query = 'SELECT * FROM trades WHERE user_id = $1'
    let countQuery = 'SELECT COUNT(*) FROM trades WHERE user_id = $1'
    const params: any[] = [userId]
    let paramIndex = 2

    if (options.ticker) {
      query += ` AND ticker = $${paramIndex}`
      countQuery += ` AND ticker = $${paramIndex}`
      params.push(options.ticker)
      paramIndex++
    }

    query += ' ORDER BY date DESC'

    if (options.limit) {
      query += ` LIMIT $${paramIndex}`
      params.push(options.limit)
      paramIndex++
    }

    if (options.offset) {
      query += ` OFFSET $${paramIndex}`
      params.push(options.offset)
    }

    const [tradesResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, options.ticker ? 2 : 1))
    ])

    return {
      trades: tradesResult.rows.map(toCamelCase),
      total: parseInt(countResult.rows[0].count)
    }
  },

  async deleteTrade(id: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM trades WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    return result.rowCount > 0
  },

  async getTradeById(id: string, userId: string): Promise<Trade | null> {
    const result = await pool.query(
      'SELECT * FROM trades WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    return result.rows[0] ? toCamelCase(result.rows[0]) : null
  }
}

// Position Operations
export const positionOps = {
  async getPositionsByUser(userId: string): Promise<Position[]> {
    const result = await pool.query(
      'SELECT * FROM positions WHERE user_id = $1 ORDER BY ticker',
      [userId]
    )
    return result.rows.map(toCamelCase)
  },

  async updatePositionPrices(updates: { ticker: string; price: number; timestamp: Date }[]): Promise<void> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      
      for (const update of updates) {
        await client.query(
          `UPDATE positions 
           SET current_price = $1, last_price_update = $2, updated_at = CURRENT_TIMESTAMP
           WHERE ticker = $3`,
          [update.price, update.timestamp, update.ticker]
        )
      }
      
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },

  async recalculatePosition(userId: string, ticker: string): Promise<Position | null> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Get all trades for this user and ticker
      const tradesResult = await client.query(
        'SELECT * FROM trades WHERE user_id = $1 AND ticker = $2 ORDER BY date ASC',
        [userId, ticker]
      )

      const trades = tradesResult.rows

      if (trades.length === 0) {
        // No trades, delete position if exists
        await client.query(
          'DELETE FROM positions WHERE user_id = $1 AND ticker = $2',
          [userId, ticker]
        )
        await client.query('COMMIT')
        return null
      }

      // Calculate position
      let totalShares = 0
      let totalCost = 0

      for (const trade of trades) {
        if (trade.action === 'BUY') {
          totalShares += parseFloat(trade.shares)
          totalCost += parseFloat(trade.total_cost)
        } else if (trade.action === 'SELL') {
          totalShares -= parseFloat(trade.shares)
          // Proportionally reduce cost basis
          if (totalShares + parseFloat(trade.shares) > 0) {
            const costToRemove = (parseFloat(trade.shares) / (totalShares + parseFloat(trade.shares))) * totalCost
            totalCost -= costToRemove
          }
        }
      }

      if (totalShares <= 0) {
        // Position closed, delete
        await client.query(
          'DELETE FROM positions WHERE user_id = $1 AND ticker = $2',
          [userId, ticker]
        )
        await client.query('COMMIT')
        return null
      }

      const averagePrice = totalCost / totalShares
      const latestTrade = trades[trades.length - 1]

      // Upsert position
      const result = await client.query(
        `INSERT INTO positions (
          id, user_id, ticker, company, logo, currency, 
          total_shares, average_price, total_cost
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (user_id, ticker) 
        DO UPDATE SET 
          company = EXCLUDED.company,
          logo = EXCLUDED.logo,
          currency = EXCLUDED.currency,
          total_shares = EXCLUDED.total_shares,
          average_price = EXCLUDED.average_price,
          total_cost = EXCLUDED.total_cost,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *`,
        [
          nanoid(), userId, ticker, latestTrade.company, latestTrade.logo,
          latestTrade.currency, totalShares, averagePrice, totalCost
        ]
      )

      await client.query('COMMIT')
      return toCamelCase(result.rows[0])
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },

  async getPositionByUserAndTicker(userId: string, ticker: string): Promise<Position | null> {
    const result = await pool.query(
      'SELECT * FROM positions WHERE user_id = $1 AND ticker = $2',
      [userId, ticker]
    )
    return result.rows[0] ? toCamelCase(result.rows[0]) : null
  }
}

// Settings Operations
export const settingsOps = {
  async getUserSettings(userId: string): Promise<UserSettings> {
    const client = await pool.connect()
    try {
      let result = await client.query(
        'SELECT * FROM user_settings WHERE user_id = $1',
        [userId]
      )

      if (result.rows.length === 0) {
        // Create default settings
        const id = nanoid()
        result = await client.query(
          `INSERT INTO user_settings (
            id, user_id, default_currency, display_currency, 
            tax_rate, default_fee, theme
          ) VALUES ($1, $2, 'USD', 'USD', 25.0, 9.99, 'dark')
          RETURNING *`,
          [id, userId]
        )
      }

      return toCamelCase(result.rows[0])
    } finally {
      client.release()
    }
  },

  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings> {
    const setParts = []
    const values = []
    let paramIndex = 1

    if (settings.defaultCurrency) {
      setParts.push(`default_currency = $${paramIndex++}`)
      values.push(settings.defaultCurrency)
    }
    if (settings.displayCurrency) {
      setParts.push(`display_currency = $${paramIndex++}`)
      values.push(settings.displayCurrency)
    }
    if (settings.taxRate !== undefined) {
      setParts.push(`tax_rate = $${paramIndex++}`)
      values.push(settings.taxRate)
    }
    if (settings.defaultFee !== undefined) {
      setParts.push(`default_fee = $${paramIndex++}`)
      values.push(settings.defaultFee)
    }
    if (settings.theme) {
      setParts.push(`theme = $${paramIndex++}`)
      values.push(settings.theme)
    }

    setParts.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(userId)

    const result = await pool.query(
      `UPDATE user_settings SET ${setParts.join(', ')} 
       WHERE user_id = $${paramIndex}
       RETURNING *`,
      values
    )

    return toCamelCase(result.rows[0])
  }
}

// Dashboard Operations
export const dashboardOps = {
  async getDashboardStats(userId: string) {
    const client = await pool.connect()
    try {
      // Get positions with current values
      const positionsResult = await client.query(
        'SELECT * FROM positions WHERE user_id = $1',
        [userId]
      )

      const positions = positionsResult.rows.map(toCamelCase)
      const totalPositions = positions.length

      let totalValue = 0
      let totalCost = 0

      for (const position of positions) {
        const currentPrice = parseFloat(position.currentPrice || position.averagePrice)
        const shares = parseFloat(position.totalShares)
        totalValue += currentPrice * shares
        totalCost += parseFloat(position.totalCost)
      }

      const totalPnL = totalValue - totalCost
      const totalPnLPercentage = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0

      // Get recent trades
      const recentTradesResult = await client.query(
        'SELECT * FROM trades WHERE user_id = $1 ORDER BY date DESC LIMIT 5',
        [userId]
      )

      // Get monthly P&L data
      const monthlyPnLResult = await client.query(`
        SELECT 
          DATE_TRUNC('month', date) as month,
          SUM(CASE WHEN action = 'SELL' THEN realized_pnl ELSE 0 END) as monthly_pnl
        FROM trades 
        WHERE user_id = $1 AND realized_pnl IS NOT NULL
        GROUP BY DATE_TRUNC('month', date)
        ORDER BY month DESC
        LIMIT 12
      `, [userId])

      return {
        totalPositions,
        totalValue,
        totalCost,
        totalPnL,
        totalPnLPercentage,
        recentTrades: recentTradesResult.rows.map(toCamelCase),
        monthlyPnL: monthlyPnLResult.rows.map(row => ({
          month: row.month,
          pnl: parseFloat(row.monthly_pnl || '0')
        }))
      }
    } finally {
      client.release()
    }
  }
}

// FIFO Calculation Helper (matching your existing Prisma logic)
export const fifoOps = {
  async calculateFIFOCostBasis(ticker: string, sharesToSell: number, sellDate: Date, userId: string): Promise<number> {
    // Get all buy trades for this user and ticker before the sell date
    const buyTrades = await pool.query(
      `SELECT * FROM trades 
       WHERE user_id = $1 AND ticker = $2 AND action = 'BUY' AND date <= $3
       ORDER BY date ASC`,
      [userId, ticker, sellDate]
    )

    // Get all previous sell trades for this user
    const previousSells = await pool.query(
      `SELECT * FROM trades 
       WHERE user_id = $1 AND ticker = $2 AND action = 'SELL' AND date < $3
       ORDER BY date ASC`,
      [userId, ticker, sellDate]
    )

    const sharesSoldPreviously = previousSells.rows.reduce(
      (total, sell) => total + parseFloat(sell.shares),
      0
    )

    let remainingSharesToSell = sharesToSell
    let totalCostBasis = 0
    let sharesProcessed = 0

    for (const buyTrade of buyTrades.rows) {
      const sharesFromThisBuy = parseFloat(buyTrade.shares)
      const remainingFromBuy = sharesFromThisBuy - Math.max(0, sharesSoldPreviously - sharesProcessed)
      
      if (remainingFromBuy > 0 && remainingSharesToSell > 0) {
        const sharesToUseFromThisBuy = Math.min(remainingFromBuy, remainingSharesToSell)
        totalCostBasis += sharesToUseFromThisBuy * parseFloat(buyTrade.price_per_share)
        remainingSharesToSell -= sharesToUseFromThisBuy
      }
      
      sharesProcessed += sharesFromThisBuy
      
      if (remainingSharesToSell <= 0) break
    }

    if (remainingSharesToSell > 0) {
      throw new Error(`Insufficient shares to sell. User ${userId} only has ${sharesToSell - remainingSharesToSell} shares available.`)
    }

    return totalCostBasis
  }
}