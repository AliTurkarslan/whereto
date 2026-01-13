#!/usr/bin/env tsx

/**
 * Ankara Comprehensive Sync Script
 * 
 * Ankara'nın tamamı için kapsamlı sync
 * - Tüm önemli bölgeler
 * - Tüm kullanıcı ihtiyaç kategorileri
 * - Gelişmiş error handling
 * - Progress tracking
 * - Resume capability (opsiyonel)
 */

// Environment variables'ı yükle
import { config } from 'dotenv'
import { resolve } from 'path'
const envResult = config({ path: resolve(process.cwd(), '.env.local') })

if (envResult.error) {
  console.error('❌ .env.local dosyası yüklenemedi:', envResult.error)
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable bulunamadı!')
  process.exit(1)
}

import { db } from '../lib/db'
import { places, reviews, analyses } from '../lib/db/schema'
import { searchPlacesComprehensive, getPlaceDetails } from '../lib/scrapers/google-places-api'
import { scorePlaces } from '../lib/ai/gemini'
import { eq, and } from 'drizzle-orm'
import { logger } from '../lib/logging/logger'
import { GOOGLE_MAPS_CATEGORIES } from '../lib/config/google-maps-categories'
import { getCategoryGroupForPlaceType } from '../lib/config/google-maps-category-groups'
import { USER_NEED_CATEGORIES } from '../lib/config/user-needs-categories'
import { 
  filterAndSortPlaces, 
  DEFAULT_QUALITY_CRITERIA,
  checkPlaceQuality,
  type QualityCriteria 
} from '../lib/utils/data-quality'
import { buildPriceInfo } from '../lib/utils/price-extraction'
import { detectCuisine } from '../lib/utils/cuisine-detection'

// Ankara Bölgeleri (Genişletilmiş)
const ANKARA_REGIONS = [
  // Merkez Bölgeler
  { name: 'Çankaya', lat: 39.9179, lng: 32.8543 },
  { name: 'Kızılay', lat: 39.9208, lng: 32.8541 },
  { name: 'Ulus', lat: 39.9426, lng: 32.8597 },
  
  // Kuzey Bölgeler
  { name: 'Keçiören', lat: 40.0214, lng: 32.8636 },
  { name: 'Yenimahalle', lat: 39.9667, lng: 32.8167 },
  { name: 'Mamak', lat: 39.9500, lng: 32.9167 },
  
  // Batı Bölgeler
  { name: 'Etimesgut', lat: 39.9567, lng: 32.6378 },
  { name: 'Sincan', lat: 39.9667, lng: 32.5667 },
  
  // Doğu Bölgeler
  { name: 'Gölbaşı', lat: 39.7833, lng: 32.8167 },
  
  // Güney Bölgeler
  { name: 'Batıkent', lat: 39.9667, lng: 32.7333 },
  
  // Popüler Mahalleler
  { name: 'Bahçelievler', lat: 39.9167, lng: 32.8667 },
  { name: 'Çukurambar', lat: 39.9000, lng: 32.8500 },
  { name: 'Oran', lat: 39.9000, lng: 32.8167 },
  { name: 'Çayyolu', lat: 39.8833, lng: 32.8000 },
  { name: 'Ümitköy', lat: 39.8833, lng: 32.8167 },
]

// Kategoriler - Tüm kullanıcı ihtiyaç kategorilerinden Google Maps tipleri
const ANKARA_CATEGORIES = [
  // Yemek & İçecek
  'restaurant',
  'cafe',
  'bar',
  'bakery',
  'meal_takeaway',
  'meal_delivery',
  
  // Güzellik & Bakım
  'hair_salon',
  'beauty_salon',
  'spa',
  'gym',
  'fitness_center',
  'nail_salon',
  
  // Eğlence
  'movie_theater',
  'night_club',
  'amusement_center',
  'bowling_alley',
  
  // Alışveriş
  'shopping_mall',
  'clothing_store',
  'shoe_store',
  'supermarket',
  'convenience_store',
  
  // Kültür & Sanat
  'museum',
  'art_gallery',
  'library',
  'park',
  
  // Konaklama
  'lodging',
  'hotel',
  
  // Sağlık
  'hospital',
  'pharmacy',
  'dentist',
  'doctor',
  
  // Ulaşım
  'gas_station',
  'parking',
  'transit_station',
] as const

// Kategori config helper
function getCategoryConfig(categoryKey: string) {
  const category = GOOGLE_MAPS_CATEGORIES[categoryKey]
  if (!category) {
    throw new Error(`Geçersiz kategori: ${categoryKey}`)
  }
  return {
    query: category.apiType,
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
  placesSkipped: number
  reviewsCollected: number
  analysesCreated: number
  apiCalls: number
  errors: number
  duration: number
}

interface GlobalStats {
  totalRegions: number
  totalCategories: number
  totalCombinations: number
  completed: number
  totalPlaces: number
  totalReviews: number
  totalAnalyses: number
  totalApiCalls: number
  totalErrors: number
  startTime: number
}

/**
 * Tek bir bölge + kategori için sync
 */
async function syncRegionCategory(
  region: { name: string; lat: number; lng: number },
  categoryKey: string,
  apiKey: string,
  globalStats: GlobalStats
): Promise<SyncStats> {
  const categoryConfig = getCategoryConfig(categoryKey)
  const startTime = Date.now()
  const stats: SyncStats = {
    region: region.name,
    category: categoryKey,
    placesFound: 0,
    placesProcessed: 0,
    placesSuccess: 0,
    placesSkipped: 0,
    reviewsCollected: 0,
    analysesCreated: 0,
    apiCalls: 0,
    errors: 0,
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
      100 // Her kategori için 100 mekan
    )

    stats.placesFound = foundPlaces.length
    stats.apiCalls += Math.ceil(foundPlaces.length / 20) * 2 // Text + Nearby
    logger.info(`✅ ${foundPlaces.length} mekan bulundu\n`, { 
      region: region.name, 
      category: categoryKey, 
      count: foundPlaces.length 
    })

    if (foundPlaces.length === 0) {
      stats.duration = Date.now() - startTime
      return stats
    }

    // 2. Veri kalitesi kontrolü ve filtreleme
    const qualityCriteria: QualityCriteria = {
      ...DEFAULT_QUALITY_CRITERIA,
      minReviewCount: 20, // Minimum 20 yorum (kullanıcı gereksinimi)
      minRating: 3.5, // Minimum 3.5 rating
    }

    // Kalite kontrolünden geçen ve sıralanmış mekanlar
    const filteredPlaces = filterAndSortPlaces(foundPlaces, qualityCriteria)

    logger.info(`📊 Veri kalitesi kontrolü sonrası: ${filteredPlaces.length} mekan`, {
      before: foundPlaces.length,
      after: filteredPlaces.length,
      criteria: {
        minReviewCount: qualityCriteria.minReviewCount,
        minRating: qualityCriteria.minRating,
      }
    })

    // Detaylı kalite raporu (ilk 10 mekan için)
    if (filteredPlaces.length > 0) {
      logger.info(`\n📋 Kalite Kontrolü Örnekleri (İlk 5):`)
      for (let i = 0; i < Math.min(5, filteredPlaces.length); i++) {
        const place = filteredPlaces[i]
        const check = checkPlaceQuality(place, qualityCriteria)
        logger.info(`   ${i + 1}. ${place.name}`, {
          reviewCount: place.reviewCount || place.reviews?.length || 0,
          rating: place.rating,
          qualityScore: check.score,
          isValid: check.isValid,
        })
      }
    }

    // 3. Her mekan için Place Details API ile detayları çek
    const placesToProcess = filteredPlaces.slice(0, 100) // Max 100 mekan

    for (let i = 0; i < placesToProcess.length; i++) {
      const placeData = placesToProcess[i]
      stats.placesProcessed++

      try {
        // Database'de var mı kontrol et (googleMapsId bazlı)
        const [existingPlace] = await db
          .select()
          .from(places)
          .where(eq(places.googleMapsId, placeData.placeId || ''))
          .limit(1)

        if (existingPlace) {
          stats.placesSkipped++
          logger.debug(`  ⏭️  ${placeData.name} zaten var, atlanıyor...`, { 
            placeId: existingPlace.id, 
            placeName: placeData.name 
          })
          continue
        }

        // Place Details API ile tüm detayları çek
        if (!placeData.placeId) {
          logger.warn(`  ⚠️  ${placeData.name} için placeId yok, atlanıyor...`, { 
            placeName: placeData.name 
          })
          continue
        }

        const placeDetails = await getPlaceDetails(placeData.placeId, apiKey)
        stats.apiCalls++

        if (!placeDetails) {
          stats.errors++
          logger.warn(`  ⚠️  ${placeData.name} için detay alınamadı - atlanıyor`, { 
            placeId: placeData.placeId, 
            placeName: placeData.name 
          })
          continue
        }

        // Veri kalitesi kontrolü (Place Details sonrası)
        const placeQualityCheck = checkPlaceQuality(placeDetails, qualityCriteria)
        if (!placeQualityCheck.isValid) {
          stats.placesSkipped++
          logger.debug(`  ⏭️  ${placeDetails.name} kalite kontrolünden geçemedi`, { 
            placeName: placeDetails.name,
            reasons: placeQualityCheck.reasons,
            qualityScore: placeQualityCheck.score,
            reviewCount: placeDetails.reviews?.length || 0,
            rating: placeDetails.rating,
          })
          continue
        }

        // Minimum yorum kontrolü (analiz için en az 20 yorum)
        const reviewCount = placeDetails.reviews?.length || placeDetails.reviewCount || 0
        if (reviewCount < qualityCriteria.minReviewCount) {
          stats.placesSkipped++
          logger.debug(`  ⏭️  ${placeDetails.name} yeterli yorum yok (${reviewCount} < ${qualityCriteria.minReviewCount}), atlanıyor...`, { 
            placeName: placeDetails.name,
            reviewCount,
            minRequired: qualityCriteria.minReviewCount,
          })
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
            reviewCount: placeDetails.reviewCount || reviewCount,
            category: categoryConfig.apiType,
            categoryGroup: getCategoryGroupForPlaceType(categoryConfig.apiType),
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
            // Fiyat ve kültür bilgileri
            averagePriceRange: priceInfo?.averagePrices && priceInfo.averagePrices.length > 0
              ? JSON.stringify(priceInfo.averagePrices)
              : undefined,
            cuisineType: cuisineInfo?.primaryCuisine,
            cuisineTypes: cuisineInfo?.secondaryCuisines && cuisineInfo.secondaryCuisines.length > 0
              ? JSON.stringify(cuisineInfo.secondaryCuisines)
              : undefined,
            cuisineConfidence: cuisineInfo?.confidence,
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
            goodForChildren: placeDetails.goodForChildren ?? false,
            goodForGroups: placeDetails.goodForGroups ?? false,
            goodForWatchingSports: placeDetails.goodForWatchingSports ?? false,
            indoorOptions: placeDetails.indoorOptions 
              ? JSON.stringify(placeDetails.indoorOptions) 
              : undefined,
            liveMusic: placeDetails.liveMusic ?? false,
            menuForChildren: placeDetails.menuForChildren ?? false,
            outdoorSeating: placeDetails.outdoorSeating ?? false,
            parkingOptions: placeDetails.parkingOptions 
              ? JSON.stringify(placeDetails.parkingOptions) 
              : undefined,
            paymentOptions: placeDetails.paymentOptions 
              ? JSON.stringify(placeDetails.paymentOptions) 
              : undefined,
            reservable: placeDetails.reservable ?? false,
            restroom: placeDetails.restroom ?? false,
            servesBreakfast: placeDetails.servesBreakfast ?? false,
            servesBrunch: placeDetails.servesBrunch ?? false,
            servesDinner: placeDetails.servesDinner ?? false,
            servesLunch: placeDetails.servesLunch ?? false,
            servesBeer: placeDetails.servesBeer ?? false,
            servesWine: placeDetails.servesWine ?? false,
            servesCocktails: placeDetails.servesCocktails ?? false,
            servesVegetarianFood: placeDetails.servesVegetarianFood ?? false,
            takeout: placeDetails.takeout ?? false,
            delivery: placeDetails.delivery ?? false,
            dineIn: placeDetails.dineIn ?? false,
            lastScrapedAt: new Date(),
          })
          .returning()

        stats.placesSuccess++
        globalStats.totalPlaces++
        logger.info(`  ✅ ${placeDetails.name} eklendi`, { 
          placeId: newPlace.id, 
          placeName: placeDetails.name 
        })

        // Yorumları ekle
        if (placeDetails.reviews && placeDetails.reviews.length > 0) {
          // Duplicate kontrolü (text bazlı)
          const existingReviews = await db
            .select()
            .from(reviews)
            .where(eq(reviews.placeId, newPlace.id))
            .limit(1000)

          const existingTexts = new Set(existingReviews.map(r => r.text))

          for (const reviewText of placeDetails.reviews) {
            // Duplicate kontrolü
            if (existingTexts.has(reviewText)) {
              continue
            }

            await db.insert(reviews).values({
              placeId: newPlace.id,
              text: reviewText,
              rating: undefined, // Place Details API'den rating gelmiyor
              author: undefined,
              date: undefined,
            })
            stats.reviewsCollected++
            globalStats.totalReviews++
          }

          logger.info(`  📝 ${placeDetails.reviews.length} yorum eklendi`, { 
            placeId: newPlace.id, 
            reviewCount: placeDetails.reviews.length 
          })
        }

        // Her companion için analiz yap
        if (placeDetails.reviews && placeDetails.reviews.length >= 3) {
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
            try {
              const scoredPlaces = await scorePlaces([{
                name: placeDetails.name,
                address: placeDetails.address || '',
                lat: placeDetails.lat || 0,
                lng: placeDetails.lng || 0,
                reviews: sampledReviews.map(r => r.text),
                category: categoryConfig.apiType,
              }], {
                category: categoryConfig.apiType,
                companion: companion,
                userLocation: { lat: region.lat, lng: region.lng },
              })

              if (scoredPlaces.length > 0) {
                const scored = scoredPlaces[0]

                // Mevcut analizi kontrol et
                const [existingAnalysis] = await db
                  .select()
                  .from(analyses)
                  .where(
                    and(
                      eq(analyses.placeId, newPlace.id),
                      eq(analyses.category, categoryConfig.apiType),
                      eq(analyses.companion, companion)
                    )
                  )
                  .limit(1)

                const analysisData = {
                  placeId: newPlace.id,
                  category: categoryConfig.apiType,
                  companion,
                  score: scored.score,
                  why: scored.why,
                  risks: scored.risks || null,
                  reviewCategories: scored.reviewCategories 
                    ? JSON.stringify(scored.reviewCategories) 
                    : null,
                  updatedAt: new Date(),
                }

                if (existingAnalysis) {
                  await db
                    .update(analyses)
                    .set(analysisData)
                    .where(eq(analyses.id, existingAnalysis.id))
                } else {
                  await db.insert(analyses).values({
                    ...analysisData,
                    createdAt: new Date(),
                  })
                }

                stats.analysesCreated++
                globalStats.totalAnalyses++
              }
            } catch (error) {
              logger.error(`  ❌ Analiz hatası: ${placeDetails.name} - ${companion}`, 
                error instanceof Error ? error : new Error(String(error)), 
                { placeId: newPlace.id, companion }
              )
              stats.errors++
            }
          }

          logger.info(`  🤖 ${COMPANIONS.length} analiz oluşturuldu`, { 
            placeId: newPlace.id, 
            analysisCount: COMPANIONS.length 
          })
        }

        // Rate limiting - Place Details API: 10 req/s
        if (i < placesToProcess.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      } catch (error: any) {
        stats.errors++
        globalStats.totalErrors++
        logger.error(`  ❌ Hata: ${placeData.name}`, 
          error instanceof Error ? error : new Error(String(error)), 
          { placeId: placeData.placeId, placeName: placeData.name }
        )
        // Hata olsa bile devam et
      }
    }

    stats.duration = Date.now() - startTime
    return stats
  } catch (error) {
    logger.error(`❌ Sync hatası: ${region.name} - ${categoryKey}`, 
      error instanceof Error ? error : new Error(String(error)), 
      { region: region.name, category: categoryKey }
    )
    stats.errors++
    stats.duration = Date.now() - startTime
    return stats
  }
}

/**
 * Ana sync fonksiyonu
 */
async function syncAnkaraComprehensive() {
  logger.info('🏙️  Ankara Comprehensive Sync Başlatılıyor...\n')
  logger.info(`📍 Bölgeler: ${ANKARA_REGIONS.length} bölge`)
  logger.info(`📂 Kategoriler: ${ANKARA_CATEGORIES.length} kategori`)
  logger.info(`👥 Companion'lar: ${COMPANIONS.length} seçenek\n`)

  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    logger.error('❌ GOOGLE_PLACES_API_KEY veya NEXT_PUBLIC_GOOGLE_MAPS_API_KEY bulunamadı!', undefined, {})
    process.exit(1)
  }

  const globalStats: GlobalStats = {
    totalRegions: ANKARA_REGIONS.length,
    totalCategories: ANKARA_CATEGORIES.length,
    totalCombinations: ANKARA_REGIONS.length * ANKARA_CATEGORIES.length,
    completed: 0,
    totalPlaces: 0,
    totalReviews: 0,
    totalAnalyses: 0,
    totalApiCalls: 0,
    totalErrors: 0,
    startTime: Date.now(),
  }

  const allStats: SyncStats[] = []

  for (const region of ANKARA_REGIONS) {
    for (const categoryKey of ANKARA_CATEGORIES) {
      try {
        const stats = await syncRegionCategory(region, categoryKey, apiKey, globalStats)
        allStats.push(stats)
        globalStats.completed++
        globalStats.totalApiCalls += stats.apiCalls
        globalStats.totalErrors += stats.errors

        const elapsed = (Date.now() - globalStats.startTime) / 1000 / 60
        const remaining = globalStats.totalCombinations - globalStats.completed
        const avgTime = elapsed / globalStats.completed
        const estimatedRemaining = remaining * avgTime

        logger.info(`\n📊 İlerleme: ${globalStats.completed}/${globalStats.totalCombinations} tamamlandı`)
        logger.info(`   - ${stats.placesSuccess} mekan eklendi`)
        logger.info(`   - ${stats.reviewsCollected} yorum toplandı`)
        logger.info(`   - ${stats.analysesCreated} analiz oluşturuldu`)
        logger.info(`   - ${stats.apiCalls} API çağrısı`)
        logger.info(`   - ${stats.errors} hata`)
        logger.info(`   - Süre: ${(stats.duration / 1000).toFixed(1)}s`)
        logger.info(`   - Geçen: ${elapsed.toFixed(1)} dakika`)
        logger.info(`   - Tahmini kalan: ${estimatedRemaining.toFixed(1)} dakika\n`, {
          progress: `${globalStats.completed}/${globalStats.totalCombinations}`,
          places: stats.placesSuccess,
          reviews: stats.reviewsCollected,
          analyses: stats.analysesCreated,
          apiCalls: stats.apiCalls,
          errors: stats.errors,
          duration: stats.duration,
          elapsed,
          estimatedRemaining,
        })

        // Kategori arası bekleme
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        logger.error(`❌ Hata: ${region.name} - ${categoryKey}`, 
          error instanceof Error ? error : new Error(String(error)), 
          { region: region.name, category: categoryKey }
        )
        globalStats.totalErrors++
      }
    }

    // Bölge arası bekleme
    await new Promise(resolve => setTimeout(resolve, 3000))
  }

  // Özet
  const totalDuration = (Date.now() - globalStats.startTime) / 1000 / 60

  logger.info(`\n${'='.repeat(60)}`)
  logger.info('📊 ANKARA COMPREHENSIVE SYNC ÖZET')
  logger.info(`${'='.repeat(60)}\n`)

  logger.info(`✅ Toplam Mekan: ${globalStats.totalPlaces}`)
  logger.info(`📝 Toplam Yorum: ${globalStats.totalReviews}`)
  logger.info(`🤖 Toplam Analiz: ${globalStats.totalAnalyses}`)
  logger.info(`📡 Toplam API Çağrısı: ${globalStats.totalApiCalls}`)
  logger.info(`❌ Toplam Hata: ${globalStats.totalErrors}`)
  logger.info(`⏱️  Toplam Süre: ${totalDuration.toFixed(1)} dakika`)
  logger.info(`\n🎉 Ankara comprehensive sync tamamlandı!`, {
    totalPlaces: globalStats.totalPlaces,
    totalReviews: globalStats.totalReviews,
    totalAnalyses: globalStats.totalAnalyses,
    totalApiCalls: globalStats.totalApiCalls,
    totalErrors: globalStats.totalErrors,
    totalDuration: totalDuration,
  })
}

// Script'i çalıştır
syncAnkaraComprehensive().catch((error) => {
  logger.error('Sync script hatası', error instanceof Error ? error : new Error(String(error)), {})
  process.exit(1)
})

