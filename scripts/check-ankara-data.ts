#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { places, reviews, analyses } from '../lib/db/schema'
import { sql } from 'drizzle-orm'

async function checkAnkaraData() {
  console.log('🔍 Ankara Veri Kontrolü\n')

  try {
    // Ankara koordinatları (yaklaşık merkez)
    const ankaraLat = 39.9334
    const ankaraLng = 32.8597
    const ankaraRadius = 50 // km

    // 1. Ankara içindeki mekanlar
    const ankaraPlaces = await db
      .select({ count: sql<number>`count(*)` })
      .from(places)
      .where(sql`(
        6371 * acos(
          cos(radians(${ankaraLat})) * 
          cos(radians(lat)) * 
          cos(radians(lng) - radians(${ankaraLng})) + 
          sin(radians(${ankaraLat})) * 
          sin(radians(lat))
        )
      ) <= ${ankaraRadius}`)
    
    console.log(`📍 Ankara İçindeki Mekanlar (50km radius): ${ankaraPlaces[0].count}`)

    // 2. Kategorilere göre Ankara mekanları
    const ankaraCategoryStats = await db
      .select({
        category: places.category,
        count: sql<number>`count(*)`,
      })
      .from(places)
      .where(sql`(
        6371 * acos(
          cos(radians(${ankaraLat})) * 
          cos(radians(lat)) * 
          cos(radians(lng) - radians(${ankaraLng})) + 
          sin(radians(${ankaraLat})) * 
          sin(radians(lat))
        )
      ) <= ${ankaraRadius}`)
      .groupBy(places.category)
      .orderBy(sql`count(*) desc`)

    console.log('\n📋 Ankara Kategorileri:')
    for (const stat of ankaraCategoryStats) {
      console.log(`   ${stat.category || 'NULL'}: ${stat.count} mekan`)
    }

    // 3. Ankara mekanlarının yorum sayıları
    const ankaraPlacesWithReviews = await db
      .select({
        placeId: places.id,
        name: places.name,
        reviewCount: places.reviewCount,
        rating: places.rating,
        category: places.category,
      })
      .from(places)
      .where(sql`(
        6371 * acos(
          cos(radians(${ankaraLat})) * 
          cos(radians(lat)) * 
          cos(radians(lng) - radians(${ankaraLng})) + 
          sin(radians(${ankaraLat})) * 
          sin(radians(lat))
        )
      ) <= ${ankaraRadius}`)
      .limit(10)

    console.log('\n📝 Örnek Ankara Mekanları:')
    for (const place of ankaraPlacesWithReviews) {
      console.log(`   - ${place.name} (${place.category}) - ${place.reviewCount || 0} yorum, ${place.rating || 'N/A'} ⭐`)
    }

    // 4. Ankara mekanlarının yorumları
    const ankaraPlaceIds = await db
      .select({ id: places.id })
      .from(places)
      .where(sql`(
        6371 * acos(
          cos(radians(${ankaraLat})) * 
          cos(radians(lat)) * 
          cos(radians(lng) - radians(${ankaraLng})) + 
          sin(radians(${ankaraLat})) * 
          sin(radians(lat))
        )
      ) <= ${ankaraRadius}`)

    const placeIds = ankaraPlaceIds.map(p => p.id)
    
    if (placeIds.length > 0) {
      const ankaraReviews = await db
        .select({ count: sql<number>`count(*)` })
        .from(reviews)
        .where(sql`place_id = ANY(${placeIds})`)

      console.log(`\n💬 Ankara Mekanlarının Yorumları: ${ankaraReviews[0].count}`)

      // 5. Ankara mekanlarının analizleri
      const ankaraAnalyses = await db
        .select({ count: sql<number>`count(*)` })
        .from(analyses)
        .where(sql`place_id = ANY(${placeIds})`)

      console.log(`📊 Ankara Mekanlarının Analizleri: ${ankaraAnalyses[0].count}`)
    }

    // 6. Son sync tarihi (en son güncellenen mekan)
    const lastUpdated = await db
      .select({
        name: places.name,
        updatedAt: places.updatedAt,
        lastScrapedAt: places.lastScrapedAt,
      })
      .from(places)
      .where(sql`(
        6371 * acos(
          cos(radians(${ankaraLat})) * 
          cos(radians(lat)) * 
          cos(radians(lng) - radians(${ankaraLng})) + 
          sin(radians(${ankaraLat})) * 
          sin(radians(lat))
        )
      ) <= ${ankaraRadius}`)
      .orderBy(sql`updated_at desc`)
      .limit(1)

    if (lastUpdated.length > 0) {
      console.log(`\n🕐 Son Güncelleme: ${lastUpdated[0].name}`)
      console.log(`   Updated: ${lastUpdated[0].updatedAt || 'N/A'}`)
      console.log(`   Scraped: ${lastUpdated[0].lastScrapedAt || 'N/A'}`)
    }

    // 7. Toplam mekan sayısı (karşılaştırma için)
    const totalPlaces = await db.select({ count: sql<number>`count(*)` }).from(places)
    console.log(`\n📊 Toplam Mekan Sayısı (Tüm Türkiye): ${totalPlaces[0].count}`)
    console.log(`📊 Ankara Oranı: ${((ankaraPlaces[0].count / totalPlaces[0].count) * 100).toFixed(1)}%`)

    console.log('\n✅ Ankara veri kontrolü tamamlandı!')

  } catch (error) {
    console.error('❌ Hata:', error)
    process.exit(1)
  }
}

checkAnkaraData().catch(console.error)
