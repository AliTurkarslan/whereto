#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { places, reviews, analyses } from '../lib/db/schema'
import { sql, count, isNotNull, desc, eq } from 'drizzle-orm'

async function finalVerification() {
  console.log('🔍 Final Veri Doğrulama Başlatılıyor...\n')

  // 1. Temel istatistikler
  const [totalPlaces] = await db.select({ count: count() }).from(places)
  const [totalReviews] = await db.select({ count: count() }).from(reviews)
  const [totalAnalyses] = await db.select({ count: count() }).from(analyses)

  console.log('📊 Database İstatistikleri:')
  console.log(`   ✅ Toplam Mekan: ${totalPlaces.count}`)
  console.log(`   ✅ Toplam Yorum: ${totalReviews.count}`)
  console.log(`   ✅ Toplam Analiz: ${totalAnalyses.count}\n`)

  // 2. Yorum verisi kontrolü (raw SQL ile)
  const reviewsWithRating = await db.execute(sql`
    SELECT COUNT(*)::int as count 
    FROM reviews 
    WHERE rating IS NOT NULL
  `)
  const ratingCount = (reviewsWithRating as any).rows?.[0]?.count || (reviewsWithRating as any)[0]?.count || 0

  const reviewsWithPublishTime = await db.execute(sql`
    SELECT COUNT(*)::int as count 
    FROM reviews 
    WHERE publish_time IS NOT NULL
  `)
  const publishTimeCount = (reviewsWithPublishTime as any).rows?.[0]?.count || (reviewsWithPublishTime as any)[0]?.count || 0

  const reviewsWithRelativeTime = await db.execute(sql`
    SELECT COUNT(*)::int as count 
    FROM reviews 
    WHERE relative_publish_time_description IS NOT NULL
  `)
  const relativeTimeCount = (reviewsWithRelativeTime as any).rows?.[0]?.count || (reviewsWithRelativeTime as any)[0]?.count || 0

  console.log('💬 Yorum Verisi Kalitesi:')
  console.log(`   Rating bilgisi olan: ${ratingCount} (${totalReviews.count > 0 ? ((ratingCount / totalReviews.count) * 100).toFixed(1) : 0}%)`)
  console.log(`   publishTime bilgisi olan: ${publishTimeCount} (${totalReviews.count > 0 ? ((publishTimeCount / totalReviews.count) * 100).toFixed(1) : 0}%)`)
  console.log(`   relativePublishTimeDescription bilgisi olan: ${relativeTimeCount} (${totalReviews.count > 0 ? ((relativeTimeCount / totalReviews.count) * 100).toFixed(1) : 0}%)\n`)

  // 3. Örnek yorumlar
  const sampleReviews = await db.execute(sql`
    SELECT r.*, p.name as place_name
    FROM reviews r
    JOIN places p ON r.place_id = p.id
    WHERE r.rating IS NOT NULL
    ORDER BY r.id DESC
    LIMIT 5
  `)
  const reviews = (sampleReviews as any).rows || (sampleReviews as any) || []

  console.log('📋 Örnek Yorumlar (Rating + Tarih Bilgisi ile):')
  reviews.forEach((r: any, idx: number) => {
    console.log(`   ${idx + 1}. ${r.place_name}:`)
    console.log(`      Text: ${r.text.substring(0, 60)}...`)
    console.log(`      Rating: ${r.rating || 'N/A'}`)
    console.log(`      publishTime: ${r.publish_time ? new Date(r.publish_time).toLocaleDateString('tr-TR') : 'Yok'}`)
    console.log(`      Relative: ${r.relative_publish_time_description || 'Yok'}`)
    console.log()
  })

  // 4. Mekan-yorum ilişkisi
  const placesWithReviews = await db.execute(sql`
    SELECT COUNT(DISTINCT place_id)::int as count
    FROM reviews
  `)
  const placesCount = (placesWithReviews as any).rows?.[0]?.count || (placesWithReviews as any)[0]?.count || 0

  console.log('🔗 Mekan-Yorum İlişkisi:')
  console.log(`   Yorumu olan mekan: ${placesCount}`)
  console.log(`   Yorumu olmayan mekan: ${totalPlaces.count - placesCount}\n`)

  // 5. Analiz dağılımı
  const analysesByCompanion = await db.execute(sql`
    SELECT companion, COUNT(*)::int as count
    FROM analyses
    GROUP BY companion
    ORDER BY count DESC
  `)
  const analysesData = (analysesByCompanion as any).rows || (analysesByCompanion as any) || []

  console.log('🤖 Analiz Dağılımı (Companion):')
  analysesData.forEach((a: any) => {
    console.log(`   ${a.companion}: ${a.count}`)
  })
  console.log()

  // 6. Veri bütünlüğü
  const completeReviews = await db.execute(sql`
    SELECT COUNT(*)::int as count
    FROM reviews
    WHERE rating IS NOT NULL 
      AND publish_time IS NOT NULL
      AND text IS NOT NULL
      AND LENGTH(TRIM(text)) > 0
  `)
  const completeCount = (completeReviews as any).rows?.[0]?.count || (completeReviews as any)[0]?.count || 0

  console.log('✅ Tam Veri Kalitesi:')
  console.log(`   Tüm bilgileri olan yorum: ${completeCount} (${totalReviews.count > 0 ? ((completeCount / totalReviews.count) * 100).toFixed(1) : 0}%)\n`)

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

  // 8. Özet
  console.log('='.repeat(60))
  console.log('📊 ÖZET')
  console.log('='.repeat(60))
  console.log(`✅ Mekan: ${totalPlaces.count}`)
  console.log(`✅ Yorum: ${totalReviews.count} (Rating: ${ratingCount}, Tarih: ${publishTimeCount})`)
  console.log(`✅ Analiz: ${totalAnalyses.count}`)
  console.log(`✅ Veri Kalitesi: ${totalReviews.count > 0 ? ((completeCount / totalReviews.count) * 100).toFixed(1) : 0}% tam veri`)
  console.log('='.repeat(60))
  console.log()

  console.log('✅ Final veri doğrulama tamamlandı!')
}

finalVerification().catch(console.error)
