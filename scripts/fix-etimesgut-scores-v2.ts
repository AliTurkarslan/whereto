/**
 * Etimesgut Score Düzeltme Scripti V2
 * 
 * Analizler tablosundaki score'ları places tablosuna kopyalar
 * SQL ile direkt güncelleme yapar
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import Database from 'better-sqlite3'
import path from 'path'
import { logger } from '../lib/logging/logger'

async function fixEtimesgutScores(): Promise<void> {
  logger.info('Etimesgut score düzeltmesi başlatılıyor (SQL ile)...')

  try {
    // SQLite instance'ı oluştur
    const dbPath = path.join(process.cwd(), 'database.sqlite')
    const sqlite = new Database(dbPath)

    // SQL ile direkt güncelleme: Analizler tablosundaki en son score'u places tablosuna kopyala
    const result = sqlite.prepare(`
      UPDATE places
      SET score = (
        SELECT score
        FROM analyses
        WHERE analyses.place_id = places.id
        ORDER BY analyses.created_at DESC
        LIMIT 1
      )
      WHERE places.address LIKE '%Etimesgut%'
        AND places.score IS NULL
        AND EXISTS (
          SELECT 1
          FROM analyses
          WHERE analyses.place_id = places.id
            AND analyses.score IS NOT NULL
        )
    `).run()

    const updated = result.changes || 0
    
    sqlite.close()

    console.log('\n' + '='.repeat(80))
    console.log('📊 SCORE DÜZELTME RAPORU (SQL)')
    console.log('='.repeat(80))
    console.log(`✅ Güncellenen: ${updated} mekan`)
    console.log('='.repeat(80) + '\n')

    logger.info(`Score düzeltmesi tamamlandı: ${updated} mekan güncellendi`)

  } catch (error) {
    logger.error('Score düzeltmesi sırasında hata oluştu', error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

// Script çalıştır
fixEtimesgutScores()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Hata:', error)
    process.exit(1)
  })

