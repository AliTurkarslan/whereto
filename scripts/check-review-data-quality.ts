#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { reviews, places } from '../lib/db/schema'
import { sql, count, isNotNull, isNull, desc, eq } from 'drizzle-orm'

async function checkReviewDataQuality() {
  console.log('🔍 Yorum Verisi Kalite Kontrolü Başlatılıyor...\n')

  // 1. Toplam yorum sayısı
  const totalReviews = await db.select({ count: count() }).from(reviews)
  console.log(`📊 Toplam Yorum: ${totalReviews[0].count}\n`)

  // 2. Rating bilgisi dağılımı
  const ratingDistribution = await db
    .select({
      rating: reviews.rating,
      count: count(),
    })
    .from(reviews)
    .where(isNotNull(reviews.rating))
    .groupBy(reviews.rating)
    .orderBy(reviews.rating)

  console.log('⭐ Rating Dağılımı:')
  ratingDistribution.forEach(r => {
    const percentage = (r.count / totalReviews[0].count) * 100
    console.log(`   ${r.rating} yıldız: ${r.count} (${percentage.toFixed(1)}%)`)
  })
  console.log()

  // 3. Tarih bilgisi kontrolü
  const reviewsWithDate = await db
    .select({ count: count() })
    .from(reviews)
    .where(isNotNull(reviews.publishTime))

  const reviewsWithRelativeDate = await db
    .select({ count: count() })
    .from(reviews)
    .where(isNotNull(reviews.relativePublishTimeDescription))

  console.log('📅 Tarih Bilgisi:')
  console.log(`   publishTime olan: ${reviewsWithDate[0].count} (${((reviewsWithDate[0].count / totalReviews[0].count) * 100).toFixed(1)}%)`)
  console.log(`   relativePublishTimeDescription olan: ${reviewsWithRelativeDate[0].count} (${((reviewsWithRelativeDate[0].count / totalReviews[0].count) * 100).toFixed(1)}%)\n`)

  // 4. Son yorumlar (tarih bilgisi ile)
  const recentReviews = await db
    .select()
    .from(reviews)
    .where(isNotNull(reviews.publishTime))
    .orderBy(desc(reviews.publishTime))
    .limit(10)

  console.log('🆕 En Yeni 10 Yorum (Tarih Bilgisi ile):')
  recentReviews.forEach((r, idx) => {
    const place = await db.select().from(places).where(eq(places.id, r.placeId)).limit(1)
    console.log(`   ${idx + 1}. ${place[0]?.name || 'Unknown'} (${r.publishTime?.toLocaleDateString('tr-TR')})`)
    console.log(`      Rating: ${r.rating || 'N/A'}, Text: ${r.text.substring(0, 50)}...`)
  })
  console.log()

  // 5. Mekan başına yorum istatistikleri
  const reviewsByPlace = await db
    .select({
      placeId: reviews.placeId,
      totalCount: count(),
      withRating: sql<number>`COUNT(CASE WHEN ${reviews.rating} IS NOT NULL THEN 1 END)`,
      withDate: sql<number>`COUNT(CASE WHEN ${reviews.publishTime} IS NOT NULL THEN 1 END)`,
    })
    .from(reviews)
    .groupBy(reviews.placeId)
    .orderBy(desc(count()))
    .limit(10)

  console.log('📝 En Çok Yorumu Olan 10 Mekan:')
  for (const r of reviewsByPlace) {
    const place = await db.select().from(places).where(eq(places.id, r.placeId)).limit(1)
    console.log(`   ${place[0]?.name || 'Unknown'}:`)
    console.log(`      Toplam: ${r.totalCount}, Rating'li: ${r.withRating}, Tarihli: ${r.withDate}`)
  }
  console.log()

  // 6. Veri eksikliği analizi
  const reviewsWithoutRating = await db
    .select({ count: count() })
    .from(reviews)
    .where(isNull(reviews.rating))

  const reviewsWithoutDate = await db
    .select({ count: count() })
    .from(reviews)
    .where(isNull(reviews.publishTime))

  console.log('⚠️  Eksik Veriler:')
  console.log(`   Rating bilgisi olmayan: ${reviewsWithoutRating[0].count} (${((reviewsWithoutRating[0].count / totalReviews[0].count) * 100).toFixed(1)}%)`)
  console.log(`   Tarih bilgisi olmayan: ${reviewsWithoutDate[0].count} (${((reviewsWithoutDate[0].count / totalReviews[0].count) * 100).toFixed(1)}%)\n`)

  // 7. Tam veri kalitesi
  const completeReviews = await db
    .select({ count: count() })
    .from(reviews)
    .where(
      and(
        isNotNull(reviews.rating),
        isNotNull(reviews.publishTime),
        isNotNull(reviews.text)
      )
    )

  console.log('✅ Tam Veri Kalitesi:')
  console.log(`   Tüm bilgileri olan yorum: ${completeReviews[0].count} (${((completeReviews[0].count / totalReviews[0].count) * 100).toFixed(1)}%)\n`)

  console.log('✅ Yorum verisi kalite kontrolü tamamlandı!')
}

checkReviewDataQuality().catch(console.error)
