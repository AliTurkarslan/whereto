#!/usr/bin/env tsx

/**
 * Ankara Sync Script
 * 
 * Sadece Ankara için sync
 * Tüm bölgeler ve kategoriler
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
import { logger } from '../lib/logging/logger'
import { GOOGLE_MAPS_CATEGORIES, CATEGORY_GROUPS } from '../lib/config/google-maps-categories'

// Ankara Bölgeleri
const ANKARA_REGIONS = [
  { name: 'Etimesgut', lat: 39.9567, lng: 32.6378 },
  { name: 'Çankaya', lat: 39.9179, lng: 32.8543 },
  { name: 'Keçiören', lat: 40.0214, lng: 32.8636 },
  { name: 'Yenimahalle', lat: 39.9667, lng: 32.8167 },
  { name: 'Mamak', lat: 39.9500, lng: 32.9167 },
  { name: 'Sincan', lat: 39.9667, lng: 32.5667 },
]

// Google Maps Kategorileri (Ankara için öncelikli olanlar)
// Artık direkt Google Maps kategorilerini kullanıyoruz
const ANKARA_CATEGORIES = [
  'restaurant',      // Restoran
  'cafe',            // Kafe
  'bar',             // Bar
  'hair_salon',      // Kuaför
  'spa',             // Spa
  'clothing_store',  // Giyim Mağazası
  'amusement_center', // Eğlence Merkezi
] as const

// Kategori config helper
function getCategoryConfig(categoryKey: string) {
  const category = GOOGLE_MAPS_CATEGORIES[categoryKey]
  if (!category) {
    throw new Error(`Geçersiz kategori: ${categoryKey}`)
  }
  return {
    query: category.apiType, // Google Maps API'de arama için
    apiType: category.apiType,
    displayName: category.displayName.tr,
  }
}

const COMPANIONS = ['alone', 'partner', 'friends', 'family', 'colleagues']

interface SyncStats {
  region: string
  category: string
  placesFound: number
  placesProcessed: number
  placesSuccess: number
  reviewsCollected: number
  analysesCreated: number
  apiCalls: number
  duration: number
}

/**
 * Tek bir bölge + kategori için sync
 */
async function syncRegionCategory(
  region: { name: string; lat: number; lng: number },
  categoryKey: string,
  categoryConfig: typeof CATEGORIES.food,
  apiKey: string
): Promise<SyncStats> {
  const startTime = Date.now()
  const stats: SyncStats = {
    region: region.name,
    category: categoryKey,
    placesFound: 0,
    placesProcessed: 0,
    placesSuccess: 0,
    reviewsCollected: 0,
    analysesCreated: 0,
    apiCalls: 0,
    duration: 0,
  }

  logger.info(`\n${'='.repeat(60)}`)
  logger.info(`📍 Ankara - ${region.name} - ${categoryConfig.displayName}`)
  logger.info(`${'='.repeat(60)}\n`)

  try {
    // 1. Mekanları bul
    logger.info(`🔍 ${categoryConfig.displayName} aranıyor...`)
    const foundPlaces = await searchPlacesComprehensive(
      categoryConfig.query,
      { lat: region.lat, lng: region.lng },
      apiKey,
      100
    )

    stats.placesFound = foundPlaces.length
    stats.apiCalls += Math.ceil(foundPlaces.length / 20) * 2 // Text + Nearby
    logger.info(`✅ ${foundPlaces.length} mekan bulundu\n`, { region: region.name, category: categoryKey, count: foundPlaces.length })

    if (foundPlaces.length === 0) {
      stats.duration = Date.now() - startTime
      return stats
    }

    // 2. Her mekan için Place Details API ile detayları çek (tek seferde)
    const placesToProcess = foundPlaces.slice(0, 50) // Max 50 mekan (test için)

    for (let i = 0; i < placesToProcess.length; i++) {
      const placeData = placesToProcess[i]
      stats.placesProcessed++

      try {
        // Database'de var mı kontrol et
        const existingPlace = await db
          .select()
          .from(places)
          .where(eq(places.googleMapsId, placeData.placeId || ''))
          .limit(1)

        let placeId: number

        if (existingPlace.length > 0) {
          placeId = existingPlace[0].id
          logger.debug(`  ⏭️  ${placeData.name} zaten var, atlanıyor...`, { placeId, placeName: placeData.name })
        } else {
          // Place Details API ile tüm detayları çek (tek seferde)
          if (placeData.placeId) {
            try {
              const placeDetails = await getPlaceDetails(placeData.placeId, apiKey)
              stats.apiCalls++

              if (!placeDetails) {
                logger.warn(`  ⚠️  ${placeData.name} (${placeData.placeId}) için detay alınamadı - atlanıyor`, { placeId: placeData.placeId, placeName: placeData.name })
                continue
              }
              // Yeni mekan ekle (kapsamlı alanlar dahil)
              const [newPlace] = await db
                .insert(places)
                .values({
                  name: placeDetails.name,
                  address: placeDetails.address,
                  lat: placeDetails.lat || 0,
                  lng: placeDetails.lng || 0,
                  rating: placeDetails.rating,
                  reviewCount: placeDetails.reviewCount,
                  category: categoryConfig.apiType,
                  googleMapsId: placeDetails.placeId,
                  // Temel iletişim bilgileri
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
                  // Kapsamlı alanlar
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

              placeId = newPlace.id
              stats.placesSuccess++
              logger.info(`  ✅ ${placeDetails.name} eklendi`, { placeId, placeName: placeDetails.name })

              // Yorumları ekle (placeDetails'ten)
              if (placeDetails.reviews && placeDetails.reviews.length > 0) {
                for (const reviewText of placeDetails.reviews) {
                  await db.insert(reviews).values({
                    placeId,
                    text: reviewText,
                    rating: undefined,
                    author: undefined,
                    date: undefined,
                  })
                  stats.reviewsCollected++
                }
                logger.info(`  📝 ${placeDetails.reviews.length} yorum eklendi`, { placeId, reviewCount: placeDetails.reviews.length })
              }

              // Her companion için analiz yap
              if (placeDetails.reviews && placeDetails.reviews.length > 0) {
                const { sampleReviews } = await import('@/lib/utils/review-sampling')
                
                // Yorumları örnekle
                const reviewSamples = placeDetails.reviews.map(text => ({
                  text,
                  rating: undefined,
                  date: undefined,
                }))
                
                const sampledReviews = sampleReviews(reviewSamples, {
                  useDynamicSampling: true,
                  minCount: 50,
                  maxCount: 200,
                })

                for (const companion of COMPANIONS) {
                  const scoredPlaces = await scorePlaces([{
                    name: placeDetails.name,
                    address: placeDetails.address || '',
                    lat: placeDetails.lat || 0,
                    lng: placeDetails.lng || 0,
                    reviews: sampledReviews.map(r => r.text),
                    category: categoryConfig.apiType, // ✅ Google Maps kategorisi
                  }], {
                    category: categoryConfig.apiType, // ✅ Google Maps kategorisi
                    companion: companion,
                    userLocation: { lat: region.lat, lng: region.lng },
                  })

                  if (scoredPlaces.length > 0) {
                    const scored = scoredPlaces[0]
                    await db.insert(analyses).values({
                      placeId,
                      category: categoryConfig.apiType, // ✅ Google Maps kategorisi (restaurant, cafe, vb.)
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
                    stats.analysesCreated++
                  }
                }
                logger.info(`  🤖 ${COMPANIONS.length} analiz oluşturuldu`, { placeId, analysisCount: COMPANIONS.length })
              }
            } catch (error: any) {
              logger.error(`  ❌ Hata: ${placeData.name} (${placeData.placeId})`, error instanceof Error ? error : new Error(String(error)), { placeId: placeData.placeId, placeName: placeData.name })
              // Hata olsa bile devam et - bir sonraki mekana geç
              continue
            }
          } else {
            logger.warn(`  ⚠️  ${placeData.name} için placeId yok, atlanıyor...`, { placeName: placeData.name })
          }
        }

        // Rate limiting - Place Details API: 10 req/s
        if (i < placesToProcess.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      } catch (error: any) {
        logger.error(`  ❌ Genel Hata: ${placeData.name} (${placeData.placeId || 'N/A'})`, error instanceof Error ? error : new Error(String(error)), { placeId: placeData.placeId, placeName: placeData.name })
        // Hata olsa bile devam et
      }
    }

    stats.duration = Date.now() - startTime
    return stats
  } catch (error) {
    logger.error(`❌ Sync hatası: ${region.name} - ${categoryKey}`, error instanceof Error ? error : new Error(String(error)), { region: region.name, category: categoryKey })
    stats.duration = Date.now() - startTime
    return stats
  }
}

/**
 * Ana sync fonksiyonu
 */
async function syncAnkara() {
  logger.info('🏙️  Ankara Sync Başlatılıyor...\n')
  logger.info(`📍 Bölgeler: ${ANKARA_REGIONS.map(r => r.name).join(', ')}`)
  logger.info(`📂 Kategoriler: ${ANKARA_CATEGORIES.length} kategori (Google Maps)`)
  logger.info(`👥 Companion'lar: ${COMPANIONS.length} seçenek\n`)

  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    logger.error('❌ GOOGLE_PLACES_API_KEY veya NEXT_PUBLIC_GOOGLE_MAPS_API_KEY bulunamadı!', undefined, {})
    process.exit(1)
  }

  const allStats: SyncStats[] = []
  const totalRegions = ANKARA_REGIONS.length
  const totalCategories = ANKARA_CATEGORIES.length
  let completed = 0

  for (const region of ANKARA_REGIONS) {
    for (const categoryKey of ANKARA_CATEGORIES) {
      try {
        const stats = await syncRegionCategory(region, categoryKey, apiKey)
        allStats.push(stats)
        completed++
        
        logger.info(`\n📊 İlerleme: ${completed}/${totalRegions * totalCategories} tamamlandı`)
        logger.info(`   - ${stats.placesSuccess} mekan eklendi`)
        logger.info(`   - ${stats.reviewsCollected} yorum toplandı`)
        logger.info(`   - ${stats.analysesCreated} analiz oluşturuldu`)
        logger.info(`   - ${stats.apiCalls} API çağrısı`)
        logger.info(`   - Süre: ${(stats.duration / 1000).toFixed(1)}s\n`, {
          progress: `${completed}/${totalRegions * totalCategories}`,
          places: stats.placesSuccess,
          reviews: stats.reviewsCollected,
          analyses: stats.analysesCreated,
          apiCalls: stats.apiCalls,
          duration: stats.duration
        })

        // Kategori arası bekleme
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        logger.error(`❌ Hata: ${region.name} - ${categoryKey}`, error instanceof Error ? error : new Error(String(error)), { region: region.name, category: categoryKey })
      }
    }

    // Bölge arası bekleme
    await new Promise(resolve => setTimeout(resolve, 3000))
  }

  // Özet
  logger.info(`\n${'='.repeat(60)}`)
  logger.info('📊 ANKARA SYNC ÖZET')
  logger.info(`${'='.repeat(60)}\n`)

  const totalPlaces = allStats.reduce((sum, s) => sum + s.placesSuccess, 0)
  const totalReviews = allStats.reduce((sum, s) => sum + s.reviewsCollected, 0)
  const totalAnalyses = allStats.reduce((sum, s) => sum + s.analysesCreated, 0)
  const totalApiCalls = allStats.reduce((sum, s) => sum + s.apiCalls, 0)
  const totalDuration = allStats.reduce((sum, s) => sum + s.duration, 0)

  logger.info(`✅ Toplam Mekan: ${totalPlaces}`)
  logger.info(`📝 Toplam Yorum: ${totalReviews}`)
  logger.info(`🤖 Toplam Analiz: ${totalAnalyses}`)
  logger.info(`📡 Toplam API Çağrısı: ${totalApiCalls}`)
  logger.info(`⏱️  Toplam Süre: ${(totalDuration / 1000 / 60).toFixed(1)} dakika`)
  logger.info(`\n🎉 Ankara sync tamamlandı!`, {
    totalPlaces,
    totalReviews,
    totalAnalyses,
    totalApiCalls,
    totalDuration: totalDuration / 1000 / 60
  })
}

// Script'i çalıştır
syncAnkara().catch((error) => {
  logger.error('Sync script hatası', error instanceof Error ? error : new Error(String(error)), {})
  process.exit(1)
})

