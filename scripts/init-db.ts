#!/usr/bin/env tsx

/**
 * Database'i initialize et ve migration'ları çalıştır
 */

import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import path from 'path'
import * as schema from '../lib/db/schema'

const dbPath = path.join(process.cwd(), 'database.sqlite')
const sqlite = new Database(dbPath)
const db = drizzle(sqlite, { schema })

console.log('🔄 Running database migrations...')
migrate(db, { migrationsFolder: './drizzle' })
console.log('✅ Database initialized successfully')

sqlite.close()


