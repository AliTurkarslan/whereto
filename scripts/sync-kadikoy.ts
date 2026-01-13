#!/usr/bin/env tsx

/**
 * Kadıköy için tüm kategorileri sync et
 * 
 * Kullanım:
 * npm run sync:kadikoy
 */

import { syncPlaces } from './sync-places'

// Kadıköy koordinatları
const KADIKOY_LAT = 40.9833
const KADIKOY_LNG = 29.0167

// Kategoriler ve Google Maps query'leri
const CATEGORIES = [
  { category: 'food', query: 'restaurant', name: 'Restoran' },
  { category: 'coffee', query: 'cafe', name: 'Kafe' },
  { category: 'bar', query: 'bar', name: 'Bar' },
  { category: 'haircut', query: 'hair salon', name: 'Kuaför' },
  { category: 'spa', query: 'spa', name: 'Spa & Masaj' },
  { category: 'shopping', query: 'shopping', name: 'Alışveriş' },
  { category: 'entertainment', query: 'entertainment', name: 'Eğlence' },
]

async function syncKadikoy() {
  console.log('🏙️  Kadıköy için tüm kategorileri sync ediyorum...\n')
  console.log(`📍 Konum: Kadıköy (${KADIKOY_LAT}, ${KADIKOY_LNG})\n`)

  const totalCategories = CATEGORIES.length
  let completed = 0
  let failed = 0

  for (const cat of CATEGORIES) {
    try {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`📂 ${cat.name} (${cat.query}) - ${completed + 1}/${totalCategories}`)
      console.log(`${'='.repeat(60)}\n`)

      await syncPlaces({
        query: cat.query,
        lat: KADIKOY_LAT,
        lng: KADIKOY_LNG,
        category: cat.category,
      })

      completed++
      console.log(`\n✅ ${cat.name} tamamlandı!\n`)
    } catch (error) {
      failed++
      console.error(`\n❌ ${cat.name} başarısız:`, error)
      console.error(`Devam ediyorum...\n`)
    }

    // Rate limiting için kısa bir bekleme
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 ÖZET')
  console.log(`${'='.repeat(60)}`)
  console.log(`✅ Tamamlanan: ${completed}/${totalCategories}`)
  console.log(`❌ Başarısız: ${failed}/${totalCategories}`)
  console.log(`\n🎉 Sync işlemi tamamlandı!`)
}

// CLI için
if (require.main === module) {
  syncKadikoy()
    .then(() => {
      console.log('\n✅ Tüm sync işlemleri tamamlandı!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Sync işlemi başarısız:', error)
      process.exit(1)
    })
}


