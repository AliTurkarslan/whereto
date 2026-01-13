#!/usr/bin/env tsx

/**
 * Skorlama Sistemini Doğrula
 * 
 * Mevcut database'deki verileri kontrol eder ve skorlama mantığının doğru çalıştığını doğrular
 */

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
import { places, analyses, reviews } from '../lib/db/schema'
import { eq, sql, desc, and } from 'drizzle-orm'
import { adjustScoreByReviewCount, calculateSortingScore } from '../lib/utils/score-adjustment'

async function verifyScoringSystem() {
  try {
    console.log('🔍 SKORLAMA SİSTEMİ DOĞRULAMA\n')
    console.log('='.repeat(80))
    
    // 1. En yüksek skorlu yerleri kontrol et
    console.log('\n📊 1. EN YÜKSEK SKORLU YERLER (İlk 10)\n')
    
    const topPlaces = await db
      .select({
        id: places.id,
        name: places.name,
        rating: places.rating,
        reviewCount: places.reviewCount,
        category: places.category,
        analysisScore: analyses.score,
        companion: analyses.companion,
      })
      .from(places)
      .innerJoin(analyses, eq(places.id, analyses.placeId))
      .orderBy(desc(analyses.score))
      .limit(10)
    
    for (const place of topPlaces) {
      // Yorum sayısını al
      const reviewCountResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(reviews)
        .where(eq(reviews.placeId, place.id))
      
      const actualReviewCount = reviewCountResult[0]?.count || 0
      const dbReviewCount = place.reviewCount || actualReviewCount
      
      // Ayarlanmış skoru hesapla
      // priorMean sabit 50 olmalı (rating'e göre değil), böylece az yorumlu yerlerin skorları düşer
      const adjustedScore = adjustScoreByReviewCount(
        place.analysisScore,
        dbReviewCount,
        {
          method: 'bayesian',
          priorMean: 50, // Sabit prior mean - rating'e göre değil!
          confidenceConstant: 10,
        }
      )
      
      const sortingScore = calculateSortingScore(
        place.analysisScore,
        dbReviewCount,
        place.rating || undefined
      )
      
      console.log(`📍 ${place.name}`)
      console.log(`   Kategori: ${place.category}`)
      console.log(`   Companion: ${place.companion}`)
      console.log(`   Rating: ${place.rating || 'N/A'}`)
      console.log(`   Yorum Sayısı: ${dbReviewCount}`)
      console.log(`   Orijinal Skor: ${place.analysisScore}`)
      console.log(`   Ayarlanmış Skor: ${adjustedScore}`)
      console.log(`   Sıralama Skoru: ${sortingScore}`)
      
      if (dbReviewCount < 10 && place.analysisScore > 80) {
        console.log(`   ⚠️  UYARI: Az yorumlu ama yüksek skorlu!`)
      }
      
      console.log('')
    }
    
    // 2. Az yorumlu ama yüksek skorlu yerleri kontrol et
    console.log('\n' + '='.repeat(80))
    console.log('\n⚠️  2. AZ YORUMLU AMA YÜKSEK SKORLU YERLER (< 10 yorum, > 80 skor)\n')
    
    const problematicPlaces = await db
      .select({
        id: places.id,
        name: places.name,
        rating: places.rating,
        reviewCount: places.reviewCount,
        category: places.category,
        analysisScore: analyses.score,
        companion: analyses.companion,
      })
      .from(places)
      .innerJoin(analyses, eq(places.id, analyses.placeId))
      .where(
        and(
          sql`${places.reviewCount} < 10`,
          sql`${analyses.score} > 80`
        )
      )
      .orderBy(desc(analyses.score))
      .limit(20)
    
    if (problematicPlaces.length > 0) {
      console.log(`⚠️  ${problematicPlaces.length} yer bulundu:\n`)
      
      for (const place of problematicPlaces) {
        const reviewCountResult = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(reviews)
          .where(eq(reviews.placeId, place.id))
        
        const actualReviewCount = reviewCountResult[0]?.count || 0
        const dbReviewCount = place.reviewCount || actualReviewCount
        
        // priorMean sabit 50 olmalı (rating'e göre değil), böylece az yorumlu yerlerin skorları düşer
        const adjustedScore = adjustScoreByReviewCount(
          place.analysisScore,
          dbReviewCount,
          {
            method: 'bayesian',
            priorMean: 50, // Sabit prior mean - rating'e göre değil!
            confidenceConstant: 10,
          }
        )
        
        const sortingScore = calculateSortingScore(
          place.analysisScore,
          dbReviewCount,
          place.rating || undefined
        )
        
        console.log(`📍 ${place.name}`)
        console.log(`   Yorum: ${dbReviewCount}, Orijinal: ${place.analysisScore}, Ayarlanmış: ${adjustedScore}, Sıralama: ${sortingScore}`)
      }
    } else {
      console.log('✅ Az yorumlu ama yüksek skorlu yer bulunamadı!')
    }
    
    // 3. Sıralama testi
    console.log('\n' + '='.repeat(80))
    console.log('\n🔄 3. SIRALAMA TESTİ\n')
    
    const testPlaces = await db
      .select({
        id: places.id,
        name: places.name,
        rating: places.rating,
        reviewCount: places.reviewCount,
        analysisScore: analyses.score,
        companion: analyses.companion,
      })
      .from(places)
      .innerJoin(analyses, eq(places.id, analyses.placeId))
      .where(eq(analyses.companion, 'alone')) // Tek companion için test
      .limit(50)
    
    // Her yer için sıralama skoru hesapla
    const placesWithSorting = await Promise.all(
      testPlaces.map(async (place) => {
        const reviewCountResult = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(reviews)
          .where(eq(reviews.placeId, place.id))
        
        const actualReviewCount = reviewCountResult[0]?.count || 0
        const dbReviewCount = place.reviewCount || actualReviewCount
        
        // priorMean sabit 50 olmalı (rating'e göre değil), böylece az yorumlu yerlerin skorları düşer
        const adjustedScore = adjustScoreByReviewCount(
          place.analysisScore,
          dbReviewCount,
          {
            method: 'bayesian',
            priorMean: 50, // Sabit prior mean - rating'e göre değil!
            confidenceConstant: 10,
          }
        )
        
        const sortingScore = calculateSortingScore(
          place.analysisScore,
          dbReviewCount,
          place.rating || undefined
        )
        
        return {
          ...place,
          actualReviewCount: dbReviewCount,
          adjustedScore,
          sortingScore,
        }
      })
    )
    
    // Sıralama skoruna göre sırala
    placesWithSorting.sort((a, b) => {
      if (a.sortingScore !== b.sortingScore) {
        return b.sortingScore - a.sortingScore
      }
      return (b.actualReviewCount || 0) - (a.actualReviewCount || 0)
    })
    
    console.log('📊 İlk 10 Yer (Sıralama Skoruna Göre):\n')
    for (let i = 0; i < Math.min(10, placesWithSorting.length); i++) {
      const place = placesWithSorting[i]
      console.log(`${i + 1}. ${place.name}`)
      console.log(`   Yorum: ${place.actualReviewCount}, Orijinal: ${place.analysisScore}, Ayarlanmış: ${place.adjustedScore}, Sıralama: ${place.sortingScore}`)
    }
    
    // Kontrol: İlk 5'te az yorumlu yer var mı?
    const top5LowReview = placesWithSorting.slice(0, 5).filter(p => (p.actualReviewCount || 0) < 10)
    if (top5LowReview.length > 0) {
      console.log(`\n⚠️  UYARI: İlk 5'te ${top5LowReview.length} az yorumlu yer var!`)
      for (const place of top5LowReview) {
        console.log(`   - ${place.name} (${place.actualReviewCount} yorum)`)
      }
    } else {
      console.log(`\n✅ İlk 5'te az yorumlu yer yok!`)
    }
    
    console.log('\n' + '='.repeat(80))
    console.log('\n✅ DOĞRULAMA TAMAMLANDI\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

verifyScoringSystem()

