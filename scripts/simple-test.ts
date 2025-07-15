import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { pool } from '../src/lib/database'

async function simpleTest() {
  console.log('🔍 Simple database test...')
  
  try {
    // Test connection and basic query
    const result = await pool.query('SELECT NOW(), COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = $1', ['public'])
    console.log('✅ Database connected successfully!')
    console.log('  Current time:', result.rows[0].now)
    console.log('  Tables in database:', result.rows[0].table_count)

    // Test if our operations file can be imported
    console.log('\n📦 Testing imports...')
    const { userOps } = await import('../src/lib/db-operations')
    console.log('✅ Database operations imported successfully!')
    
    console.log('\n🎉 Basic test passed!')
    
  } catch (error) {
    console.error('❌ Simple test failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

simpleTest()