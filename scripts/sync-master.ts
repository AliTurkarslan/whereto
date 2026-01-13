#!/usr/bin/env tsx

/**
 * Master Sync Script - Profesyonel Versiyon
 * 
 * Tüm kategorileri otomatik olarak sync eder:
 * - Place Details API kullanarak yorumları çeker
 * - Database'e kaydeder
 * - AI analiz yapar
 * - Progress tracking
 * - Error recovery
 * - Cost tracking
 * 
 * Kullanım:
 * npm run sync:master
 * 
 * Veya belirli kategoriler için:
 * npm run sync:master -- --categories food,coffee
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

// Konfigürasyon
const CONFIG = {
  // Lokasyon
  location: {
    lat: 40.9833, // Kadıköy
    lng: 29.0167,
    name: 'Kadıköy',
  },

  // Kategoriler ve sorguları
  categories: {
    food: {
      query: 'restaurant',
      apiType: 'restaurant',
      displayName: 'Yemek Yerleri',
    },
    coffee: {
      query: 'cafe',
      apiType: 'cafe',
      displayName: 'Kafeler',
    },
    bar: {
      query: 'bar',
      apiType: 'bar',
      displayName: 'Barlar',
    },
    haircut: {
      query: 'hair salon',
      apiType: 'hair_salon',
      displayName: 'Kuaförler',
    },
    spa: {
      query: 'spa',
      apiType: 'spa',
      displayName: 'Spa & Masaj',
    },
    shopping: {
      query: 'shopping',
      apiType: 'clothing_store',
      displayName: 'Alışveriş',
    },
    entertainment: {
      query: 'entertainment',
      apiType: 'amusement_center',
      displayName: 'Eğlence',
    },
  },

  // Companion'lar (her biri için analiz yapılacak)
  companions: ['alone', 'partner', 'friends', 'family', 'colleagues'],

  // Limits
  maxPlacesPerCategory: 200,
  maxApiCallsPerCategory: 200, // Place Details API limit

  // Rate limiting
  delayBetweenPlaces: 200, // ms (Place Details API: 10 req/s)
  delayBetweenCategories: 2000, // ms
}

interface SyncStats {
  category: string
  placesFound: number
  placesProcessed: number
  placesSuccess: number
  placesFailed: number
  reviewsCollected: number
  analysesCreated: number
  apiCalls: number
  cost: number
  duration: number
}

interface GlobalStats {
  totalCategories: number
  completedCategories: number
  totalPlacesFound: number
  totalPlacesProcessed: number
  totalReviewsCollected: number
  totalAnalysesCreated: number
  totalApiCalls: number
  totalCost: number
  startTime: number
}

/**
 * Tek bir kategori için sync
 */
async function syncCategory(
  categoryKey: string,
  categoryConfig: typeof CONFIG.categories.food,
  apiKey: string,
  globalStats: GlobalStats
): Promise<SyncStats> {
  const startTime = Date.now()
  const stats: SyncStats = {
    category: categoryKey,
    placesFound: 0,
    placesProcessed: 0,
    placesSuccess: 0,
    placesFailed: 0,
    reviewsCollected: 0,
    analysesCreated: 0,
    apiCalls: 0,
    cost: 0,
    duration: 0,
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log(`🍽️  ${categoryConfig.displayName} Sync Başlıyor...`)
  console.log(`${'='.repeat(60)}\n`)

  try {
    // 1. Mekanları bul
    console.log(`🔍 ${categoryConfig.displayName} aranıyor...`)
    const foundPlaces = await searchPlacesComprehensive(
      categoryConfig.query,
      CONFIG.location,
      apiKey,
      CONFIG.maxPlacesPerCategory
    )

    stats.placesFound = foundPlaces.length
    console.log(`✅ ${foundPlaces.length} mekan bulundu\n`)

    if (foundPlaces.length === 0) {
      stats.duration = Date.now() - startTime
      return stats
    }

    // 2. Her mekan için Place Details API ile yorumları çek
    const placesToProcess = foundPlaces.slice(0, CONFIG.maxApiCallsPerCategory)

    for (let i = 0; i < placesToProcess.length; i++) {
      const placeData = placesToProcess[i]
      stats.placesProcessed++

      if (!placeData.placeId) {
        console.log(`[${i + 1}/${placesToProcess.length}] ⚠️  ${placeData.name}: Place ID yok`)
        stats.placesFailed++
        continue
      }

      const progress = `[${i + 1}/${placesToProcess.length}]`
      process.stdout.write(`${progress} 📍 ${placeData.name}... `)

      try {
        // Place Details API çağrısı
        stats.apiCalls++
        const details = await getPlaceDetails(placeData.placeId, apiKey)

        if (!details) {
          console.log('❌ API başarısız')
          stats.placesFailed++
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
              category: categoryConfig.query,
              googleMapsId: placeWithDetails.placeId || undefined,
              lastScrapedAt: new Date(),
            })
            .returning()

          place = inserted
        } else {
          await db
            .update(places)
            .set({
              rating: placeWithDetails.rating,
              reviewCount: placeWithDetails.reviewCount,
              googleMapsId: placeWithDetails.placeId || place.googleMapsId || undefined,
              lastScrapedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(places.id, place.id))
        }

        // 4. Yorumları kaydet
        let reviewCount = 0
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
          reviewCount = reviewsToInsert.length
          stats.reviewsCollected += reviewCount
        }

        // 5. AI Analiz (yorumlar varsa)
        let analysisCount = 0
        if (placeWithDetails.reviews && placeWithDetails.reviews.length > 0) {
          for (const companion of CONFIG.companions) {
            const scoredPlaces = await scorePlaces([placeWithDetails], {
              category: categoryConfig.apiType, // ✅ Google Maps kategorisi
              companion,
              userLocation: CONFIG.location,
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
                    eq(analyses.category, categoryConfig.apiType), // ✅ Google Maps kategorisi
                    eq(analyses.companion, companion)
                  )
                )
                .limit(1)

              const analysisData = {
                placeId: place.id,
                category: categoryConfig.apiType, // ✅ Google Maps kategorisi (restaurant, cafe, vb.)
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

              analysisCount++
            }
          }
          stats.analysesCreated += analysisCount
        }

        stats.placesSuccess++
        // Daha açıklayıcı output
        if (reviewCount > 0 && analysisCount > 0) {
          console.log(`✅ (${reviewCount} yorum, ${analysisCount}/${CONFIG.companions.length} companion analizi)`)
        } else if (reviewCount > 0) {
          console.log(`✅ (${reviewCount} yorum)`)
        } else {
          console.log(`✅ (yorum yok)`)
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenPlaces))
      } catch (error) {
        console.log(`❌ ${error instanceof Error ? error.message : 'Hata'}`)
        stats.placesFailed++
      }
    }

    stats.cost = (stats.apiCalls * 17) / 1000 // Place Details API: $17/1000
    stats.duration = Date.now() - startTime

    // Kategori özeti
    console.log(`\n${'─'.repeat(60)}`)
    console.log(`📊 ${categoryConfig.displayName} Özeti:`)
    console.log(`   ✅ Başarılı: ${stats.placesSuccess} mekan`)
    console.log(`   ❌ Başarısız: ${stats.placesFailed} mekan`)
    console.log(`   📝 Toplam Yorum: ${stats.reviewsCollected}`)
    console.log(`   🤖 Toplam Analiz: ${stats.analysesCreated} (${stats.placesSuccess} mekan × ${CONFIG.companions.length} companion)`)
    console.log(`   🔢 API Çağrısı: ${stats.apiCalls}`)
    console.log(`   💰 Maliyet: $${stats.cost.toFixed(2)}`)
    console.log(`   ⏱️  Süre: ${(stats.duration / 1000).toFixed(1)}s`)

    // Global stats güncelle
    globalStats.completedCategories++
    globalStats.totalPlacesFound += stats.placesFound
    globalStats.totalPlacesProcessed += stats.placesProcessed
    globalStats.totalReviewsCollected += stats.reviewsCollected
    globalStats.totalAnalysesCreated += stats.analysesCreated
    globalStats.totalApiCalls += stats.apiCalls
    globalStats.totalCost += stats.cost

    return stats
  } catch (error) {
    console.error(`❌ ${categoryConfig.displayName} sync hatası:`, error)
    stats.duration = Date.now() - startTime
    return stats
  }
}

/**
 * Master sync - Tüm kategorileri işle
 */
async function syncMaster(categoryFilter?: string[]) {
  console.log('🚀 Master Sync Başlıyor...\n')
  console.log(`📍 Lokasyon: ${CONFIG.location.name} (${CONFIG.location.lat}, ${CONFIG.location.lng})\n`)

  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.error('❌ GOOGLE_PLACES_API_KEY bulunamadı!')
    process.exit(1)
  }

  // Kategorileri filtrele
  const categoriesToSync = categoryFilter
    ? Object.entries(CONFIG.categories).filter(([key]) => categoryFilter.includes(key))
    : Object.entries(CONFIG.categories)

  if (categoriesToSync.length === 0) {
    console.error('❌ Geçerli kategori bulunamadı!')
    process.exit(1)
  }

  // Global stats
  const globalStats: GlobalStats = {
    totalCategories: categoriesToSync.length,
    completedCategories: 0,
    totalPlacesFound: 0,
    totalPlacesProcessed: 0,
    totalReviewsCollected: 0,
    totalAnalysesCreated: 0,
    totalApiCalls: 0,
    totalCost: 0,
    startTime: Date.now(),
  }

  const allStats: SyncStats[] = []

  // Her kategori için sync
  for (let i = 0; i < categoriesToSync.length; i++) {
    const [categoryKey, categoryConfig] = categoriesToSync[i]

    const stats = await syncCategory(categoryKey, categoryConfig, apiKey, globalStats)
    allStats.push(stats)

    // Kategori arası bekleme (son kategori değilse)
    if (i < categoriesToSync.length - 1) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenCategories))
    }
  }

  // Final özet
  const totalDuration = Date.now() - globalStats.startTime

  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 GENEL ÖZET')
  console.log(`${'='.repeat(60)}`)
  console.log(`✅ Tamamlanan: ${globalStats.completedCategories}/${globalStats.totalCategories} kategori`)
  console.log(`📍 Toplam Mekan Bulundu: ${globalStats.totalPlacesFound}`)
  console.log(`🔄 İşlenen: ${globalStats.totalPlacesProcessed} mekan`)
  console.log(`📝 Toplam Yorum: ${globalStats.totalReviewsCollected}`)
  console.log(`🤖 Toplam Analiz: ${globalStats.totalAnalysesCreated} (${Math.round(globalStats.totalAnalysesCreated / CONFIG.companions.length)} mekan × ${CONFIG.companions.length} companion)`)
  console.log(`🔢 Toplam API Çağrısı: ${globalStats.totalApiCalls}`)
  console.log(`💰 Toplam Maliyet: $${globalStats.totalCost.toFixed(2)}`)
  console.log(`⏱️  Toplam Süre: ${(totalDuration / 1000 / 60).toFixed(1)} dakika`)
  console.log(`\n💡 Free Tier: $200/ay (Kalan: $${(200 - globalStats.totalCost).toFixed(2)})`)
  console.log(`${'='.repeat(60)}\n`)

  // Kategori bazlı detay
  console.log('\n📋 Kategori Detayları:')
  allStats.forEach((stats) => {
    const categoryName = CONFIG.categories[stats.category as keyof typeof CONFIG.categories]?.displayName || stats.category
    const avgReviewsPerPlace = stats.placesSuccess > 0 ? (stats.reviewsCollected / stats.placesSuccess).toFixed(1) : '0'
    console.log(`   ${categoryName}:`)
    console.log(`      - ${stats.placesSuccess} mekan`)
    console.log(`      - ${stats.reviewsCollected} yorum (ortalama ${avgReviewsPerPlace}/mekan)`)
    console.log(`      - ${stats.analysesCreated} analiz (${stats.placesSuccess} mekan × ${CONFIG.companions.length} companion)`)
    console.log(`      - $${stats.cost.toFixed(2)}`)
  })

  console.log(`\n🎉 Master Sync tamamlandı!`)
}

// CLI argument parsing
const args = process.argv.slice(2)
const categoryIndex = args.indexOf('--categories')
const categoryFilter = categoryIndex !== -1 && args[categoryIndex + 1]
  ? args[categoryIndex + 1].split(',').map(c => c.trim())
  : undefined

if (require.main === module) {
  syncMaster(categoryFilter)
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Master sync hatası:', error)
      process.exit(1)
    })
}

export { syncMaster, CONFIG }

