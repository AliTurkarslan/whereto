#!/usr/bin/env tsx

/**
 * Ankara ve İstanbul Sync Script
 * 
 * İstanbul ve Ankara'nın tüm bölgelerini sync eder
 * Aşamalı ve güvenli sync
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
import { GOOGLE_MAPS_CATEGORIES } from '../lib/config/google-maps-categories'

// Şehir Konfigürasyonları
const CITIES = {
  istanbul: {
    name: 'İstanbul',
    regions: [
      { name: 'Kadıköy', lat: 40.9833, lng: 29.0167 },
      { name: 'Beşiktaş', lat: 41.0422, lng: 29.0081 },
      { name: 'Şişli', lat: 41.0602, lng: 28.9874 },
      { name: 'Beyoğlu', lat: 41.0369, lng: 28.9850 },
      { name: 'Üsküdar', lat: 41.0214, lng: 29.0122 },
      { name: 'Bakırköy', lat: 40.9833, lng: 28.8567 },
    ],
  },
  ankara: {
    name: 'Ankara',
    regions: [
      { name: 'Etimesgut', lat: 39.9567, lng: 32.6378 }, // Etimesgut eklendi
      { name: 'Çankaya', lat: 39.9179, lng: 32.8543 },
      { name: 'Keçiören', lat: 40.0214, lng: 32.8636 },
      { name: 'Yenimahalle', lat: 39.9667, lng: 32.8167 },
      { name: 'Mamak', lat: 39.9500, lng: 32.9167 },
      { name: 'Sincan', lat: 39.9667, lng: 32.5667 },
    ],
  },
}

// Google Maps Kategorileri
const SYNC_CATEGORIES = [
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
    query: category.apiType,
    apiType: category.apiType,
    displayName: category.displayName.tr,
  }
}

const COMPANIONS = ['alone', 'partner', 'friends', 'family', 'colleagues']

interface SyncStats {
  city: string
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
  cityName: string,
  region: { name: string; lat: number; lng: number },
  categoryKey: string, // Google Maps kategori key (restaurant, cafe, vb.)
  apiKey: string
): Promise<SyncStats> {
  const categoryConfig = getCategoryConfig(categoryKey)
  const startTime = Date.now()
  const stats: SyncStats = {
    city: cityName,
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

  console.log(`\n${'='.repeat(60)}`)
  console.log(`📍 ${cityName} - ${region.name} - ${categoryConfig.displayName}`)
  console.log(`${'='.repeat(60)}\n`)

  try {
    // 1. Mekanları bul
    console.log(`🔍 ${categoryConfig.displayName} aranıyor...`)
    const foundPlaces = await searchPlacesComprehensive(
      categoryConfig.query,
      { lat: region.lat, lng: region.lng },
      apiKey,
      100 // Her bölge için 100 mekan
    )

    stats.placesFound = foundPlaces.length
    stats.apiCalls += Math.ceil(foundPlaces.length / 20) * 2 // Text + Nearby
    console.log(`✅ ${foundPlaces.length} mekan bulundu\n`)

    if (foundPlaces.length === 0) {
      stats.duration = Date.now() - startTime
      return stats
    }

    // 2. Her mekan için Place Details API ile yorumları çek
    const placesToProcess = foundPlaces.slice(0, 100) // Max 100 mekan

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
          console.log(`  ⏭️  ${placeData.name} zaten var, atlanıyor...`)
        } else {
          // Yeni mekan ekle
          const [newPlace] = await db
            .insert(places)
            .values({
              name: placeData.name,
              address: placeData.address,
              lat: placeData.lat || 0,
              lng: placeData.lng || 0,
              rating: placeData.rating,
              reviewCount: placeData.reviewCount,
              category: categoryConfig.apiType,
              googleMapsId: placeData.placeId,
              lastScrapedAt: new Date(),
            })
            .returning()

          placeId = newPlace.id
          console.log(`  ✅ ${placeData.name} eklendi`)
        }

        // Place Details API ile yorumları çek
        if (placeData.placeId) {
          const placeDetails = await getPlaceDetails(placeData.placeId, apiKey)
          stats.apiCalls++

          if (placeDetails && placeDetails.reviews && placeDetails.reviews.length > 0) {
            // Yorumları ekle (getPlaceDetails reviews'ı string array olarak döndürüyor)
            for (const reviewText of placeDetails.reviews) {
              await db.insert(reviews).values({
                placeId,
                text: reviewText,
                rating: undefined, // getPlaceDetails rating döndürmüyor
                author: undefined,
                date: undefined,
              })
              stats.reviewsCollected++
            }
          }
        }

        // Her companion için analiz yap
        for (const companion of COMPANIONS) {
          // Analiz var mı kontrol et
          const existingAnalysis = await db
            .select()
            .from(analyses)
            .where(
              and(
                eq(analyses.placeId, placeId),
                eq(analyses.category, categoryKey),
                eq(analyses.companion, companion)
              )
            )
            .limit(1)

          if (existingAnalysis.length > 0) {
            continue // Analiz zaten var
          }

          // Yorumları çek
          const placeReviews = await db
            .select()
            .from(reviews)
            .where(eq(reviews.placeId, placeId))

          if (placeReviews.length === 0) {
            continue // Yorum yok, analiz yapılamaz
          }

          // AI analiz yap
          const scoredPlaces = await scorePlaces(
            [
              {
                name: placeData.name,
                address: placeData.address,
                lat: placeData.lat || 0,
                lng: placeData.lng || 0,
                rating: placeData.rating,
                reviews: placeReviews.map(r => ({ text: r.text || '' })),
              },
            ],
            {
              category: categoryConfig.apiType, // ✅ Google Maps kategorisi
              companion,
              userLocation: { lat: region.lat, lng: region.lng },
            }
          )

          if (scoredPlaces.length > 0) {
            const scored = scoredPlaces[0]
            await db.insert(analyses).values({
              placeId,
              category: categoryConfig.apiType, // ✅ Google Maps kategorisi (restaurant, cafe, vb.)
              companion,
              score: scored.score,
              why: scored.why,
              risks: scored.risks,
              reviewCategories: scored.reviewCategories
                ? JSON.stringify(scored.reviewCategories)
                : undefined,
            })
            stats.analysesCreated++
          }
        }

        stats.placesSuccess++

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200)) // 200ms delay
      } catch (error) {
        console.error(`  ❌ ${placeData.name} işlenirken hata:`, error)
      }
    }

    stats.duration = Date.now() - startTime
    console.log(`\n✅ ${region.name} - ${categoryConfig.displayName} tamamlandı!`)
    console.log(`   📊 ${stats.placesSuccess}/${stats.placesProcessed} mekan başarılı`)
    console.log(`   📝 ${stats.reviewsCollected} yorum toplandı`)
    console.log(`   🤖 ${stats.analysesCreated} analiz oluşturuldu`)
    console.log(`   ⏱️  ${(stats.duration / 1000).toFixed(1)}s`)

    return stats
  } catch (error) {
    console.error(`❌ ${region.name} - ${categoryConfig.displayName} başarısız:`, error)
    stats.duration = Date.now() - startTime
    return stats
  }
}

/**
 * Ana sync fonksiyonu
 */
async function syncAnkaraIstanbul() {
  console.log('🚀 Ankara ve İstanbul Sync Başlıyor...\n')

  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.error('❌ GOOGLE_PLACES_API_KEY bulunamadı!')
    process.exit(1)
  }

  const allStats: SyncStats[] = []
  const startTime = Date.now()

  // Her şehir için
  for (const [cityKey, cityConfig] of Object.entries(CITIES)) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`🏙️  ${cityConfig.name} Sync Başlıyor...`)
    console.log(`${'='.repeat(60)}\n`)

    // Her bölge için
    for (const region of cityConfig.regions) {
      // Her kategori için (Google Maps kategorileri)
      for (const categoryKey of SYNC_CATEGORIES) {
        const stats = await syncRegionCategory(
          cityConfig.name,
          region,
          categoryKey,
          apiKey
        )
        allStats.push(stats)

        // Kategori arası bekleme
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      // Bölge arası bekleme
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }

  // Özet
  const totalDuration = Date.now() - startTime
  const totalPlaces = allStats.reduce((sum, s) => sum + s.placesSuccess, 0)
  const totalReviews = allStats.reduce((sum, s) => sum + s.reviewsCollected, 0)
  const totalAnalyses = allStats.reduce((sum, s) => sum + s.analysesCreated, 0)
  const totalApiCalls = allStats.reduce((sum, s) => sum + s.apiCalls, 0)

  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 GENEL ÖZET')
  console.log(`${'='.repeat(60)}`)
  console.log(`✅ Toplam Mekan: ${totalPlaces}`)
  console.log(`📝 Toplam Yorum: ${totalReviews}`)
  console.log(`🤖 Toplam Analiz: ${totalAnalyses}`)
  console.log(`🔢 Toplam API Call: ${totalApiCalls}`)
  console.log(`💰 Tahmini Maliyet: $${((totalApiCalls * 0.017).toFixed(2))}`)
  console.log(`⏱️  Toplam Süre: ${(totalDuration / 1000 / 60).toFixed(1)} dakika`)
  console.log(`\n🎉 Sync işlemi tamamlandı!`)
}

// Komut satırı argümanları
const args = process.argv.slice(2)
const cityFilter = args.find(arg => arg.startsWith('--city='))?.split('=')[1]

if (cityFilter) {
  if (cityFilter === 'istanbul') {
    CITIES.ankara = { name: 'Ankara', regions: [] } // Ankara'yı atla
  } else if (cityFilter === 'ankara') {
    CITIES.istanbul = { name: 'İstanbul', regions: [] } // İstanbul'u atla
  }
}

syncAnkaraIstanbul().catch(console.error)

