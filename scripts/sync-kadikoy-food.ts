#!/usr/bin/env tsx

/**
 * Kadıköy Yemek Yerleri Sync Script
 * 
 * Place Details API kullanarak:
 * 1. Kadıköy'deki tüm yemek yerlerini bul
 * 2. Her mekan için Place Details API ile yorumları çek
 * 3. Database'e kaydet
 * 4. AI analiz yap
 * 
 * Kullanım:
 * npm run sync:kadikoy:food
 */

// Environment variables'ı yükle
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { places, reviews, analyses } from '../lib/db/schema'
import { searchPlacesComprehensive, getPlaceDetails } from '../lib/scrapers/google-places-api'
import { scorePlaces } from '../lib/ai/gemini'
import { eq, and } from 'drizzle-orm'

// Kadıköy koordinatları
const KADIKOY_LOCATION = {
  lat: 40.9833,
  lng: 29.0167,
}

// Companion'lar (her biri için analiz yapılacak)
const companions = ['alone', 'partner', 'friends', 'family', 'colleagues']

async function syncKadikoyFood() {
  console.log('🍽️  Kadıköy Yemek Yerleri Sync Başlıyor...\n')

  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.error('❌ GOOGLE_PLACES_API_KEY bulunamadı!')
    process.exit(1)
  }

  // 1. Kadıköy'deki yemek yerlerini bul
  console.log('🔍 Yemek yerleri aranıyor...')
  const foundPlaces = await searchPlacesComprehensive(
    'restaurant',
    KADIKOY_LOCATION,
    apiKey,
    200 // Daha fazla mekan
  )

  console.log(`✅ ${foundPlaces.length} mekan bulundu\n`)

  let successCount = 0
  let failCount = 0
  let totalReviews = 0
  let totalApiCalls = 0

  // 2. Her mekan için Place Details API ile yorumları çek
  for (let i = 0; i < foundPlaces.length; i++) {
    const placeData = foundPlaces[i]

    if (!placeData.placeId) {
      console.log(`[${i + 1}/${foundPlaces.length}] ⚠️  ${placeData.name}: Place ID yok, atlanıyor`)
      failCount++
      continue
    }

    console.log(`[${i + 1}/${foundPlaces.length}] 📍 ${placeData.name}...`)

    try {
      // Place Details API çağrısı
      totalApiCalls++
      const details = await getPlaceDetails(placeData.placeId, apiKey)

      if (!details) {
        console.log(`  ⚠️  Place Details API başarısız`)
        failCount++
        continue
      }

      // Place ID'yi ekle
      const placeWithDetails = {
        ...details,
        placeId: placeData.placeId,
      }

      // 3. Database'e kaydet veya güncelle
      const [existingPlace] = await db
        .select()
        .from(places)
        .where(
          and(
            eq(places.lat, placeWithDetails.lat!),
            eq(places.lng, placeWithDetails.lng!),
            eq(places.name, placeWithDetails.name)
          )
        )
        .limit(1)

      let place = existingPlace

      if (!place) {
        const [inserted] = await db
          .insert(places)
          .values({
            name: placeWithDetails.name,
            address: placeWithDetails.address,
            lat: placeWithDetails.lat!,
            lng: placeWithDetails.lng!,
            rating: placeWithDetails.rating,
            reviewCount: placeWithDetails.reviewCount,
            category: 'restaurant',
            googleMapsId: placeWithDetails.placeId || undefined, // Place ID'yi kaydet
            lastScrapedAt: new Date(),
          })
          .returning()

        place = inserted
        console.log(`  ✅ Place kaydedildi`)
      } else {
        // Güncelle
        await db
          .update(places)
          .set({
            rating: placeWithDetails.rating,
            reviewCount: placeWithDetails.reviewCount,
            googleMapsId: placeWithDetails.placeId || place.googleMapsId || undefined, // Place ID'yi güncelle
            lastScrapedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(places.id, place.id))

        console.log(`  🔄 Place güncellendi`)
      }

      // 4. Yorumları kaydet
      if (placeWithDetails.reviews && placeWithDetails.reviews.length > 0) {
        // Eski yorumları sil
        await db.delete(reviews).where(eq(reviews.placeId, place.id))

        // Yeni yorumları ekle
        const reviewsToInsert = placeWithDetails.reviews.map((reviewText) => ({
          placeId: place.id,
          text: reviewText,
          createdAt: new Date(),
        }))

        await db.insert(reviews).values(reviewsToInsert)
        totalReviews += reviewsToInsert.length
        console.log(`  📝 ${reviewsToInsert.length} yorum kaydedildi`)
      } else {
        console.log(`  ⚠️  Yorum bulunamadı`)
      }

      // 5. AI Analiz (yorumlar varsa)
      if (placeWithDetails.reviews && placeWithDetails.reviews.length > 0) {
        for (const companion of companions) {
          const scoredPlaces = await scorePlaces([placeWithDetails], {
            category: 'food',
            companion,
            userLocation: KADIKOY_LOCATION,
          })

          if (scoredPlaces.length > 0) {
            const scored = scoredPlaces[0]

            // Mevcut analizi kontrol et
            const [existing] = await db
              .select()
              .from(analyses)
              .where(
                and(
                  eq(analyses.placeId, place.id),
                  eq(analyses.category, 'food'),
                  eq(analyses.companion, companion)
                )
              )
              .limit(1)

            const analysisData = {
              placeId: place.id,
              category: 'food',
              companion,
              score: scored.score,
              why: scored.why,
              risks: scored.risks || null,
              reviewCategories: scored.reviewCategories
                ? JSON.stringify(scored.reviewCategories)
                : null,
              updatedAt: new Date(),
            }

            if (existing) {
              await db
                .update(analyses)
                .set(analysisData)
                .where(eq(analyses.id, existing.id))
            } else {
              await db.insert(analyses).values({
                ...analysisData,
                createdAt: new Date(),
              })
            }

            console.log(`  🤖 ${companion}: ${scored.score}%`)
          }
        }
      }

      successCount++

      // Rate limiting - Place Details API: 10 req/s, ama güvenli için 200ms
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (error) {
      console.error(`  ❌ Hata:`, error)
      failCount++
    }
  }

  // Özet
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 ÖZET')
  console.log(`${'='.repeat(60)}`)
  console.log(`✅ Başarılı: ${successCount}`)
  console.log(`❌ Başarısız: ${failCount}`)
  console.log(`📝 Toplam Yorum: ${totalReviews}`)
  console.log(`🔢 Toplam API Çağrısı: ${totalApiCalls}`)
  console.log(`💰 Tahmini Maliyet: $${((totalApiCalls * 17) / 1000).toFixed(2)}`)
  console.log(`\n🎉 Sync tamamlandı!`)
}

if (require.main === module) {
  syncKadikoyFood()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Hata:', error)
      process.exit(1)
    })
}

