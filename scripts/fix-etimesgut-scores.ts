/**
 * Etimesgut Score Düzeltme Scripti
 * 
 * Analizler tablosundaki score'ları places tablosuna kopyalar
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { places, analyses } from '../lib/db/schema'
import { eq, sql, like } from 'drizzle-orm'
import { logger } from '../lib/logging/logger'

async function fixEtimesgutScores(): Promise<void> {
  logger.info('Etimesgut score düzeltmesi başlatılıyor...')

  try {
    // 1. Etimesgut mekanlarını getir
    const etimesgutPlaces = await db
      .select()
      .from(places)
      .where(like(places.address, '%Etimesgut%'))

    logger.info(`${etimesgutPlaces.length} mekan bulundu`)

    let updated = 0
    let skipped = 0
    let errors = 0

    // 2. Her mekan için analiz kontrolü yap
    for (const place of etimesgutPlaces) {
      try {
        // En son analizi getir
        const analysis = await db
          .select()
          .from(analyses)
          .where(eq(analyses.placeId, place.id))
          .orderBy(sql`${analyses.createdAt} DESC`)
          .limit(1)

        if (analysis.length === 0) {
          logger.warn(`Mekan ${place.id} (${place.name}) için analiz bulunamadı`)
          skipped++
          continue
        }

        const latestAnalysis = analysis[0]

        // Score varsa ve places tablosunda yoksa veya farklıysa güncelle
        if (latestAnalysis.score !== null && latestAnalysis.score !== undefined) {
          if (place.score === null || place.score === undefined || place.score !== latestAnalysis.score) {
            // Sadece score'u güncelle (why ve risks alanları zaten var)
            await db
              .update(places)
              .set({
                score: latestAnalysis.score,
              })
              .where(eq(places.id, place.id))

            updated++
            logger.info(`✅ Mekan ${place.id} (${place.name}) güncellendi: score=${latestAnalysis.score}`)
          } else {
            skipped++
          }
        } else {
          logger.warn(`Mekan ${place.id} (${place.name}) için analiz score'u yok`)
          skipped++
        }
      } catch (error) {
        errors++
        logger.error(`Mekan ${place.id} güncellenirken hata`, error instanceof Error ? error : new Error(String(error)))
      }
    }

    console.log('\n' + '='.repeat(80))
    console.log('📊 SCORE DÜZELTME RAPORU')
    console.log('='.repeat(80))
    console.log(`✅ Güncellenen: ${updated}`)
    console.log(`⏭️  Atlanan: ${skipped}`)
    console.log(`❌ Hatalar: ${errors}`)
    console.log('='.repeat(80) + '\n')

    logger.info(`Score düzeltmesi tamamlandı: ${updated} güncellendi, ${skipped} atlandı, ${errors} hata`)

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

