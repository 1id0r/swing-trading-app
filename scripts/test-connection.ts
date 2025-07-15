// File: /scripts/test-connection.ts
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables FIRST
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { pool } from '../src/lib/database'

async function testConnection() {
  console.log('🧪 Testing database connection and basic operations...')
  
  try {
    // Test basic connection
    const client = await pool.connect()
    const result = await client.query('SELECT NOW(), current_database(), current_user')
    console.log('✅ Database connection successful!')
    console.log('  Current time:', result.rows[0].now)
    console.log('  Database:', result.rows[0].current_database)
    console.log('  User:', result.rows[0].current_user)
    client.release()

    // Test table existence
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    console.log('\n📊 Available tables:')
    if (tablesResult.rows.length === 0) {
      console.log('  (No tables found)')
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`)
      })
    }

    if (tablesResult.rows.length === 0) {
      console.log('\n💡 No tables found. Run "npm run db:setup" to create the schema.')
    }

    console.log('\n🎉 All connection tests passed!')
    
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

testConnection()
