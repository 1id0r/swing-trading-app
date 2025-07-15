
// File: /scripts/setup-database.ts (UPDATED)
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables FIRST
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { pool } from '../src/lib/database'
import { readFileSync } from 'fs'

async function setupDatabase() {
  console.log('🚀 Setting up PostgreSQL database...')
  
  try {
    // Test connection first
    console.log('🔌 Testing connection...')
    const client = await pool.connect()
    console.log('✅ Successfully connected to database')
    
    // Check existing tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    
    console.log('📊 Existing tables:', tablesResult.rows.map(r => r.table_name))
    client.release()
    
    // Check if schema file exists
    const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql')
    console.log('📁 Looking for schema file at:', schemaPath)
    
    if (!require('fs').existsSync(schemaPath)) {
      console.error('❌ Schema file not found at:', schemaPath)
      console.log('💡 Please create the /sql/schema.sql file first')
      process.exit(1)
    }
    
    // Run schema creation
    console.log('📝 Running schema creation...')
    const schemaSQL = readFileSync(schemaPath, 'utf-8')
    await pool.query(schemaSQL)
    
    console.log('✅ Database schema created successfully!')
    
    // Verify tables were created
    const client2 = await pool.connect()
    const newTablesResult = await client2.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    console.log('🎉 Current tables:', newTablesResult.rows.map(r => r.table_name))
    client2.release()
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    
    if (error.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
      console.log('\n🔧 SSL Certificate Fix Options:')
      console.log('1. Try updating your .env.local DATABASE_URL to use sslmode=disable:')
      console.log('   DATABASE_URL="postgresql://postgres.lflxpojfhfgpydvdhqfu:X41kCqhJ3BU7X2gG@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=disable"')
      console.log('\n2. Or try the direct connection (port 5432):')
      console.log('   DATABASE_URL="postgresql://postgres.lflxpojfhfgpydvdhqfu:X41kCqhJ3BU7X2gG@db.lflxpojfhfgpydvdhqfu.supabase.co:5432/postgres?sslmode=require"')
    }
    
    process.exit(1)
  } finally {
    await pool.end()
  }
}

setupDatabase()