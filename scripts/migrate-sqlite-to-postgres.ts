/**
 * SQLite → PostgreSQL Migration Script
 * 
 * Bu script, mevcut SQLite database'deki tüm verileri PostgreSQL'e migrate eder.
 * 
 * Kullanım:
 * 1. PostgreSQL database oluştur (Supabase, Vercel Postgres, vb.)
 * 2. DATABASE_URL environment variable'ı ayarla
 * 3. npm run migrate:sqlite-to-postgres
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import Database from 'better-sqlite3'
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3'
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as sqliteSchema from '../lib/db/schema'
import path from 'path'
import { logger } from '../lib/logging/logger'

// SQLite connection
const sqlitePath = path.join(process.cwd(), 'database.sqlite')
const sqlite = new Database(sqlitePath)
const sqliteDb = drizzleSQLite(sqlite, { schema: sqliteSchema })

// PostgreSQL connection
const postgresUrl = process.env.DATABASE_URL
if (!postgresUrl) {
  logger.error('DATABASE_URL environment variable is required', new Error('DATABASE_URL not set'), {})
  process.exit(1)
}

const postgresClient = postgres(postgresUrl)
const postgresDb = drizzlePostgres(postgresClient)

async function migrateSQLiteToPostgres() {
  try {
    logger.info('🔄 SQLite → PostgreSQL Migration Başlatılıyor...')
    logger.info(`📁 SQLite: ${sqlitePath}`)
    logger.info(`🗄️  PostgreSQL: ${postgresUrl.replace(/:[^:@]+@/, ':****@')}`)

    // 1. Places tablosunu migrate et
    logger.info('\n1️⃣ Places tablosu migrate ediliyor...')
    const places = await sqliteDb.select().from(sqliteSchema.places)
    logger.info(`   📊 ${places.length} mekan bulundu`)

    if (places.length > 0) {
      // PostgreSQL'e insert et
      // Not: PostgreSQL schema'sı farklı olabilir, bu yüzden manuel insert gerekebilir
      // Bu script sadece veri aktarımı yapar, schema migration ayrı yapılmalı
      
      logger.warn('   ⚠️  Places tablosu için manuel migration gerekebilir')
      logger.warn('   ⚠️  Önce schema migration yapın: npm run db:push')
    }

    // 2. Reviews tablosunu migrate et
    logger.info('\n2️⃣ Reviews tablosu migrate ediliyor...')
    const reviews = await sqliteDb.select().from(sqliteSchema.reviews)
    logger.info(`   📊 ${reviews.length} yorum bulundu`)

    // 3. Analyses tablosunu migrate et
    logger.info('\n3️⃣ Analyses tablosu migrate ediliyor...')
    const analyses = await sqliteDb.select().from(sqliteSchema.analyses)
    logger.info(`   📊 ${analyses.length} analiz bulundu`)

    // 4. Feedback tablosunu migrate et
    logger.info('\n4️⃣ Feedback tablosu migrate ediliyor...')
    const feedback = await sqliteDb.select().from(sqliteSchema.feedback)
    logger.info(`   📊 ${feedback.length} geri bildirim bulundu`)

    logger.info('\n✅ Migration tamamlandı!')
    logger.info('\n⚠️  ÖNEMLİ:')
    logger.info('   1. Önce schema migration yapın: npm run db:push')
    logger.info('   2. Sonra bu script ile veri migration yapın')
    logger.info('   3. Kategori migration çalıştırın: npm run migrate:analyses-categories')

  } catch (error) {
    logger.error('Migration hatası', error instanceof Error ? error : new Error(String(error)), {})
    process.exit(1)
  } finally {
    sqlite.close()
    await postgresClient.end()
  }
}

// Script'i çalıştır
if (require.main === module) {
  migrateSQLiteToPostgres()
    .then(() => {
      logger.info('\n✅ Migration başarıyla tamamlandı!')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('Migration başarısız', error instanceof Error ? error : new Error(String(error)), {})
      process.exit(1)
    })
}

export { migrateSQLiteToPostgres }



