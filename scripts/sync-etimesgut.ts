#!/usr/bin/env tsx

/**
 * Ankara Etimesgut Sync Script
 * 
 * Sadece Etimesgut için test sync
 * Yeni verimlilik iyileştirmeleri ile
 */

// Environment variables'ı yükle (import'lardan ÖNCE!)
import { config } from 'dotenv'
import { resolve } from 'path'
const envResult = config({ path: resolve(process.cwd(), '.env.local') })

if (envResult.error) {
  console.error('❌ .env.local dosyası yüklenemedi:', envResult.error)
  process.exit(1)
}

// DATABASE_URL kontrolü
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable bulunamadı!')
  console.error('   .env.local dosyasında DATABASE_URL tanımlı olduğundan emin olun.')
  process.exit(1)
}

import { db } from '../lib/db'
import { places, reviews, analyses } from '../lib/db/schema'
import { searchPlacesComprehensive, getPlaceDetails } from '../lib/scrapers/google-places-api'
import { scorePlaces } from '../lib/ai/gemini'
import { eq, and } from 'drizzle-orm'
import { GOOGLE_MAPS_CATEGORIES } from '../lib/config/google-maps-categories'
import { getCategoryGroupForPlaceType } from '../lib/config/google-maps-category-groups'

// Etimesgut Konfigürasyonu
const ETIMESGUT = {
  name: 'Etimesgut',
  lat: 39.9567,
  lng: 32.6378,
}

// Google Maps Kategorileri (Etimesgut için öncelikli olanlar)
const ETIMESGUT_CATEGORIES = [
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
 * Tek bir kategori için sync
 */
async function syncCategory(
  categoryKey: string, // Google Maps kategori key (restaurant, cafe, vb.)
  apiKey: string
): Promise<SyncStats> {
  const categoryConfig = getCategoryConfig(categoryKey)
  const startTime = Date.now()
  const stats: SyncStats = {
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
  console.log(`📍 ${ETIMESGUT.name} - ${categoryConfig.displayName}`)
  console.log(`${'='.repeat(60)}\n`)

  try {
    // 1. Mekanları bul
    console.log(`🔍 ${categoryConfig.displayName} aranıyor...`)
    const foundPlaces = await searchPlacesComprehensive(
      categoryConfig.query,
      { lat: ETIMESGUT.lat, lng: ETIMESGUT.lng },
      apiKey,
      100 // Her kategori için 100 mekan
    )

    stats.placesFound = foundPlaces.length
    stats.apiCalls += Math.ceil(foundPlaces.length / 20) * 2 // Text + Nearby
    console.log(`✅ ${foundPlaces.length} mekan bulundu\n`)

    if (foundPlaces.length === 0) {
      stats.duration = Date.now() - startTime
      return stats
    }

    // 2. Her mekan için Place Details API ile yorumları ve detayları çek
    const placesToProcess = foundPlaces.slice(0, 50) // Test için 50 mekan

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
        let placeDetails: any = null // Place Details API sonucunu sakla

        // Place Details API ile tüm bilgileri çek (yeni alanlar + yorumlar dahil)
        // Sadece bir kez çek, hem yeni mekan hem de yorumlar için kullan
        if (placeData.placeId) {
          placeDetails = await getPlaceDetails(placeData.placeId, apiKey)
          stats.apiCalls++
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 200))
        }

        if (existingPlace.length > 0) {
          placeId = existingPlace[0].id
          console.log(`  ⏭️  ${placeData.name} zaten var, atlanıyor...`)
        } else {

          // Yeni mekan ekle (tüm alanlar dahil - kapsamlı)
          // Category group'u bul (place type'a göre)
          const categoryGroup = getCategoryGroupForPlaceType(categoryConfig.apiType)
          
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
              categoryGroup: categoryGroup || undefined, // Place type'a göre kategori grubu
              googleMapsId: placeData.placeId,
              // Temel iletişim bilgileri
              phone: placeDetails?.phone || placeData.phone,
              website: placeDetails?.website || placeData.website,
              openingHours: placeDetails?.openingHours 
                ? JSON.stringify(placeDetails.openingHours) 
                : undefined,
              photos: placeDetails?.photos 
                ? JSON.stringify(placeDetails.photos) 
                : undefined,
              editorialSummary: placeDetails?.editorialSummary || placeData.editorialSummary,
              businessStatus: placeDetails?.businessStatus || placeData.businessStatus,
              plusCode: placeDetails?.plusCode || placeData.plusCode,
              priceLevel: placeDetails?.priceLevel || placeData.priceLevel,
              // Kapsamlı alanlar
              shortFormattedAddress: placeDetails?.shortFormattedAddress || placeData.shortFormattedAddress,
              addressComponents: placeDetails?.addressComponents 
                ? JSON.stringify(placeDetails.addressComponents) 
                : undefined,
              viewport: placeDetails?.viewport 
                ? JSON.stringify(placeDetails.viewport) 
                : undefined,
              primaryType: placeDetails?.primaryType || placeData.primaryType,
              primaryTypeDisplayName: placeDetails?.primaryTypeDisplayName || placeData.primaryTypeDisplayName,
              iconBackgroundColor: placeDetails?.iconBackgroundColor || placeData.iconBackgroundColor,
              iconMaskBaseUri: placeDetails?.iconMaskBaseUri || placeData.iconMaskBaseUri,
              utcOffset: placeDetails?.utcOffset || placeData.utcOffset,
              // Accessibility ve özellikler
              accessibilityOptions: placeDetails?.accessibilityOptions 
                ? JSON.stringify(placeDetails.accessibilityOptions) 
                : undefined,
              evChargingOptions: placeDetails?.evChargingOptions 
                ? JSON.stringify(placeDetails.evChargingOptions) 
                : undefined,
              fuelOptions: placeDetails?.fuelOptions 
                ? JSON.stringify(placeDetails.fuelOptions) 
                : undefined,
              goodForChildren: placeDetails?.goodForChildren ?? placeData.goodForChildren ?? undefined,
              goodForGroups: placeDetails?.goodForGroups ?? placeData.goodForGroups ?? undefined,
              goodForWatchingSports: placeDetails?.goodForWatchingSports ?? placeData.goodForWatchingSports ?? undefined,
              indoorOptions: placeDetails?.indoorOptions 
                ? JSON.stringify(placeDetails.indoorOptions) 
                : undefined,
              liveMusic: placeDetails?.liveMusic ?? placeData.liveMusic ?? undefined,
              menuForChildren: placeDetails?.menuForChildren ?? placeData.menuForChildren ?? undefined,
              outdoorSeating: placeDetails?.outdoorSeating ?? placeData.outdoorSeating ?? undefined,
              parkingOptions: placeDetails?.parkingOptions 
                ? JSON.stringify(placeDetails.parkingOptions) 
                : undefined,
              paymentOptions: placeDetails?.paymentOptions 
                ? JSON.stringify(placeDetails.paymentOptions) 
                : undefined,
              reservable: placeDetails?.reservable ?? placeData.reservable ?? undefined,
              restroom: placeDetails?.restroom ?? placeData.restroom ?? undefined,
              // Yemek ve içecek seçenekleri
              servesBreakfast: placeDetails?.servesBreakfast ?? placeData.servesBreakfast ?? undefined,
              servesBrunch: placeDetails?.servesBrunch ?? placeData.servesBrunch ?? undefined,
              servesDinner: placeDetails?.servesDinner ?? placeData.servesDinner ?? undefined,
              servesLunch: placeDetails?.servesLunch ?? placeData.servesLunch ?? undefined,
              servesBeer: placeDetails?.servesBeer ?? placeData.servesBeer ?? undefined,
              servesWine: placeDetails?.servesWine ?? placeData.servesWine ?? undefined,
              servesCocktails: placeDetails?.servesCocktails ?? placeData.servesCocktails ?? undefined,
              servesVegetarianFood: placeDetails?.servesVegetarianFood ?? placeData.servesVegetarianFood ?? undefined,
              // Hizmet seçenekleri
              takeout: placeDetails?.takeout ?? placeData.takeout ?? undefined,
              delivery: placeDetails?.delivery ?? placeData.delivery ?? undefined,
              dineIn: placeDetails?.dineIn ?? placeData.dineIn ?? undefined,
              subDestinations: placeDetails?.subDestinations 
                ? JSON.stringify(placeDetails.subDestinations) 
                : undefined,
              currentSecondaryOpeningHours: placeDetails?.currentSecondaryOpeningHours 
                ? JSON.stringify(placeDetails.currentSecondaryOpeningHours) 
                : undefined,
              lastScrapedAt: new Date(),
            })
            .returning()

          placeId = newPlace.id
          console.log(`  ✅ ${placeData.name} eklendi`)
        }

        // Yorumları ekle (placeDetails zaten çekildi, tekrar çekmeye gerek yok)
        if (placeDetails && placeDetails.reviews && placeDetails.reviews.length > 0) {
          // Mevcut yorumları kontrol et
          const existingReviews = await db
            .select()
            .from(reviews)
            .where(eq(reviews.placeId, placeId))

          const existingReviewTexts = new Set(existingReviews.map(r => r.text))

          // Yeni yorumları ekle
          for (const review of placeDetails.reviews) {
            const reviewText = typeof review === 'string' ? review : review.text || review.comment || ''
            if (reviewText && !existingReviewTexts.has(reviewText)) {
              await db.insert(reviews).values({
                placeId,
                text: reviewText,
                rating: typeof review === 'object' && review.rating ? review.rating : undefined,
                author: typeof review === 'object' && review.author ? review.author : undefined,
                date: typeof review === 'object' && review.date ? new Date(review.date) : undefined,
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
                eq(analyses.category, categoryConfig.apiType), // ✅ Google Maps kategorisi
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
            continue // Yorum yok
          }

          // PlaceData formatına çevir
          const placeForAnalysis = {
            name: placeData.name,
            address: placeData.address,
            rating: placeData.rating,
            reviewCount: placeReviews.length,
            lat: placeData.lat,
            lng: placeData.lng,
            reviews: placeReviews.map(r => r.text),
            category: categoryConfig.apiType, // ✅ Google Maps kategorisi
            placeId: placeData.placeId,
          }

          // AI analizi yap (yeni örnekleme sistemi ile)
          const scoredPlaces = await scorePlaces([placeForAnalysis], {
            category: categoryConfig.apiType, // ✅ Google Maps kategorisi
            companion,
            userLocation: { lat: ETIMESGUT.lat, lng: ETIMESGUT.lng },
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
            })

            stats.analysesCreated++
          }

          // Companion arası bekleme
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        // Mekan arası bekleme
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error: any) {
        console.error(`  ❌ ${placeData.name} işlenirken hata:`, error.message)
      }
    }

    stats.placesSuccess = stats.placesProcessed
    stats.duration = Date.now() - startTime

    console.log(`\n✅ ${categoryConfig.displayName} tamamlandı:`)
    console.log(`   - Mekan: ${stats.placesSuccess}`)
    console.log(`   - Yorum: ${stats.reviewsCollected}`)
    console.log(`   - Analiz: ${stats.analysesCreated}`)
    console.log(`   - API Call: ${stats.apiCalls}`)
    console.log(`   - Süre: ${(stats.duration / 1000 / 60).toFixed(1)} dakika\n`)

    return stats
  } catch (error: any) {
    console.error(`❌ ${categoryConfig.displayName} sync hatası:`, error.message)
    stats.duration = Date.now() - startTime
    return stats
  }
}

/**
 * Ana sync fonksiyonu
 */
async function syncEtimesgut() {
  console.log('🚀 Ankara Etimesgut Sync Başlıyor...\n')
  console.log('📊 Yeni Verimlilik İyileştirmeleri Aktif:')
  console.log('   - Dinamik yorum örnekleme')
  console.log('   - Google Places API genişletilmiş alanlar')
  console.log('   - Database schema güncellemeleri\n')

  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.error('❌ GOOGLE_PLACES_API_KEY bulunamadı!')
    process.exit(1)
  }

  const allStats: SyncStats[] = []
  const startTime = Date.now()

  // Her kategori için (Google Maps kategorileri)
  for (const categoryKey of ETIMESGUT_CATEGORIES) {
    const stats = await syncCategory(categoryKey, apiKey)
    allStats.push(stats)

    // Kategori arası bekleme
    await new Promise(resolve => setTimeout(resolve, 3000))
  }

  // Özet
  const totalDuration = Date.now() - startTime
  const totalPlaces = allStats.reduce((sum, s) => sum + s.placesSuccess, 0)
  const totalReviews = allStats.reduce((sum, s) => sum + s.reviewsCollected, 0)
  const totalAnalyses = allStats.reduce((sum, s) => sum + s.analysesCreated, 0)
  const totalApiCalls = allStats.reduce((sum, s) => sum + s.apiCalls, 0)

  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 ETIMESGUT SYNC ÖZET')
  console.log(`${'='.repeat(60)}`)
  console.log(`✅ Toplam Mekan: ${totalPlaces}`)
  console.log(`📝 Toplam Yorum: ${totalReviews}`)
  console.log(`🤖 Toplam Analiz: ${totalAnalyses}`)
  console.log(`🔢 Toplam API Call: ${totalApiCalls}`)
  console.log(`💰 Tahmini Maliyet: $${((totalApiCalls * 0.017).toFixed(2))}`)
  console.log(`⏱️  Toplam Süre: ${(totalDuration / 1000 / 60).toFixed(1)} dakika`)
  console.log(`${'='.repeat(60)}\n`)

  process.exit(0)
}

// Sync'i başlat
syncEtimesgut().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

