#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { places, reviews, analyses } from '../lib/db/schema'
import { sql, count, isNotNull, desc, eq } from 'drizzle-orm'

async function deepSystemAnalysis() {
  console.log('🔍 Derin Sistem Analizi Başlatılıyor...\n')

  // 1. Analiz kapsamı detaylı kontrol
  console.log('1️⃣  Analiz Kapsamı Detaylı Kontrol...')
  try {
    const totalPlaces = await db.select({ count: count() }).from(places)
    const totalAnalyses = await db.select({ count: count() }).from(analyses)
    
    // Analizleri place_id'ye göre grupla
    const analysesByPlace = await db.execute(sql`
      SELECT place_id, COUNT(*)::int as count
      FROM analyses
      GROUP BY place_id
    `)
    const analysesData = (analysesByPlace as any).rows || []
    
    console.log(`   Toplam Mekan: ${totalPlaces[0].count}`)
    console.log(`   Toplam Analiz: ${totalAnalyses[0].count}`)
    console.log(`   Analiz edilmiş mekan: ${analysesData.length}`)
    console.log(`   Analiz kapsamı: ${((analysesData.length / totalPlaces[0].count) * 100).toFixed(1)}%`)
    
    // Companion dağılımı
    const companionDist = await db.execute(sql`
      SELECT companion, COUNT(*)::int as count
      FROM analyses
      GROUP BY companion
      ORDER BY count DESC
    `)
    const companionData = (companionDist as any).rows || []
    console.log(`   Companion dağılımı:`)
    companionData.forEach((c: any) => {
      console.log(`      ${c.companion}: ${c.count}`)
    })
  } catch (error) {
    console.error(`   ❌ Hata: ${error}`)
  }
  console.log()

  // 2. Yorum kalitesi detaylı kontrol
  console.log('2️⃣  Yorum Kalitesi Detaylı Kontrol...')
  try {
    const totalReviews = await db.select({ count: count() }).from(reviews)
    const reviewsWithRating = await db.execute(sql`
      SELECT COUNT(*)::int as count 
      FROM reviews 
      WHERE rating IS NOT NULL
    `)
    const reviewsWithDate = await db.execute(sql`
      SELECT COUNT(*)::int as count 
      FROM reviews 
      WHERE publish_time IS NOT NULL
    `)
    
    const ratingCount = (reviewsWithRating as any).rows?.[0]?.count || 0
    const dateCount = (reviewsWithDate as any).rows?.[0]?.count || 0
    
    console.log(`   Toplam Yorum: ${totalReviews[0].count}`)
    console.log(`   Rating bilgisi olan: ${ratingCount} (${((ratingCount / totalReviews[0].count) * 100).toFixed(1)}%)`)
    console.log(`   Tarih bilgisi olan: ${dateCount} (${((dateCount / totalReviews[0].count) * 100).toFixed(1)}%)`)
    
    // Yorum uzunlukları
    const avgLength = await db.execute(sql`
      SELECT AVG(LENGTH(text))::numeric as avg_length
      FROM reviews
    `)
    const avgLen = (avgLength as any).rows?.[0]?.avg_length || 0
    console.log(`   Ortalama yorum uzunluğu: ${parseFloat(avgLen).toFixed(0)} karakter`)
  } catch (error) {
    console.error(`   ❌ Hata: ${error}`)
  }
  console.log()

  // 3. Mekan-yorum ilişkisi
  console.log('3️⃣  Mekan-Yorum İlişkisi...')
  try {
    const placesWithReviews = await db.execute(sql`
      SELECT COUNT(DISTINCT place_id)::int as count
      FROM reviews
    `)
    const placesWithAnalyses = await db.execute(sql`
      SELECT COUNT(DISTINCT place_id)::int as count
      FROM analyses
    `)
    
    const reviewsCount = (placesWithReviews as any).rows?.[0]?.count || 0
    const analysesCount = (placesWithAnalyses as any).rows?.[0]?.count || 0
    const totalPlaces = await db.select({ count: count() }).from(places)
    
    console.log(`   Yorumu olan mekan: ${reviewsCount} (${((reviewsCount / totalPlaces[0].count) * 100).toFixed(1)}%)`)
    console.log(`   Analizi olan mekan: ${analysesCount} (${((analysesCount / totalPlaces[0].count) * 100).toFixed(1)}%)`)
  } catch (error) {
    console.error(`   ❌ Hata: ${error}`)
  }
  console.log()

  // 4. Örnek mekan kontrolü
  console.log('4️⃣  Örnek Mekan Kontrolü...')
  try {
    const samplePlace = await db
      .select()
      .from(places)
      .limit(1)
    
    if (samplePlace.length > 0) {
      const place = samplePlace[0]
      console.log(`   Örnek Mekan: ${place.name}`)
      console.log(`   Rating: ${place.rating || 'Yok'}`)
      console.log(`   Review Count: ${place.reviewCount || 0}`)
      console.log(`   Google Maps ID: ${place.googleMapsId ? 'Var' : 'Yok'}`)
      
      // Bu mekanın yorumları
      const placeReviews = await db
        .select()
        .from(reviews)
        .where(eq(reviews.placeId, place.id))
        .limit(3)
      
      console.log(`   Yorum sayısı: ${placeReviews.length}`)
      if (placeReviews.length > 0) {
        console.log(`   İlk yorum: ${placeReviews[0].text.substring(0, 50)}...`)
        console.log(`   Rating: ${placeReviews[0].rating || 'Yok'}`)
      }
      
      // Bu mekanın analizleri
      const placeAnalyses = await db
        .select()
        .from(analyses)
        .where(eq(analyses.placeId, place.id))
        .limit(3)
      
      console.log(`   Analiz sayısı: ${placeAnalyses.length}`)
      if (placeAnalyses.length > 0) {
        console.log(`   İlk analiz score: ${placeAnalyses[0].score}`)
        console.log(`   Companion: ${placeAnalyses[0].companion}`)
        console.log(`   Category: ${placeAnalyses[0].category}`)
      }
    }
  } catch (error) {
    console.error(`   ❌ Hata: ${error}`)
  }
  console.log()

  console.log('✅ Derin sistem analizi tamamlandı!')
}

deepSystemAnalysis().catch(console.error)
