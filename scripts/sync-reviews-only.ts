#!/usr/bin/env tsx

/**
 * Sadece yorumları çek ve güncelle
 * Mevcut mekanlar için yorumları toplar
 * 
 * Kullanım:
 * npm run sync:reviews
 */

// Environment variables'ı yükle
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { places, reviews } from '../lib/db/schema'
import { fetchReviews } from '../lib/scrapers/reviews-fetcher'
import { eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

async function syncReviews() {
  console.log('📝 Yorumları güncelliyorum...\n')

  // Yorumu olmayan mekanları bul
  const placesWithoutReviews = await db
    .select({
      id: places.id,
      name: places.name,
      lat: places.lat,
      lng: places.lng,
      address: places.address,
    })
    .from(places)
    .leftJoin(reviews, eq(places.id, reviews.placeId))
    .where(sql`reviews.id IS NULL`)
    .limit(50) // İlk 50 mekan

  console.log(`📋 ${placesWithoutReviews.length} mekan için yorum çekilecek\n`)

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < placesWithoutReviews.length; i++) {
    const place = placesWithoutReviews[i]
    
    console.log(`[${i + 1}/${placesWithoutReviews.length}] ${place.name}...`)

    try {
      const placeData = {
        name: place.name,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
      }

      const fetchedReviews = await fetchReviews(placeData)

      if (fetchedReviews.length > 0) {
        // Yorumları database'e kaydet
        const reviewsToInsert = fetchedReviews.map((reviewText) => ({
          placeId: place.id,
          text: reviewText,
          createdAt: new Date(),
        }))

        await db.insert(reviews).values(reviewsToInsert)
        console.log(`  ✅ ${fetchedReviews.length} yorum kaydedildi`)
        successCount++
      } else {
        console.log(`  ⚠️  Yorum bulunamadı`)
        failCount++
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000)) // 2 saniye bekle
    } catch (error) {
      console.error(`  ❌ Hata:`, error)
      failCount++
    }
  }

  console.log(`\n📊 ÖZET`)
  console.log(`✅ Başarılı: ${successCount}`)
  console.log(`❌ Başarısız: ${failCount}`)
  console.log(`\n🎉 Yorum sync tamamlandı!`)
}

if (require.main === module) {
  syncReviews()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Hata:', error)
      process.exit(1)
    })
}


