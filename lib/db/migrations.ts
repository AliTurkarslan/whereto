import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db } from './index'

export function runMigrations() {
  migrate(db, { migrationsFolder: './drizzle' })
  console.log('✅ Database migrations completed')
}


