import dotenv from 'dotenv'
import path from 'path'

// Load environment variables FIRST
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { userOps, tradeOps, positionOps, settingsOps, dashboardOps } from '../src/lib/db-operations'
import { pool } from '../src/lib/database'

async function testOperations() {
  console.log('🧪 Testing database operations...')
  
  try {
    // Test 1: User Operations
    console.log('\n👥 Testing user operations...')
    const testUser = await userOps.createOrUpdateUser(
      'test-firebase-uid-123',
      'test@example.com',
      'Test User'
    )
    console.log('✅ User created:', testUser.email, 'ID:', testUser.id)

    // Test 2: Settings Operations
    console.log('\n⚙️ Testing settings operations...')
    const settings = await settingsOps.getUserSettings(testUser.id)
    console.log('✅ Settings retrieved:', settings.theme, settings.defaultCurrency)

    // Test 3: Trade Operations
    console.log('\n💹 Testing trade operations...')
    const testTrade = await tradeOps.createTrade({
      userId: testUser.id,
      ticker: 'AAPL',
      company: 'Apple Inc.',
      action: 'BUY',
      shares: 10,
      pricePerShare: 150.00,
      fee: 9.99,
      currency: 'USD',
      date: new Date(),
      totalValue: 1500.00,
      totalCost: 1509.99
    })
    console.log('✅ Trade created:', `${testTrade.action} ${testTrade.shares} ${testTrade.ticker} @ $${testTrade.pricePerShare}`)

    // Test 4: Position Calculation
    console.log('\n📊 Testing position operations...')
    const position = await positionOps.recalculatePosition(testUser.id, 'AAPL')
    console.log('✅ Position calculated:', position?.ticker, `${position?.totalShares} shares @ $${position?.averagePrice}`)

    // Test 5: Fetch Trades
    console.log('\n📋 Testing trade retrieval...')
    const { trades, total } = await tradeOps.getTradesByUser(testUser.id, { limit: 5 })
    console.log('✅ Trades retrieved:', `${total} total trades, showing ${trades.length}`)

    // Test 6: Dashboard Stats
    console.log('\n📈 Testing dashboard operations...')
    const stats = await dashboardOps.getDashboardStats(testUser.id)
    console.log('✅ Dashboard stats:', `${stats.totalPositions} positions, $${stats.totalValue.toFixed(2)} total value`)

    // Test 7: Update User Settings
    console.log('\n🔧 Testing settings update...')
    const updatedSettings = await settingsOps.updateUserSettings(testUser.id, {
      theme: 'light',
      defaultCurrency: 'EUR'
    })
    console.log('✅ Settings updated:', updatedSettings.theme, updatedSettings.defaultCurrency)

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...')
    await tradeOps.deleteTrade(testTrade.id, testUser.id)
    await pool.query('DELETE FROM user_settings WHERE user_id = $1', [testUser.id])
    await pool.query('DELETE FROM users WHERE firebase_uid = $1', ['test-firebase-uid-123'])
    console.log('✅ Test data cleaned up')

    console.log('\n🎉 All database operations working perfectly!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    
    // Clean up in case of error
    try {
      await pool.query('DELETE FROM users WHERE firebase_uid = $1', ['test-firebase-uid-123'])
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    process.exit(1)
  } finally {
    await pool.end()
  }
}

testOperations()