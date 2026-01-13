#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { places, reviews, analyses } from '../lib/db/schema'
import { sql, count, isNotNull, desc, eq } from 'drizzle-orm'

async function verifyDataTransfer() {
  console.log('🔍 Veri Aktarımı Doğrulama Başlatılıyor...\n')

  // 1. Temel istatistikler
  const [totalPlaces] = await db.select({ count: count() }).from(places)
  const [totalReviews] = await db.select({ count: count() }).from(reviews)
  const [totalAnalyses] = await db.select({ count: count() }).from(analyses)

  console.log('📊 Database İstatistikleri:')
  console.log(`   Toplam Mekan: ${totalPlaces.count}`)
  console.log(`   Toplam Yorum: ${totalReviews.count}`)
  console.log(`   Toplam Analiz: ${totalAnalyses.count}\n`)

  // 2. Yorum verisi kontrolü
  const [reviewsWithRating] = await db
    .select({ count: count() })
    .from(reviews)
    .where(isNotNull(reviews.rating))

  const reviewsWithPublishTime = await db.execute(sql`
    SELECT COUNT(*) as count 
    FROM reviews 
    WHERE publish_time IS NOT NULL
  `)

  const reviewsWithRelativeTime = await db.execute(sql`
    SELECT COUNT(*) as count 
    FROM reviews 
    WHERE relative_publish_time_description IS NOT NULL
  `)

  console.log('💬 Yorum Verisi Kalitesi:')
  console.log(`   Rating bilgisi olan: ${reviewsWithRating.count} (${totalReviews.count > 0 ? ((reviewsWithRating.count / totalReviews.count) * 100).toFixed(1) : 0}%)`)
  console.log(`   publishTime bilgisi olan: ${reviewsWithPublishTime.rows[0]?.count || 0} (${totalReviews.count > 0 ? (((reviewsWithPublishTime.rows[0]?.count || 0) / totalReviews.count) * 100).toFixed(1) : 0}%)`)
  console.log(`   relativePublishTimeDescription bilgisi olan: ${reviewsWithRelativeTime.rows[0]?.count || 0} (${totalReviews.count > 0 ? (((reviewsWithRelativeTime.rows[0]?.count || 0) / totalReviews.count) * 100).toFixed(1) : 0}%)\n`)

  // 3. Örnek yorumlar
  const sampleReviews = await db.execute(sql`
    SELECT r.*, p.name as place_name
    FROM reviews r
    JOIN places p ON r.place_id = p.id
    WHERE r.rating IS NOT NULL
    ORDER BY r.id DESC
    LIMIT 5
  `)

  console.log('📋 Örnek Yorumlar (Rating + Tarih Bilgisi ile):')
  sampleReviews.rows.forEach((r: any, idx: number) => {
    console.log(`   ${idx + 1}. ${r.place_name}:`)
    console.log(`      Text: ${r.text.substring(0, 60)}...`)
    console.log(`      Rating: ${r.rating || 'N/A'}`)
    console.log(`      publishTime: ${r.publish_time ? new Date(r.publish_time).toLocaleDateString('tr-TR') : 'Yok'}`)
    console.log(`      Relative: ${r.relative_publish_time_description || 'Yok'}`)
    console.log()
  })

  // 4. Mekan-yorum ilişkisi
  const placesWithReviews = await db.execute(sql`
    SELECT COUNT(DISTINCT place_id) as count
    FROM reviews
  `)

  console.log('🔗 Mekan-Yorum İlişkisi:')
  console.log(`   Yorumu olan mekan: ${placesWithReviews.rows[0]?.count || 0}`)
  console.log(`   Yorumu olmayan mekan: ${totalPlaces.count - (placesWithReviews.rows[0]?.count || 0)}\n`)

  // 5. Analiz dağılımı
  const analysesByCompanion = await db.execute(sql`
    SELECT companion, COUNT(*) as count
    FROM analyses
    GROUP BY companion
    ORDER BY count DESC
  `)

  console.log('🤖 Analiz Dağılımı (Companion):')
  analysesByCompanion.rows.forEach((a: any) => {
    console.log(`   ${a.companion}: ${a.count}`)
  })
  console.log()

  // 6. Veri bütünlüğü kontrolü
  const completeReviews = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM reviews
    WHERE rating IS NOT NULL 
      AND publish_time IS NOT NULL
      AND text IS NOT NULL
      AND LENGTH(TRIM(text)) > 0
  `)

  console.log('✅ Tam Veri Kalitesi:')
  console.log(`   Tüm bilgileri olan yorum: ${completeReviews.rows[0]?.count || 0} (${totalReviews.count > 0 ? (((completeReviews.rows[0]?.count || 0) / totalReviews.count) * 100).toFixed(1) : 0}%)\n`)

  // 7. Son eklenen mekanlar
  const recentPlaces = await db
    .select()
    .from(places)
    .orderBy(desc(places.createdAt))
    .limit(5)

  console.log('🆕 Son Eklenen 5 Mekan:')
  recentPlaces.forEach((place, idx) => {
    console.log(`   ${idx + 1}. ${place.name} (${place.createdAt?.toLocaleDateString('tr-TR')})`)
  })
  console.log()

  console.log('✅ Veri aktarımı doğrulama tamamlandı!')
}

verifyDataTransfer().catch(console.error)
