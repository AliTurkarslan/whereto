#!/usr/bin/env tsx

/**
 * Veri Kalitesi Kontrol Scripti
 * 
 * Mevcut database'deki verilerin kalitesini kontrol eder:
 * - Tüm field'ların varlığı
 * - Veri bütünlüğü
 * - Analiz kalitesi
 * - Yorum kalitesi
 * - Eksik veriler
 */

import { config } from 'dotenv'
import { resolve } from 'path'
const envResult = config({ path: resolve(process.cwd(), '.env.local') })

if (envResult.error) {
  console.error('❌ .env.local dosyası yüklenemedi:', envResult.error)
  process.exit(1)
}

import { db } from '../lib/db'
import { places, reviews, analyses } from '../lib/db/schema'
import { sql, count, and, isNotNull, isNull, gte, lt } from 'drizzle-orm'
import { logger } from '../lib/logging/logger'

interface QualityReport {
  totalPlaces: number
  placesWithAllFields: number
  placesWithReviews: number
  placesWithAnalyses: number
  averageReviewCount: number
  averageRating: number
  fieldCompleteness: Record<string, number> // field -> percentage
  categoryDistribution: Record<string, number>
  analysisCoverage: {
    total: number
    byCategory: Record<string, number>
    byCompanion: Record<string, number>
  }
  issues: string[]
  recommendations: string[]
}

async function checkDataQuality(): Promise<QualityReport> {
  console.log('🔍 Veri kalitesi kontrolü başlatılıyor...\n')

  const report: QualityReport = {
    totalPlaces: 0,
    placesWithAllFields: 0,
    placesWithReviews: 0,
    placesWithAnalyses: 0,
    averageReviewCount: 0,
    averageRating: 0,
    fieldCompleteness: {},
    categoryDistribution: {},
    analysisCoverage: {
      total: 0,
      byCategory: {},
      byCompanion: {},
    },
    issues: [],
    recommendations: [],
  }

  try {
    // 1. Toplam mekan sayısı
    const [totalResult] = await db.select({ count: count() }).from(places)
    report.totalPlaces = totalResult.count
    console.log(`📊 Toplam mekan sayısı: ${report.totalPlaces}`)

    if (report.totalPlaces === 0) {
      report.issues.push('❌ Database\'de hiç mekan yok!')
      report.recommendations.push('🔧 Sync script çalıştırılmalı')
      return report
    }

    // 2. Field completeness kontrolü
    console.log('\n📋 Field completeness kontrolü...')
    const criticalFields = [
      'name',
      'address',
      'lat',
      'lng',
      'rating',
      'reviewCount',
      'category',
      'phone',
      'website',
      'openingHours',
      'priceLevel',
      'primaryType',
      'goodForChildren',
      'outdoorSeating',
      'parkingOptions',
      'servesBreakfast',
      'servesLunch',
      'servesDinner',
      'takeout',
      'delivery',
      'dineIn',
    ]

    for (const field of criticalFields) {
      const [result] = await db
        .select({ count: count() })
        .from(places)
        .where(isNotNull((places as any)[field]))
      
      const percentage = (result.count / report.totalPlaces) * 100
      report.fieldCompleteness[field] = percentage
      
      if (percentage < 50) {
        report.issues.push(`⚠️  ${field}: Sadece %${percentage.toFixed(1)} dolu`)
      }
    }

    // 3. Tüm kritik field'ları olan mekanlar
    const [allFieldsResult] = await db
      .select({ count: count() })
      .from(places)
      .where(
        and(
          isNotNull(places.name),
          isNotNull(places.address),
          isNotNull(places.lat),
          isNotNull(places.lng),
          isNotNull(places.rating),
          isNotNull(places.reviewCount),
          isNotNull(places.category),
        )
      )
    report.placesWithAllFields = allFieldsResult.count
    console.log(`✅ Tüm kritik field'ları olan mekanlar: ${report.placesWithAllFields} (%${((report.placesWithAllFields / report.totalPlaces) * 100).toFixed(1)})`)

    // 4. Yorum sayısı kontrolü
    const [reviewsResult] = await db
      .select({ 
        count: count(),
        avgReviewCount: sql<number>`AVG(${places.reviewCount})`,
        avgRating: sql<number>`AVG(${places.rating})`,
      })
      .from(places)
      .where(isNotNull(places.reviewCount))
    
    // Type safety: SQL sonucu string veya number olabilir
    const avgReviewCount = typeof reviewsResult.avgReviewCount === 'string' 
      ? parseFloat(reviewsResult.avgReviewCount) 
      : (reviewsResult.avgReviewCount || 0)
    const avgRating = typeof reviewsResult.avgRating === 'string'
      ? parseFloat(reviewsResult.avgRating)
      : (reviewsResult.avgRating || 0)
    
    report.averageReviewCount = Number.isNaN(avgReviewCount) ? 0 : avgReviewCount
    report.averageRating = Number.isNaN(avgRating) ? 0 : avgRating
    console.log(`\n💬 Yorum istatistikleri:`)
    console.log(`   Ortalama yorum sayısı: ${report.averageReviewCount.toFixed(1)}`)
    console.log(`   Ortalama rating: ${report.averageRating.toFixed(2)}`)

    // 5. Yorumları olan mekanlar
    const [placesWithReviewsResult] = await db
      .select({ count: count() })
      .from(places)
      .where(
        and(
          isNotNull(places.reviewCount),
          gte(places.reviewCount, 20)
        )
      )
    report.placesWithReviews = placesWithReviewsResult.count
    console.log(`✅ 20+ yorumu olan mekanlar: ${report.placesWithReviews} (%${((report.placesWithReviews / report.totalPlaces) * 100).toFixed(1)})`)

    if (report.placesWithReviews < report.totalPlaces * 0.7) {
      report.issues.push(`⚠️  Sadece %${((report.placesWithReviews / report.totalPlaces) * 100).toFixed(1)} mekanın yeterli yorumu var (hedef: %70)`)
      report.recommendations.push('🔧 Yorum sayısı düşük mekanlar için sync yapılmalı')
    }

    // 6. Kategori dağılımı
    console.log('\n📂 Kategori dağılımı:')
    const categoryResults = await db
      .select({
        category: places.category,
        count: count(),
      })
      .from(places)
      .where(isNotNull(places.category))
      .groupBy(places.category)
      .orderBy(sql`count DESC`)
      .limit(20)
    
    for (const row of categoryResults) {
      const percentage = (row.count / report.totalPlaces) * 100
      report.categoryDistribution[row.category || 'unknown'] = row.count
      console.log(`   ${row.category}: ${row.count} (%${percentage.toFixed(1)})`)
    }

    // 7. Analiz kapsamı
    console.log('\n🤖 Analiz kapsamı:')
    const [analysesCountResult] = await db.select({ count: count() }).from(analyses)
    report.analysisCoverage.total = analysesCountResult.count
    
    // Analiz edilmiş mekan sayısı (unique placeId)
    const [uniqueAnalysedPlaces] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${analyses.placeId})` })
      .from(analyses)
    report.placesWithAnalyses = uniqueAnalysedPlaces.count || 0
    
    console.log(`   Toplam analiz: ${report.analysisCoverage.total}`)
    console.log(`   Analiz edilmiş mekan: ${report.placesWithAnalyses} (%${((report.placesWithAnalyses / report.totalPlaces) * 100).toFixed(1)})`)

    if (report.placesWithAnalyses < report.totalPlaces * 0.5) {
      report.issues.push(`⚠️  Sadece %${((report.placesWithAnalyses / report.totalPlaces) * 100).toFixed(1)} mekan analiz edilmiş (hedef: %50)`)
      report.recommendations.push('🔧 Analiz edilmemiş mekanlar için analiz yapılmalı')
    }

    // Kategori bazlı analiz
    const categoryAnalyses = await db
      .select({
        category: analyses.category,
        count: count(),
      })
      .from(analyses)
      .groupBy(analyses.category)
      .orderBy(sql`count DESC`)
    
    for (const row of categoryAnalyses) {
      report.analysisCoverage.byCategory[row.category] = row.count
      console.log(`   ${row.category}: ${row.count} analiz`)
    }

    // Companion bazlı analiz
    const companionAnalyses = await db
      .select({
        companion: analyses.companion,
        count: count(),
      })
      .from(analyses)
      .groupBy(analyses.companion)
      .orderBy(sql`count DESC`)
    
    for (const row of companionAnalyses) {
      report.analysisCoverage.byCompanion[row.companion] = row.count
      console.log(`   ${row.companion}: ${row.count} analiz`)
    }

    // 8. Eksik veriler
    console.log('\n❌ Eksik veriler:')
    
    // Rating'i olmayan mekanlar
    const [noRating] = await db
      .select({ count: count() })
      .from(places)
      .where(isNull(places.rating))
    if (noRating.count > 0) {
      report.issues.push(`⚠️  ${noRating.count} mekanın rating'i yok`)
      console.log(`   Rating yok: ${noRating.count}`)
    }

    // Yorumu olmayan mekanlar
    const [noReviews] = await db
      .select({ count: count() })
      .from(places)
      .where(
        or(
          isNull(places.reviewCount),
          lt(places.reviewCount, 20)
        )
      )
    if (noReviews.count > 0) {
      report.issues.push(`⚠️  ${noReviews.count} mekanın yeterli yorumu yok (<20)`)
      console.log(`   Yeterli yorum yok: ${noReviews.count}`)
    }

    // Kategorisi olmayan mekanlar
    const [noCategory] = await db
      .select({ count: count() })
      .from(places)
      .where(isNull(places.category))
    if (noCategory.count > 0) {
      report.issues.push(`⚠️  ${noCategory.count} mekanın kategorisi yok`)
      console.log(`   Kategori yok: ${noCategory.count}`)
    }

    // Analiz edilmemiş mekanlar
    const [noAnalysis] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${places.id})` })
      .from(places)
      .leftJoin(analyses, sql`${places.id} = ${analyses.placeId}`)
      .where(isNull(analyses.id))
    if (noAnalysis.count > 0) {
      report.issues.push(`⚠️  ${noAnalysis.count} mekan analiz edilmemiş`)
      console.log(`   Analiz yok: ${noAnalysis.count}`)
    }

    // 9. Öneriler
    console.log('\n💡 Öneriler:')
    
    if (report.averageReviewCount < 30) {
      report.recommendations.push('🔧 Ortalama yorum sayısı düşük - Daha fazla yorum toplanmalı')
    }
    
    if (report.averageRating < 3.5) {
      report.recommendations.push('🔧 Ortalama rating düşük - Daha kaliteli mekanlar eklenmeli')
    }
    
    if (Object.keys(report.categoryDistribution).length < 5) {
      report.recommendations.push('🔧 Kategori çeşitliliği düşük - Daha fazla kategori eklenmeli')
    }

    // Field completeness önerileri
    for (const [field, percentage] of Object.entries(report.fieldCompleteness)) {
      if (percentage < 30) {
        report.recommendations.push(`🔧 ${field} field'ı çok eksik (%${percentage.toFixed(1)}) - Google Maps API'den alınmalı`)
      }
    }

  } catch (error) {
    logger.error('Data quality check failed', error instanceof Error ? error : new Error(String(error)), {})
    throw error
  }

  return report
}

// Ana fonksiyon
async function main() {
  try {
    const report = await checkDataQuality()

    // Özet rapor
    console.log('\n' + '='.repeat(60))
    console.log('📊 VERİ KALİTESİ RAPORU ÖZET')
    console.log('='.repeat(60))
    console.log(`Toplam Mekan: ${report.totalPlaces}`)
    console.log(`Tüm Field'ları Olan: ${report.placesWithAllFields} (%${((report.placesWithAllFields / report.totalPlaces) * 100).toFixed(1)})`)
    console.log(`Yeterli Yorumu Olan: ${report.placesWithReviews} (%${((report.placesWithReviews / report.totalPlaces) * 100).toFixed(1)})`)
    console.log(`Analiz Edilmiş: ${report.placesWithAnalyses} (%${((report.placesWithAnalyses / report.totalPlaces) * 100).toFixed(1)})`)
    console.log(`Ortalama Yorum Sayısı: ${report.averageReviewCount.toFixed(1)}`)
    console.log(`Ortalama Rating: ${report.averageRating.toFixed(2)}`)

    if (report.issues.length > 0) {
      console.log('\n⚠️  SORUNLAR:')
      report.issues.forEach(issue => console.log(`   ${issue}`))
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 ÖNERİLER:')
      report.recommendations.forEach(rec => console.log(`   ${rec}`))
    }

    // Kalite skoru
    const qualityScore = calculateQualityScore(report)
    console.log(`\n🎯 GENEL KALİTE SKORU: ${qualityScore.toFixed(1)}/100`)
    
    if (qualityScore < 60) {
      console.log('❌ Kalite skoru düşük - Acil iyileştirme gerekli!')
    } else if (qualityScore < 80) {
      console.log('⚠️  Kalite skoru orta - İyileştirme önerilir')
    } else {
      console.log('✅ Kalite skoru iyi - Sistem hazır!')
    }

  } catch (error) {
    console.error('❌ Hata:', error)
    process.exit(1)
  }
}

function calculateQualityScore(report: QualityReport): number {
  let score = 0

  // Field completeness (30 puan)
  const avgCompleteness = Object.values(report.fieldCompleteness).reduce((a, b) => a + b, 0) / Object.keys(report.fieldCompleteness).length
  score += (avgCompleteness / 100) * 30

  // Review coverage (25 puan)
  const reviewCoverage = (report.placesWithReviews / report.totalPlaces) * 100
  score += (reviewCoverage / 100) * 25

  // Analysis coverage (25 puan)
  const analysisCoverage = (report.placesWithAnalyses / report.totalPlaces) * 100
  score += (analysisCoverage / 100) * 25

  // Average review count (10 puan)
  const reviewCountScore = Math.min(1, report.averageReviewCount / 50) * 10
  score += reviewCountScore

  // Average rating (10 puan)
  const ratingScore = ((report.averageRating - 2) / 3) * 10 // 2-5 arası normalize
  score += Math.max(0, Math.min(10, ratingScore))

  return Math.min(100, Math.max(0, score))
}

// Import eksik
import { or } from 'drizzle-orm'

main()

