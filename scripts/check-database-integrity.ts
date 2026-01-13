#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { places, reviews, analyses } from '../lib/db/schema'
import { sql, count, and, isNotNull, isNull, gte, lt, desc } from 'drizzle-orm'

async function checkDatabaseIntegrity() {
  console.log('🔍 Database Bütünlük Kontrolü Başlatılıyor...\n')

  // 1. Temel istatistikler
  const totalPlaces = await db.select({ count: count() }).from(places)
  const totalReviews = await db.select({ count: count() }).from(reviews)
  const totalAnalyses = await db.select({ count: count() }).from(analyses)

  console.log('📊 Temel İstatistikler:')
  console.log(`   Toplam Mekan: ${totalPlaces[0].count}`)
  console.log(`   Toplam Yorum: ${totalReviews[0].count}`)
  console.log(`   Toplam Analiz: ${totalAnalyses[0].count}\n`)

  // 2. Yorum verileri kontrolü (rating ve tarih bilgisi)
  const reviewsWithRating = await db
    .select({ count: count() })
    .from(reviews)
    .where(isNotNull(reviews.rating))
  
  const reviewsWithDate = await db
    .select({ count: count() })
    .from(reviews)
    .where(isNotNull(reviews.publishTime))

  console.log('💬 Yorum Verileri:')
  console.log(`   Rating bilgisi olan: ${reviewsWithRating[0].count} (${((reviewsWithRating[0].count / totalReviews[0].count) * 100).toFixed(1)}%)`)
  console.log(`   Tarih bilgisi olan: ${reviewsWithDate[0].count} (${((reviewsWithDate[0].count / totalReviews[0].count) * 100).toFixed(1)}%)\n`)

  // 3. Son eklenen mekanlar
  const recentPlaces = await db
    .select()
    .from(places)
    .orderBy(desc(places.createdAt))
    .limit(10)

  console.log('🆕 Son Eklenen 10 Mekan:')
  recentPlaces.forEach((place, idx) => {
    console.log(`   ${idx + 1}. ${place.name} (ID: ${place.id}, ${place.createdAt?.toLocaleDateString('tr-TR')})`)
  })
  console.log()

  // 4. Yorum dağılımı
  const reviewsByPlace = await db
    .select({
      placeId: reviews.placeId,
      count: count(),
      avgRating: sql<number>`AVG(${reviews.rating})`,
      hasDate: sql<number>`COUNT(CASE WHEN ${reviews.publishTime} IS NOT NULL THEN 1 END)`,
    })
    .from(reviews)
    .groupBy(reviews.placeId)
    .orderBy(desc(count()))
    .limit(10)

  console.log('📝 En Çok Yorumu Olan 10 Mekan:')
  reviewsByPlace.forEach((r, idx) => {
    console.log(`   ${idx + 1}. Place ID ${r.placeId}: ${r.count} yorum, Ort. Rating: ${r.avgRating?.toFixed(2) || 'N/A'}, Tarihli: ${r.hasDate}`)
  })
  console.log()

  // 5. Analiz dağılımı
  const analysesByPlace = await db
    .select({
      placeId: analyses.placeId,
      count: count(),
    })
    .from(analyses)
    .groupBy(analyses.placeId)
    .orderBy(desc(count()))
    .limit(10)

  console.log('🤖 En Çok Analizi Olan 10 Mekan:')
  analysesByPlace.forEach((a, idx) => {
    console.log(`   ${idx + 1}. Place ID ${a.placeId}: ${a.count} analiz`)
  })
  console.log()

  // 6. Veri bütünlüğü kontrolü
  const placesWithoutReviews = await db
    .select({ count: count() })
    .from(places)
    .leftJoin(reviews, sql`${places.id} = ${reviews.placeId}`)
    .where(isNull(reviews.placeId))

  const placesWithoutAnalyses = await db
    .select({ count: count() })
    .from(places)
    .leftJoin(analyses, sql`${places.id} = ${analyses.placeId}`)
    .where(isNull(analyses.placeId))

  console.log('🔗 Veri Bütünlüğü:')
  console.log(`   Yorumu olmayan mekan: ${placesWithoutReviews[0].count}`)
  console.log(`   Analizi olmayan mekan: ${placesWithoutAnalyses[0].count}\n`)

  // 7. Örnek yorum kontrolü (rating ve tarih bilgisi ile)
  const sampleReviews = await db
    .select()
    .from(reviews)
    .where(isNotNull(reviews.rating))
    .limit(5)

  console.log('📋 Örnek Yorumlar (Rating + Tarih Bilgisi ile):')
  sampleReviews.forEach((r, idx) => {
    console.log(`   ${idx + 1}. Place ID ${r.placeId}:`)
    console.log(`      Text: ${r.text.substring(0, 50)}...`)
    console.log(`      Rating: ${r.rating}`)
    console.log(`      Tarih: ${r.publishTime?.toLocaleDateString('tr-TR') || 'Yok'}`)
    console.log(`      Relative: ${r.relativePublishTimeDescription || 'Yok'}`)
    console.log()
  })

  console.log('✅ Database bütünlük kontrolü tamamlandı!')
}

checkDatabaseIntegrity().catch(console.error)
