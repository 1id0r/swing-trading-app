
// File: /src/lib/database.ts (UPDATED - Fix SSL issue)
import { Pool, PoolClient } from 'pg'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// Debug connection string
console.log('🔍 Connection Debug:')
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)

if (!process.env.DATABASE_URL) {
  console.error('❌ Available env vars:', Object.keys(process.env).filter(k => k.includes('DB')))
  throw new Error('❌ DATABASE_URL environment variable is not set')
}

// Validate URL format
try {
  const url = new URL(process.env.DATABASE_URL)
  console.log('✅ Connection URL is valid')
  console.log('  Host:', url.hostname)
  console.log('  Port:', url.port)
  console.log('  Database:', url.pathname.substring(1))
  console.log('  Username:', url.username)
} catch (error) {
  throw new Error(`❌ Invalid DATABASE_URL format: ${error}`)
}

// Create connection pool with FIXED SSL configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false, // Disable SSL in development to avoid certificate issues
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased timeout
})

// Alternative SSL configuration for Supabase (try this if above doesn't work)
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false,
//     ca: undefined,
//     cert: undefined,
//     key: undefined
//   },
//   max: 20,
//   idleTimeoutMillis: 30000,
//   connectionTimeoutMillis: 10000,
// })

// Connection event handlers
pool.on('connect', (client) => {
  console.log('✅ New client connected to PostgreSQL')
})

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client:', err)
})

export { pool }

// Helper for transactions
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}