// File: /scripts/test-env.ts
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// Debug environment variables
console.log('🔍 Environment Variables Debug:')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)

if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 50) + '...')
  
  // Parse the URL to check components
  try {
    const url = new URL(process.env.DATABASE_URL)
    console.log('📊 Connection Details:')
    console.log('  Protocol:', url.protocol)
    console.log('  Username:', url.username)
    console.log('  Hostname:', url.hostname)
    console.log('  Port:', url.port)
    console.log('  Database:', url.pathname.substring(1)) // Remove leading /
    console.log('  Search params:', url.search)
  } catch (error) {
    console.error('❌ Invalid DATABASE_URL format:', error)
  }
} else {
  console.error('❌ DATABASE_URL not found!')
  console.log('Available env vars containing "DB":', 
    Object.keys(process.env).filter(key => key.includes('DB'))
  )
}

// Also check individual vars
console.log('\n🔍 Individual DB Variables:')
console.log('DB_HOST:', process.env.DB_HOST)
console.log('DB_PORT:', process.env.DB_PORT)
console.log('DB_NAME:', process.env.DB_NAME)
console.log('DB_USER:', process.env.DB_USER)
console.log('DB_PASSWORD exists:', !!process.env.DB_PASSWORD)