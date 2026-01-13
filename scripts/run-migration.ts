#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { sql } from 'drizzle-orm'

async function runMigration() {
  console.log('🔄 Migration başlatılıyor...\n')

  try {
    // Check if publish_time column exists
    const checkColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'reviews' AND column_name = 'publish_time'
    `)

    if (checkColumn.rows.length === 0) {
      console.log('➕ publish_time kolonu ekleniyor...')
      await db.execute(sql`ALTER TABLE reviews ADD COLUMN publish_time TIMESTAMP`)
      console.log('✅ publish_time kolonu eklendi\n')
    } else {
      console.log('ℹ️  publish_time kolonu zaten var\n')
    }

    // Check if relative_publish_time_description column exists
    const checkColumn2 = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'reviews' AND column_name = 'relative_publish_time_description'
    `)

    if (checkColumn2.rows.length === 0) {
      console.log('➕ relative_publish_time_description kolonu ekleniyor...')
      await db.execute(sql`ALTER TABLE reviews ADD COLUMN relative_publish_time_description TEXT`)
      console.log('✅ relative_publish_time_description kolonu eklendi\n')
    } else {
      console.log('ℹ️  relative_publish_time_description kolonu zaten var\n')
    }

    console.log('✅ Migration tamamlandı!')
  } catch (error) {
    console.error('❌ Migration hatası:', error)
    process.exit(1)
  }
}

runMigration().catch(console.error)
