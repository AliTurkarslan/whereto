#!/usr/bin/env tsx

/**
 * Ankara Test Sync Script
 * 
 * Sadece 1 bölge ve 1 kategori ile test
 * Hızlı doğrulama için
 */

// Environment variables'ı yükle
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { places, reviews, analyses } from '../lib/db/schema'
import { searchPlacesComprehensive, getPlaceDetails } from '../lib/scrapers/google-places-api'
import { scorePlaces } from '../lib/ai/gemini'
import { eq } from 'drizzle-orm'

// Test için sadece 1 bölge
const TEST_REGION = { name: 'Etimesgut', lat: 39.9567, lng: 32.6378 }

// Test için sadece 1 kategori
const TEST_CATEGORY = {
  food: { query: 'restaurant', apiType: 'restaurant', displayName: 'Yemek Yerleri' },
}

const COMPANIONS = ['alone', 'partner'] // Test için sadece 2 companion

async function testSync() {
  console.log('🧪 Ankara Test Sync Başlatılıyor...\n')
  console.log(`📍 Bölge: ${TEST_REGION.name}`)
  console.log(`📂 Kategori: ${TEST_CATEGORY.food.displayName}`)
  console.log(`👥 Companion'lar: ${COMPANIONS.length} seçenek\n`)

  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    console.error('❌ GOOGLE_PLACES_API_KEY veya NEXT_PUBLIC_GOOGLE_MAPS_API_KEY bulunamadı!')
    process.exit(1)
  }

  const startTime = Date.now()
  let placesFound = 0
  let placesProcessed = 0
  let placesSuccess = 0
  let reviewsCollected = 0
  let analysesCreated = 0
  let apiCalls = 0

  try {
    // 1. Mekanları bul
    console.log(`🔍 ${TEST_CATEGORY.food.displayName} aranıyor...`)
    const foundPlaces = await searchPlacesComprehensive(
      TEST_CATEGORY.food.query,
      { lat: TEST_REGION.lat, lng: TEST_REGION.lng },
      apiKey,
      10 // Test için sadece 10 mekan
    )

    placesFound = foundPlaces.length
    apiCalls += Math.ceil(foundPlaces.length / 20) * 2
    console.log(`✅ ${foundPlaces.length} mekan bulundu\n`)

    if (foundPlaces.length === 0) {
      console.log('⚠️  Mekan bulunamadı!')
      return
    }

    // 2. İlk 3 mekan için detayları çek (test için)
    const placesToProcess = foundPlaces.slice(0, 3)

    for (let i = 0; i < placesToProcess.length; i++) {
      const placeData = placesToProcess[i]
      placesProcessed++

      try {
        if (placeData.placeId) {
          console.log(`\n📋 ${i + 1}/${placesToProcess.length}: ${placeData.name}`)
          
          const placeDetails = await getPlaceDetails(placeData.placeId, apiKey)
          apiCalls++

          if (!placeDetails) {
            console.log(`  ⚠️  Detay alınamadı - atlanıyor`)
            continue
          }

          // Database'de var mı kontrol et
          const existingPlace = await db
            .select()
            .from(places)
            .where(eq(places.googleMapsId, placeDetails.placeId))
            .limit(1)

          if (existingPlace.length > 0) {
            console.log(`  ⏭️  Zaten var, atlanıyor...`)
            continue
          }

          // Yeni mekan ekle
          const [newPlace] = await db
            .insert(places)
            .values({
              name: placeDetails.name,
              address: placeDetails.address,
              lat: placeDetails.lat || 0,
              lng: placeDetails.lng || 0,
              rating: placeDetails.rating,
              reviewCount: placeDetails.reviewCount,
              category: TEST_CATEGORY.food.apiType,
              googleMapsId: placeDetails.placeId,
              phone: placeDetails.phone,
              website: placeDetails.website,
              openingHours: placeDetails.openingHours 
                ? JSON.stringify(placeDetails.openingHours) 
                : undefined,
              photos: placeDetails.photos 
                ? JSON.stringify(placeDetails.photos) 
                : undefined,
              editorialSummary: placeDetails.editorialSummary,
              businessStatus: placeDetails.businessStatus,
              plusCode: placeDetails.plusCode,
              priceLevel: placeDetails.priceLevel,
              shortFormattedAddress: placeDetails.shortFormattedAddress,
              addressComponents: placeDetails.addressComponents 
                ? JSON.stringify(placeDetails.addressComponents) 
                : undefined,
              viewport: placeDetails.viewport 
                ? JSON.stringify(placeDetails.viewport) 
                : undefined,
              primaryType: placeDetails.primaryType,
              primaryTypeDisplayName: placeDetails.primaryTypeDisplayName,
              accessibilityOptions: placeDetails.accessibilityOptions 
                ? JSON.stringify(placeDetails.accessibilityOptions) 
                : undefined,
              evChargingOptions: placeDetails.evChargingOptions 
                ? JSON.stringify(placeDetails.evChargingOptions) 
                : undefined,
              fuelOptions: placeDetails.fuelOptions 
                ? JSON.stringify(placeDetails.fuelOptions) 
                : undefined,
              goodForChildren: placeDetails.goodForChildren ? 1 : 0,
              goodForGroups: placeDetails.goodForGroups ? 1 : 0,
              goodForWatchingSports: placeDetails.goodForWatchingSports ? 1 : 0,
              indoorOptions: placeDetails.indoorOptions 
                ? JSON.stringify(placeDetails.indoorOptions) 
                : undefined,
              liveMusic: placeDetails.liveMusic ? 1 : 0,
              menuForChildren: placeDetails.menuForChildren ? 1 : 0,
              outdoorSeating: placeDetails.outdoorSeating ? 1 : 0,
              parkingOptions: placeDetails.parkingOptions 
                ? JSON.stringify(placeDetails.parkingOptions) 
                : undefined,
              paymentOptions: placeDetails.paymentOptions 
                ? JSON.stringify(placeDetails.paymentOptions) 
                : undefined,
              reservable: placeDetails.reservable ? 1 : 0,
              restroom: placeDetails.restroom ? 1 : 0,
              servesBreakfast: placeDetails.servesBreakfast ? 1 : 0,
              servesBrunch: placeDetails.servesBrunch ? 1 : 0,
              servesDinner: placeDetails.servesDinner ? 1 : 0,
              servesLunch: placeDetails.servesLunch ? 1 : 0,
              servesBeer: placeDetails.servesBeer ? 1 : 0,
              servesWine: placeDetails.servesWine ? 1 : 0,
              servesCocktails: placeDetails.servesCocktails ? 1 : 0,
              servesVegetarianFood: placeDetails.servesVegetarianFood ? 1 : 0,
              takeout: placeDetails.takeout ? 1 : 0,
              delivery: placeDetails.delivery ? 1 : 0,
              dineIn: placeDetails.dineIn ? 1 : 0,
              lastScrapedAt: new Date(),
            })
            .returning()

          placesSuccess++
          console.log(`  ✅ Eklendi`)

          // Yorumları ekle
          if (placeDetails.reviews && placeDetails.reviews.length > 0) {
            for (const reviewText of placeDetails.reviews) {
              await db.insert(reviews).values({
                placeId: newPlace.id,
                text: reviewText,
                rating: undefined,
                author: undefined,
                date: undefined,
              })
              reviewsCollected++
            }
            console.log(`  📝 ${placeDetails.reviews.length} yorum eklendi`)
          }

          // Test için sadece 1 companion analizi
          if (placeDetails.reviews && placeDetails.reviews.length > 0) {
            const { sampleReviews } = await import('@/lib/utils/review-sampling')
            
            const reviewSamples = placeDetails.reviews.map(text => ({
              text,
              rating: undefined,
              date: undefined,
            }))
            
            const sampledReviews = sampleReviews(reviewSamples, {
              useDynamicSampling: true,
              minCount: 10,
              maxCount: 50,
            })

            const companion = COMPANIONS[0] // Sadece 'alone' için test
            const scoredPlaces = await scorePlaces([{
              name: placeDetails.name,
              address: placeDetails.address || '',
              lat: placeDetails.lat || 0,
              lng: placeDetails.lng || 0,
              reviews: sampledReviews.map(r => r.text),
              category: 'food',
            }], {
              category: 'food',
              companion: companion,
              userLocation: { lat: TEST_REGION.lat, lng: TEST_REGION.lng },
            })

            if (scoredPlaces.length > 0) {
              const scored = scoredPlaces[0]
              await db.insert(analyses).values({
                placeId: newPlace.id,
                category: 'food',
                companion,
                score: scored.score,
                why: scored.why,
                risks: scored.risks || null,
                reviewCategories: scored.reviewCategories 
                  ? JSON.stringify(scored.reviewCategories) 
                  : null,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              analysesCreated++
              console.log(`  🤖 Analiz oluşturuldu (${companion})`)
            }
          }

          // Rate limiting
          if (i < placesToProcess.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200))
          }
        }
      } catch (error: any) {
        console.error(`  ❌ Hata: ${placeData.name}`, error?.message || error)
      }
    }

    const duration = Date.now() - startTime

    // Özet
    console.log(`\n${'='.repeat(60)}`)
    console.log('📊 TEST ÖZET')
    console.log(`${'='.repeat(60)}\n`)
    console.log(`✅ Mekan Bulundu: ${placesFound}`)
    console.log(`📋 İşlenen: ${placesProcessed}`)
    console.log(`✅ Başarılı: ${placesSuccess}`)
    console.log(`📝 Yorum: ${reviewsCollected}`)
    console.log(`🤖 Analiz: ${analysesCreated}`)
    console.log(`📡 API Çağrısı: ${apiCalls}`)
    console.log(`⏱️  Süre: ${(duration / 1000).toFixed(1)}s`)
    console.log(`\n🎉 Test tamamlandı!`)

    if (placesSuccess > 0) {
      console.log(`\n✅ Sistem çalışıyor! Tam sync'i başlatabilirsin.`)
    } else {
      console.log(`\n⚠️  Hiç mekan eklenemedi. Hataları kontrol et.`)
    }

  } catch (error) {
    console.error(`❌ Test hatası:`, error)
    process.exit(1)
  }
}

testSync().catch(console.error)



