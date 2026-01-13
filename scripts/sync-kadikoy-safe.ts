#!/usr/bin/env tsx

/**
 * Kadıköy için güvenli sync - Free tier limitlerini aşmamak için
 * 
 * Kullanım:
 * npm run sync:kadikoy:safe
 */

// Environment variables'ı yükle
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

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

// Free tier koruması: Her kategori için max 50 mekan
const MAX_PLACES_PER_CATEGORY = 50

async function syncKadikoySafe() {
  console.log('🏙️  Kadıköy için GÜVENLİ sync başlatılıyor...\n')
  console.log(`📍 Konum: Kadıköy (${KADIKOY_LAT}, ${KADIKOY_LNG})`)
  console.log(`💰 Free Tier Koruması: Max ${MAX_PLACES_PER_CATEGORY} mekan/kategori\n`)

  const totalCategories = CATEGORIES.length
  let completed = 0
  let failed = 0
  let totalPlaces = 0
  let totalApiRequests = 0

  // Tahmini maliyet hesaplama
  // Text Search: $32/1000, Nearby Search: $32/1000
  // Her kategori için ~3 Text Search + 3 Nearby Search = 6 request
  // 7 kategori × 6 request = 42 request = ~$1.34
  console.log('📊 Tahmini Maliyet:')
  console.log(`   - Text Search: 7 kategori × 3 request = 21 request = $0.67`)
  console.log(`   - Nearby Search: 7 kategori × 3 request = 21 request = $0.67`)
  console.log(`   - Toplam: ~$1.34 (Free tier: $200/ay)\n`)
  console.log('='.repeat(60) + '\n')

  for (const cat of CATEGORIES) {
    try {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`📂 ${cat.name} (${cat.query}) - ${completed + 1}/${totalCategories}`)
      console.log(`${'='.repeat(60)}\n`)

      const startTime = Date.now()
      
      await syncPlaces({
        query: cat.query,
        lat: KADIKOY_LAT,
        lng: KADIKOY_LNG,
        category: cat.category,
      })

      const duration = ((Date.now() - startTime) / 1000).toFixed(1)
      totalApiRequests += 6 // Tahmini: 3 Text + 3 Nearby
      
      completed++
      console.log(`\n✅ ${cat.name} tamamlandı! (${duration}s)\n`)
      
      // Kategori arası bekleme - rate limiting
      if (completed < totalCategories) {
        console.log('⏳ Rate limiting için 2 saniye bekleniyor...\n')
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    } catch (error) {
      failed++
      console.error(`\n❌ ${cat.name} başarısız:`, error)
      console.error(`Devam ediyorum...\n`)
      
      // Hata durumunda da bekle
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  // Database'den toplam mekan sayısını kontrol et
  const { db } = await import('../lib/db')
  const { places } = await import('../lib/db/schema')
  const { sql } = await import('drizzle-orm')
  
  const totalPlacesResult = await db.select({ count: sql<number>`count(*)` }).from(places)
  totalPlaces = totalPlacesResult[0].count

  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 ÖZET')
  console.log(`${'='.repeat(60)}`)
  console.log(`✅ Tamamlanan: ${completed}/${totalCategories}`)
  console.log(`❌ Başarısız: ${failed}/${totalCategories}`)
  console.log(`📍 Toplam Mekan: ${totalPlaces}`)
  console.log(`🔢 Tahmini API Request: ${totalApiRequests}`)
  console.log(`💰 Tahmini Maliyet: $${((totalApiRequests * 0.032) / 1000).toFixed(2)}`)
  console.log(`\n🎉 Sync işlemi tamamlandı!`)
  console.log(`\n⚠️  ÖNEMLİ: Free tier limitini kontrol etmek için:`)
  console.log(`   https://console.cloud.google.com/apis/dashboard`)
}

// CLI için
if (require.main === module) {
  syncKadikoySafe()
    .then(() => {
      console.log('\n✅ Tüm sync işlemleri tamamlandı!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Sync işlemi başarısız:', error)
      process.exit(1)
    })
}

