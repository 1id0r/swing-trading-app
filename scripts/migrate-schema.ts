import { readFileSync } from 'fs'
import { join } from 'path'
import { pool } from '../src/lib/database'

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...')
    
    const schemaSQL = readFileSync(join(__dirname, '..', 'sql', 'schema.sql'), 'utf-8')
    
    await pool.query(schemaSQL)
    
    console.log('✅ Database migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()