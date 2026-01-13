#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { places, reviews, analyses } from '../lib/db/schema'
import { sql, count, and, isNotNull, isNull, gte, desc, eq } from 'drizzle-orm'

async function verifySyncData() {
  console.log('🔍 Sync Verileri Doğrulama Başlatılıyor...\n')

  // 1. Son 24 saatte eklenen/güncellenen mekanlar
  const yesterday = new Date()
  yesterday.setHours(yesterday.getHours() - 24)

  const recentPlaces = await db
    .select()
    .from(places)
    .where(gte(places.createdAt, yesterday))
    .orderBy(desc(places.createdAt))

  console.log('🆕 Son 24 Saatte Eklenen Mekanlar:')
  console.log(`   Toplam: ${recentPlaces.length}\n`)
  
  if (recentPlaces.length > 0) {
    recentPlaces.slice(0, 10).forEach((place, idx) => {
      console.log(`   ${idx + 1}. ${place.name} (${place.createdAt?.toLocaleString('tr-TR')})`)
    })
    console.log()
  }

  // 2. Son 24 saatte eklenen yorumlar
  const recentReviews = await db
    .select()
    .from(reviews)
    .where(gte(reviews.createdAt, yesterday))
    .orderBy(desc(reviews.createdAt))

  console.log('💬 Son 24 Saatte Eklenen Yorumlar:')
  console.log(`   Toplam: ${recentReviews.length}\n`)

  const reviewsWithRating = recentReviews.filter(r => r.rating !== null)
  const reviewsWithDate = recentReviews.filter(r => r.publishTime !== null)

  console.log(`   Rating bilgisi olan: ${reviewsWithRating.length} (${recentReviews.length > 0 ? ((reviewsWithRating.length / recentReviews.length) * 100).toFixed(1) : 0}%)`)
  console.log(`   Tarih bilgisi olan: ${reviewsWithDate.length} (${recentReviews.length > 0 ? ((reviewsWithDate.length / recentReviews.length) * 100).toFixed(1) : 0}%)\n`)

  if (recentReviews.length > 0) {
    console.log('📋 Örnek Yeni Yorumlar:')
    recentReviews.slice(0, 5).forEach((r, idx) => {
      console.log(`   ${idx + 1}. Place ID ${r.placeId}:`)
      console.log(`      Text: ${r.text.substring(0, 60)}...`)
      console.log(`      Rating: ${r.rating || 'Yok'}`)
      console.log(`      Tarih: ${r.publishTime?.toLocaleDateString('tr-TR') || 'Yok'}`)
      console.log()
    })
  }

  // 3. Son 24 saatte eklenen analizler
  const recentAnalyses = await db
    .select()
    .from(analyses)
    .where(gte(analyses.createdAt, yesterday))
    .orderBy(desc(analyses.createdAt))

  console.log('🤖 Son 24 Saatte Eklenen Analizler:')
  console.log(`   Toplam: ${recentAnalyses.length}\n`)

  if (recentAnalyses.length > 0) {
    const byCategory = new Map<string, number>()
    const byCompanion = new Map<string, number>()

    recentAnalyses.forEach(a => {
      byCategory.set(a.category, (byCategory.get(a.category) || 0) + 1)
      byCompanion.set(a.companion, (byCompanion.get(a.companion) || 0) + 1)
    })

    console.log('   Kategori Dağılımı:')
    Array.from(byCategory.entries()).forEach(([cat, count]) => {
      console.log(`      ${cat}: ${count}`)
    })
    console.log()

    console.log('   Companion Dağılımı:')
    Array.from(byCompanion.entries()).forEach(([comp, count]) => {
      console.log(`      ${comp}: ${count}`)
    })
    console.log()
  }

  // 4. Veri kalitesi kontrolü
  const allReviews = await db.select().from(reviews).limit(1000)
  const reviewsWithAllData = allReviews.filter(r => 
    r.rating !== null && 
    r.publishTime !== null && 
    r.text && 
    r.text.trim().length > 0
  )

  console.log('📊 Veri Kalitesi:')
  console.log(`   Toplam yorum kontrol edildi: ${allReviews.length}`)
  console.log(`   Tüm bilgileri olan yorum: ${reviewsWithAllData.length} (${allReviews.length > 0 ? ((reviewsWithAllData.length / allReviews.length) * 100).toFixed(1) : 0}%)\n`)

  // 5. Place Details kontrolü
  const placesWithGoogleMapsId = await db
    .select({ count: count() })
    .from(places)
    .where(isNotNull(places.googleMapsId))

  console.log('🗺️  Google Maps Entegrasyonu:')
  console.log(`   Google Maps ID'si olan mekan: ${placesWithGoogleMapsId[0].count}\n`)

  console.log('✅ Sync verileri doğrulama tamamlandı!')
}

verifySyncData().catch(console.error)
