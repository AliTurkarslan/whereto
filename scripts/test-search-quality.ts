#!/usr/bin/env tsx

/**
 * Arama Kalitesi Test Scripti
 * 
 * Arama sisteminin doğru çalışıp çalışmadığını test eder:
 * - API endpoint testleri
 * - Database query testleri
 * - Öneri motoru testleri
 * - Sonuç kalitesi kontrolü
 */

import { config } from 'dotenv'
import { resolve } from 'path'
const envResult = config({ path: resolve(process.cwd(), '.env.local') })

if (envResult.error) {
  console.error('❌ .env.local dosyası yüklenemedi:', envResult.error)
  process.exit(1)
}

import { db } from '../lib/db'
import { places, analyses } from '../lib/db/schema'
import { sql, count, and, isNotNull, gte } from 'drizzle-orm'
import { logger } from '../lib/logging/logger'
import { getPlacesWithAnalyses } from '../lib/db'
import { RecommendationEngine } from '../lib/recommendation/engine'
import { convertPlaceToFeatures } from '../lib/utils/place-converter'
import type { UserProfile } from '../lib/types/user-profile'
import { USER_NEED_CATEGORIES, getGoogleMapsTypesForUserNeed } from '../lib/config/user-needs-categories'

interface SearchQualityReport {
  databaseQuery: {
    success: boolean
    placesFound: number
    hasAnalyses: number
    averageDistance: number
    issues: string[]
  }
  recommendationEngine: {
    success: boolean
    inputCount: number
    outputCount: number
    averageScore: number
    issues: string[]
  }
  resultQuality: {
    averageRating: number
    averageReviewCount: number
    relevanceScore: number
    issues: string[]
  }
  overallScore: number
  recommendations: string[]
}

async function testSearchQuality(): Promise<SearchQualityReport> {
  console.log('🔍 Arama kalitesi testi başlatılıyor...\n')

  const report: SearchQualityReport = {
    databaseQuery: {
      success: false,
      placesFound: 0,
      hasAnalyses: 0,
      averageDistance: 0,
      issues: [],
    },
    recommendationEngine: {
      success: false,
      inputCount: 0,
      outputCount: 0,
      averageScore: 0,
      issues: [],
    },
    resultQuality: {
      averageRating: 0,
      averageReviewCount: 0,
      relevanceScore: 0,
      issues: [],
    },
    overallScore: 0,
    recommendations: [],
  }

  try {
    // Test parametreleri (Ankara Çankaya)
    const testLocation = {
      lat: 39.9179,
      lng: 32.8543,
      address: 'Çankaya, Ankara',
    }

    // Kullanıcı ihtiyaç kategorisi kullan (yemek, kahve, vb.)
    const testCategory = 'yemek' // 'restaurant' yerine 'yemek' kullanıcı ihtiyaç kategorisi
    const testCompanion = 'alone'

    console.log('📍 Test Lokasyonu:', testLocation.address)
    console.log('🍽️  Test Kategorisi:', testCategory)
    console.log('👤 Test Companion:', testCompanion)
    console.log('')

    // 1. Database Query Testi
    console.log('1️⃣  Database Query Testi...')
    try {
      // Kullanıcı ihtiyaç kategorisini Google Maps type'larına çevir
      const categoryInput = testCategory.toLowerCase().trim()
      let googleMapsTypes: string[] = []

      if (USER_NEED_CATEGORIES[categoryInput]) {
        googleMapsTypes = getGoogleMapsTypesForUserNeed(categoryInput)
      } else {
        // Fallback: Direkt kategori grubu veya place type olarak kullan
        googleMapsTypes = [categoryInput]
      }

      const places = await getPlacesWithAnalyses(
        testLocation.lat,
        testLocation.lng,
        testCategory, // categoryOrGroupId
        testCompanion,
        50, // limit
        googleMapsTypes // Google Maps types
      )

      report.databaseQuery.placesFound = places.length
      report.databaseQuery.success = places.length > 0

      if (places.length === 0) {
        report.databaseQuery.issues.push('❌ Hiç mekan bulunamadı')
        console.log('   ❌ Hiç mekan bulunamadı')
      } else {
        console.log(`   ✅ ${places.length} mekan bulundu`)

        // Analiz edilmiş mekan sayısı
        const withAnalyses = places.filter(p => p.score !== undefined && p.score !== null)
        report.databaseQuery.hasAnalyses = withAnalyses.length
        console.log(`   📊 ${withAnalyses.length} mekan analiz edilmiş (%${((withAnalyses.length / places.length) * 100).toFixed(1)})`)

        if (withAnalyses.length < places.length * 0.5) {
          report.databaseQuery.issues.push(`⚠️  Sadece %${((withAnalyses.length / places.length) * 100).toFixed(1)} mekan analiz edilmiş (hedef: %50+)`)
        }

        // Ortalama mesafe
        const distances = places.filter(p => p.distance !== undefined).map(p => p.distance!)
        if (distances.length > 0) {
          report.databaseQuery.averageDistance = distances.reduce((a, b) => a + b, 0) / distances.length
          console.log(`   📏 Ortalama mesafe: ${report.databaseQuery.averageDistance.toFixed(2)} km`)

          if (report.databaseQuery.averageDistance > 10) {
            report.databaseQuery.issues.push(`⚠️  Ortalama mesafe çok yüksek (${report.databaseQuery.averageDistance.toFixed(2)} km)`)
          }
        }

        // Rating kontrolü
        const withRating = places.filter(p => p.rating !== undefined && p.rating !== null)
        console.log(`   ⭐ ${withRating.length} mekanın rating'i var`)

        if (withRating.length < places.length * 0.8) {
          report.databaseQuery.issues.push(`⚠️  Sadece %${((withRating.length / places.length) * 100).toFixed(1)} mekanın rating'i var`)
        }

        // Review count kontrolü
        const withReviews = places.filter(p => {
          const reviewCount = p.totalReviewCount || p.analyzedReviewCount || 0
          return reviewCount >= 20
        })
        console.log(`   💬 ${withReviews.length} mekanın yeterli yorumu var (20+)`)

        if (withReviews.length < places.length * 0.7) {
          report.databaseQuery.issues.push(`⚠️  Sadece %${((withReviews.length / places.length) * 100).toFixed(1)} mekanın yeterli yorumu var`)
        }

        // Ortalama yorum sayısı
        const reviewCounts = places.map(p => p.totalReviewCount || p.analyzedReviewCount || 0).filter(c => c > 0)
        if (reviewCounts.length > 0) {
          const avgReviewCount = reviewCounts.reduce((a, b) => a + b, 0) / reviewCounts.length
          console.log(`   📊 Ortalama yorum sayısı: ${avgReviewCount.toFixed(1)}`)
        }
      }
    } catch (error) {
      report.databaseQuery.issues.push(`❌ Database query hatası: ${error instanceof Error ? error.message : String(error)}`)
      console.log(`   ❌ Hata: ${error instanceof Error ? error.message : String(error)}`)
    }

    console.log('')

    // 2. Öneri Motoru Testi
    console.log('2️⃣  Öneri Motoru Testi...')
    try {
      // Kullanıcı ihtiyaç kategorisini Google Maps type'larına çevir
      const categoryInput = testCategory.toLowerCase().trim()
      let googleMapsTypes: string[] = []

      if (USER_NEED_CATEGORIES[categoryInput]) {
        googleMapsTypes = getGoogleMapsTypesForUserNeed(categoryInput)
      } else {
        // Fallback: Direkt kategori grubu veya place type olarak kullan
        googleMapsTypes = [categoryInput]
      }

      const places = await getPlacesWithAnalyses(
        testLocation.lat,
        testLocation.lng,
        testCategory, // categoryOrGroupId
        testCompanion,
        50, // limit
        googleMapsTypes // Google Maps types
      )

      if (places.length === 0) {
        report.recommendationEngine.issues.push('❌ Test için mekan bulunamadı')
        console.log('   ❌ Test için mekan bulunamadı')
      } else {
        const placeFeatures = places.map(convertPlaceToFeatures)
        report.recommendationEngine.inputCount = placeFeatures.length

        const userProfile: UserProfile = {
          location: testLocation,
          category: testCategory,
          companion: testCompanion,
          limit: 10,
        }

        const engine = new RecommendationEngine()
        const recommendations = await engine.recommend(placeFeatures, userProfile)

        report.recommendationEngine.outputCount = recommendations.length
        report.recommendationEngine.success = recommendations.length > 0

        if (recommendations.length === 0) {
          report.recommendationEngine.issues.push('❌ Öneri motoru hiç sonuç döndürmedi')
          console.log('   ❌ Hiç sonuç döndürmedi')
        } else {
          console.log(`   ✅ ${recommendations.length} öneri üretildi`)

          // Ortalama skor
          const scores = recommendations.map(r => r.finalScore)
          report.recommendationEngine.averageScore = scores.reduce((a, b) => a + b, 0) / scores.length
          console.log(`   📊 Ortalama skor: ${report.recommendationEngine.averageScore.toFixed(1)}/100`)

          if (report.recommendationEngine.averageScore < 50) {
            report.recommendationEngine.issues.push(`⚠️  Ortalama skor düşük (${report.recommendationEngine.averageScore.toFixed(1)})`)
          }

          // Skor dağılımı
          const highScore = recommendations.filter(r => r.finalScore >= 70).length
          const mediumScore = recommendations.filter(r => r.finalScore >= 50 && r.finalScore < 70).length
          const lowScore = recommendations.filter(r => r.finalScore < 50).length

          console.log(`   📈 Yüksek skor (70+): ${highScore}`)
          console.log(`   📊 Orta skor (50-69): ${mediumScore}`)
          console.log(`   📉 Düşük skor (<50): ${lowScore}`)

          if (highScore === 0) {
            report.recommendationEngine.issues.push('⚠️  Hiç yüksek skorlu öneri yok (70+)')
          }

          // Mesafe kontrolü
          const distances = recommendations.filter(r => r.distance !== undefined).map(r => r.distance!)
          if (distances.length > 0) {
            const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length
            console.log(`   📏 Ortalama mesafe: ${avgDistance.toFixed(2)} km`)

            if (avgDistance > 5) {
              report.recommendationEngine.issues.push(`⚠️  Ortalama mesafe yüksek (${avgDistance.toFixed(2)} km)`)
            }
          }
        }
      }
    } catch (error) {
      report.recommendationEngine.issues.push(`❌ Öneri motoru hatası: ${error instanceof Error ? error.message : String(error)}`)
      console.log(`   ❌ Hata: ${error instanceof Error ? error.message : String(error)}`)
    }

    console.log('')

    // 3. Sonuç Kalitesi Testi
    console.log('3️⃣  Sonuç Kalitesi Testi...')
    try {
      // Kullanıcı ihtiyaç kategorisini Google Maps type'larına çevir
      const categoryInput = testCategory.toLowerCase().trim()
      let googleMapsTypes: string[] = []

      if (USER_NEED_CATEGORIES[categoryInput]) {
        googleMapsTypes = getGoogleMapsTypesForUserNeed(categoryInput)
      } else {
        // Fallback: Direkt kategori grubu veya place type olarak kullan
        googleMapsTypes = [categoryInput]
      }

      const places = await getPlacesWithAnalyses(
        testLocation.lat,
        testLocation.lng,
        testCategory, // categoryOrGroupId
        testCompanion,
        50, // limit
        googleMapsTypes // Google Maps types
      )

      if (places.length === 0) {
        report.resultQuality.issues.push('❌ Test için mekan bulunamadı')
        console.log('   ❌ Test için mekan bulunamadı')
      } else {
        const placeFeatures = places.map(convertPlaceToFeatures)
        const userProfile: UserProfile = {
          location: testLocation,
          category: testCategory,
          companion: testCompanion,
          limit: 10,
        }

        const engine = new RecommendationEngine()
        const recommendations = await engine.recommend(placeFeatures, userProfile)

        if (recommendations.length > 0) {
          // Ortalama rating
          const ratings = recommendations.filter(r => r.rating !== undefined).map(r => r.rating!)
          if (ratings.length > 0) {
            report.resultQuality.averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length
            console.log(`   ⭐ Ortalama rating: ${report.resultQuality.averageRating.toFixed(2)}/5`)

            if (report.resultQuality.averageRating < 3.5) {
              report.resultQuality.issues.push(`⚠️  Ortalama rating düşük (${report.resultQuality.averageRating.toFixed(2)})`)
            }
          }

          // Ortalama review count
          const reviewCounts = recommendations.map(r => r.totalReviewCount || r.analyzedReviewCount || 0)
          report.resultQuality.averageReviewCount = reviewCounts.reduce((a, b) => a + b, 0) / reviewCounts.length
          console.log(`   💬 Ortalama yorum sayısı: ${report.resultQuality.averageReviewCount.toFixed(1)}`)

          if (report.resultQuality.averageReviewCount < 20) {
            report.resultQuality.issues.push(`⚠️  Ortalama yorum sayısı düşük (${report.resultQuality.averageReviewCount.toFixed(1)})`)
          }

          // Relevance score (skor, rating, review count kombinasyonu)
          let relevanceSum = 0
          for (const rec of recommendations) {
            let relevance = rec.finalScore / 100 // 0-1
            if (rec.rating) {
              relevance += (rec.rating / 5) * 0.3 // Rating katkısı
            }
            const reviewCount = rec.totalReviewCount || rec.analyzedReviewCount || 0
            relevance += Math.min(1, reviewCount / 100) * 0.2 // Review count katkısı
            relevanceSum += relevance
          }
          report.resultQuality.relevanceScore = (relevanceSum / recommendations.length) * 100
          console.log(`   🎯 Relevance skoru: ${report.resultQuality.relevanceScore.toFixed(1)}/100`)

          if (report.resultQuality.relevanceScore < 60) {
            report.resultQuality.issues.push(`⚠️  Relevance skoru düşük (${report.resultQuality.relevanceScore.toFixed(1)})`)
          }
        }
      }
    } catch (error) {
      report.resultQuality.issues.push(`❌ Sonuç kalitesi testi hatası: ${error instanceof Error ? error.message : String(error)}`)
      console.log(`   ❌ Hata: ${error instanceof Error ? error.message : String(error)}`)
    }

    // Genel skor hesaplama
    report.overallScore = calculateOverallScore(report)

    // Öneriler
    if (report.databaseQuery.placesFound === 0) {
      report.recommendations.push('🔧 Database\'de veri yok - Sync script çalıştırılmalı')
    }
    if (report.databaseQuery.hasAnalyses < report.databaseQuery.placesFound * 0.5) {
      report.recommendations.push('🔧 Analiz edilmemiş mekanlar için analiz yapılmalı')
    }
    if (report.recommendationEngine.averageScore < 50) {
      report.recommendations.push('🔧 Öneri motoru skorlama algoritması iyileştirilmeli')
    }
    if (report.resultQuality.relevanceScore < 60) {
      report.recommendations.push('🔧 Sonuç kalitesi düşük - Daha fazla veri toplanmalı')
    }

  } catch (error) {
    logger.error('Search quality test failed', error instanceof Error ? error : new Error(String(error)), {})
    throw error
  }

  return report
}

function calculateOverallScore(report: SearchQualityReport): number {
  let score = 0

  // Database query (30 puan)
  if (report.databaseQuery.success) {
    score += 15
    if (report.databaseQuery.placesFound >= 10) score += 10
    if (report.databaseQuery.hasAnalyses >= report.databaseQuery.placesFound * 0.5) score += 5
  }

  // Recommendation engine (40 puan)
  if (report.recommendationEngine.success) {
    score += 20
    if (report.recommendationEngine.outputCount > 0) score += 10
    if (report.recommendationEngine.averageScore >= 50) score += 10
  }

  // Result quality (30 puan)
  if (report.resultQuality.relevanceScore > 0) {
    score += (report.resultQuality.relevanceScore / 100) * 30
  }

  return Math.min(100, Math.max(0, score))
}

// Ana fonksiyon
async function main() {
  try {
    const report = await testSearchQuality()

    // Özet rapor
    console.log('\n' + '='.repeat(60))
    console.log('📊 ARAMA KALİTESİ RAPORU')
    console.log('='.repeat(60))
    console.log(`\n🎯 Genel Skor: ${report.overallScore.toFixed(1)}/100`)

    console.log('\n📋 Database Query:')
    console.log(`   Durum: ${report.databaseQuery.success ? '✅' : '❌'}`)
    console.log(`   Mekan Sayısı: ${report.databaseQuery.placesFound}`)
    console.log(`   Analiz Edilmiş: ${report.databaseQuery.hasAnalyses}`)
    console.log(`   Ortalama Mesafe: ${report.databaseQuery.averageDistance.toFixed(2)} km`)
    if (report.databaseQuery.issues.length > 0) {
      console.log('   Sorunlar:')
      report.databaseQuery.issues.forEach(issue => console.log(`     ${issue}`))
    }

    console.log('\n🤖 Öneri Motoru:')
    console.log(`   Durum: ${report.recommendationEngine.success ? '✅' : '❌'}`)
    console.log(`   Girdi: ${report.recommendationEngine.inputCount}`)
    console.log(`   Çıktı: ${report.recommendationEngine.outputCount}`)
    console.log(`   Ortalama Skor: ${report.recommendationEngine.averageScore.toFixed(1)}/100`)
    if (report.recommendationEngine.issues.length > 0) {
      console.log('   Sorunlar:')
      report.recommendationEngine.issues.forEach(issue => console.log(`     ${issue}`))
    }

    console.log('\n⭐ Sonuç Kalitesi:')
    console.log(`   Ortalama Rating: ${report.resultQuality.averageRating.toFixed(2)}/5`)
    console.log(`   Ortalama Yorum Sayısı: ${report.resultQuality.averageReviewCount.toFixed(1)}`)
    console.log(`   Relevance Skoru: ${report.resultQuality.relevanceScore.toFixed(1)}/100`)
    if (report.resultQuality.issues.length > 0) {
      console.log('   Sorunlar:')
      report.resultQuality.issues.forEach(issue => console.log(`     ${issue}`))
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 Öneriler:')
      report.recommendations.forEach(rec => console.log(`   ${rec}`))
    }

    if (report.overallScore < 60) {
      console.log('\n❌ Genel skor düşük - Acil iyileştirme gerekli!')
      process.exit(1)
    } else if (report.overallScore < 80) {
      console.log('\n⚠️  Genel skor orta - İyileştirme önerilir')
    } else {
      console.log('\n✅ Genel skor iyi - Sistem hazır!')
    }

  } catch (error) {
    console.error('❌ Hata:', error)
    process.exit(1)
  }
}

main()

