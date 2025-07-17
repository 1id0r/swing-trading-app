// Create this file: /scripts/add-watchlist-tables.ts
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { pool } from '../src/lib/database'

async function addWatchlistTables() {
  console.log('🚀 Adding watchlist tables to database...')
  
  try {
    const client = await pool.connect()
    
    // Create watchlist_folders table
    console.log('📁 Creating watchlist_folders table...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS watchlist_folders (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        is_expanded BOOLEAN DEFAULT true,
        position INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Create watchlist_items table
    console.log('📊 Creating watchlist_items table...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS watchlist_items (
        id VARCHAR(50) PRIMARY KEY,
        folder_id VARCHAR(50) NOT NULL REFERENCES watchlist_folders(id) ON DELETE CASCADE,
        user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ticker VARCHAR(20) NOT NULL,
        company VARCHAR(200),
        logo TEXT,
        added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        position INTEGER DEFAULT 0,
        UNIQUE(folder_id, ticker)
      );
    `)

    // Create indexes
    console.log('🔍 Creating indexes...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_watchlist_folders_user_id ON watchlist_folders(user_id);
      CREATE INDEX IF NOT EXISTS idx_watchlist_items_folder_id ON watchlist_items(folder_id);
      CREATE INDEX IF NOT EXISTS idx_watchlist_items_user_id ON watchlist_items(user_id);
      CREATE INDEX IF NOT EXISTS idx_watchlist_items_ticker ON watchlist_items(ticker);
    `)

    // Create update trigger function
    console.log('⚡ Creating update trigger function...')
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `)

    // Create trigger for watchlist_folders
    console.log('🔄 Creating update trigger...')
    await client.query(`
      DROP TRIGGER IF EXISTS update_watchlist_folders_updated_at ON watchlist_folders;
      CREATE TRIGGER update_watchlist_folders_updated_at 
          BEFORE UPDATE ON watchlist_folders 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `)

    // Check if we should create default folders for existing users
    const usersResult = await client.query('SELECT id FROM users')
    const userCount = usersResult.rows.length

    if (userCount > 0) {
      console.log(`👥 Found ${userCount} existing users. Creating default folders...`)
      
      for (const user of usersResult.rows) {
        const userId = user.id
        
        // Check if user already has folders
        const existingFoldersResult = await client.query(
          'SELECT COUNT(*) as count FROM watchlist_folders WHERE user_id = $1',
          [userId]
        )
        
        if (parseInt(existingFoldersResult.rows[0].count) === 0) {
          // Create default folders for this user
          const defaultFolders = [
            { name: 'Crypto', isExpanded: true, position: 0 },
            { name: 'Tech Stocks', isExpanded: true, position: 1 },
            { name: 'Israeli Stocks', isExpanded: false, position: 2 }
          ]

          for (const folder of defaultFolders) {
            const folderId = `${folder.name.toLowerCase().replace(/\s+/g, '_')}_${userId}_${Date.now()}`
            await client.query(
              `INSERT INTO watchlist_folders (id, user_id, name, is_expanded, position)
               VALUES ($1, $2, $3, $4, $5)`,
              [folderId, userId, folder.name, folder.isExpanded, folder.position]
            )
          }
          console.log(`  ✅ Created default folders for user ${userId}`)
        }
      }
    }

    client.release()
    console.log('✅ Watchlist tables created successfully!')
    
    // Verify tables were created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE 'watchlist%'
      ORDER BY table_name
    `)
    
    console.log('📋 Watchlist tables:', tablesResult.rows.map(r => r.table_name))
    
  } catch (error) {
    console.error('❌ Failed to add watchlist tables:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

addWatchlistTables()