#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { places, reviews, analyses } from '../lib/db/schema'
import { sql, count, isNotNull, isNull, desc, eq, and, gte } from 'drizzle-orm'

async function checkSyncResults() {
  console.log('🔍 Sync Sonuçları Kontrolü Başlatılıyor...\n')

  // 1. Toplam veriler
  const totalPlaces = await db.select({ count: count() }).from(places)
  const totalReviews = await db.select({ count: count() }).from(reviews)
  const totalAnalyses = await db.select({ count: count() }).from(analyses)

  console.log('📊 Toplam Veriler:')
  console.log(`   Mekan: ${totalPlaces[0].count}`)
  console.log(`   Yorum: ${totalReviews[0].count}`)
  console.log(`   Analiz: ${totalAnalyses[0].count}\n`)

  // 2. Yorum verisi kalitesi
  const reviewsWithRating = await db
    .select({ count: count() })
    .from(reviews)
    .where(isNotNull(reviews.rating))

  const reviewsWithPublishTime = await db
    .select({ count: count() })
    .from(reviews)
    .where(isNotNull(sql`${reviews.publishTime}`))

  console.log('💬 Yorum Verisi Kalitesi:')
  console.log(`   Rating bilgisi olan: ${reviewsWithRating[0].count} (${totalReviews[0].count > 0 ? ((reviewsWithRating[0].count / totalReviews[0].count) * 100).toFixed(1) : 0}%)`)
  console.log(`   Tarih bilgisi olan: ${reviewsWithPublishTime[0].count} (${totalReviews[0].count > 0 ? ((reviewsWithPublishTime[0].count / totalReviews[0].count) * 100).toFixed(1) : 0}%)\n`)

  // 3. Örnek yorumlar
  const sampleReviews = await db
    .select()
    .from(reviews)
    .where(isNotNull(reviews.rating))
    .limit(5)

  console.log('📋 Örnek Yorumlar:')
  for (const r of sampleReviews) {
    const place = await db.select().from(places).where(eq(places.id, r.placeId)).limit(1)
    console.log(`   ${place[0]?.name || 'Unknown'}:`)
    console.log(`      Text: ${r.text.substring(0, 60)}...`)
    console.log(`      Rating: ${r.rating || 'N/A'}`)
    console.log(`      Tarih: ${r.publishTime ? new Date(r.publishTime).toLocaleDateString('tr-TR') : 'Yok'}`)
    console.log()
  }

  // 4. Mekan-yorum ilişkisi
  const placesWithReviews = await db
    .select({
      placeId: reviews.placeId,
      reviewCount: count(),
    })
    .from(reviews)
    .groupBy(reviews.placeId)
    .orderBy(desc(count()))

  console.log('🔗 Mekan-Yorum İlişkisi:')
  console.log(`   Yorumu olan mekan: ${placesWithReviews.length}`)
  console.log(`   Yorumu olmayan mekan: ${totalPlaces[0].count - placesWithReviews.length}\n`)

  // 5. Analiz dağılımı
  const analysesByCompanion = await db
    .select({
      companion: analyses.companion,
      count: count(),
    })
    .from(analyses)
    .groupBy(analyses.companion)

  console.log('🤖 Analiz Dağılımı (Companion):')
  analysesByCompanion.forEach(a => {
    console.log(`   ${a.companion}: ${a.count}`)
  })
  console.log()

  // 6. Veri bütünlüğü
  const completeData = await db
    .select({
      placeId: reviews.placeId,
      hasRating: sql<number>`COUNT(CASE WHEN ${reviews.rating} IS NOT NULL THEN 1 END)`,
      hasDate: sql<number>`COUNT(CASE WHEN ${sql`${reviews.publishTime}`} IS NOT NULL THEN 1 END)`,
      total: count(),
    })
    .from(reviews)
    .groupBy(reviews.placeId)
    .having(sql`COUNT(CASE WHEN ${reviews.rating} IS NOT NULL THEN 1 END) = COUNT(*) AND COUNT(CASE WHEN ${sql`${reviews.publishTime}`} IS NOT NULL THEN 1 END) = COUNT(*)`)

  console.log('✅ Tam Veri Kalitesi:')
  console.log(`   Tüm yorumları rating + tarih bilgisi olan mekan: ${completeData.length}\n`)

  console.log('✅ Sync sonuçları kontrolü tamamlandı!')
}

checkSyncResults().catch(console.error)
