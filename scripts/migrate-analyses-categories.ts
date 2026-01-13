/**
 * Migration Script: Eski kategori sisteminden Google Maps kategorilerine geçiş
 * 
 * Bu script, analyses tablosundaki eski kategorileri (food, coffee, vb.)
 * Google Maps kategorilerine (restaurant, cafe, vb.) çevirir.
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { analyses } from '../lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { LEGACY_CATEGORY_MAPPING } from '../lib/config/google-maps-categories'
import { logger } from '../lib/logging/logger'

/**
 * Eski kategori → Google Maps kategorisi mapping
 */
const categoryMigration: Record<string, string> = {
  food: 'restaurant',
  coffee: 'cafe',
  bar: 'bar',
  haircut: 'hair_salon',
  spa: 'spa',
  shopping: 'clothing_store',
  entertainment: 'amusement_center',
  other: 'restaurant', // Default fallback
}

async function migrateAnalysesCategories() {
  try {
    logger.info('🔄 Analyses kategorileri migration başlatılıyor...')

    // Tüm eski kategorileri bul
    const oldCategories = Object.keys(categoryMigration)
    let totalMigrated = 0

    for (const oldCategory of oldCategories) {
      const newCategory = categoryMigration[oldCategory]

      // Bu kategoriye sahip tüm analyses kayıtlarını bul
      const affectedRows = await db
        .select()
        .from(analyses)
        .where(eq(analyses.category, oldCategory))

      if (affectedRows.length === 0) {
        logger.info(`   ⏭️  ${oldCategory} → ${newCategory}: Kayıt yok, atlanıyor`)
        continue
      }

      // Kategorileri güncelle
      await db
        .update(analyses)
        .set({ category: newCategory })
        .where(eq(analyses.category, oldCategory))

      logger.info(`   ✅ ${oldCategory} → ${newCategory}: ${affectedRows.length} kayıt güncellendi`)
      totalMigrated += affectedRows.length
    }

    // Bilinmeyen kategorileri kontrol et
    const allCategories = await db
      .select({ category: analyses.category })
      .from(analyses)
      .groupBy(analyses.category)

    const unknownCategories = allCategories
      .map(r => r.category)
      .filter(cat => !Object.values(categoryMigration).includes(cat) && !Object.keys(categoryMigration).includes(cat))

    if (unknownCategories.length > 0) {
      logger.warn(`   ⚠️  Bilinmeyen kategoriler bulundu: ${unknownCategories.join(', ')}`)
      logger.warn(`   ⚠️  Bu kategoriler manuel olarak kontrol edilmeli`)
    }

    logger.info(`\n✅ Migration tamamlandı!`)
    logger.info(`   📊 Toplam güncellenen kayıt: ${totalMigrated}`)
    logger.info(`   📊 Bilinmeyen kategori sayısı: ${unknownCategories.length}`)

    if (unknownCategories.length > 0) {
      logger.warn(`\n⚠️  UYARI: Bilinmeyen kategoriler manuel olarak kontrol edilmeli!`)
    }

  } catch (error) {
    logger.error('Migration hatası', error instanceof Error ? error : new Error(String(error)), {})
    process.exit(1)
  }
}

// Script'i çalıştır
if (require.main === module) {
  migrateAnalysesCategories()
    .then(() => {
      logger.info('\n✅ Migration başarıyla tamamlandı!')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('Migration başarısız', error instanceof Error ? error : new Error(String(error)), {})
      process.exit(1)
    })
}

export { migrateAnalysesCategories }



