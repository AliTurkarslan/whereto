import { db } from '../lib/db'
import { sql } from 'drizzle-orm'

async function migrateFeedbackTable() {
  try {
    console.log('Creating feedback table...')
    
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rating INTEGER NOT NULL,
        category TEXT NOT NULL,
        feedback TEXT NOT NULL,
        issues TEXT,
        user_agent TEXT,
        url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `)

    console.log('✅ Feedback table created successfully!')
  } catch (error) {
    console.error('❌ Error creating feedback table:', error)
    throw error
  }
}

migrateFeedbackTable()
  .then(() => {
    console.log('Migration completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })



