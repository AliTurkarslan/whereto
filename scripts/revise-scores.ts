#!/usr/bin/env tsx

/**
 * Mevcut Analiz Skorlarını Revize Et
 * 
 * Yeni Bayesian Average sistemine göre mevcut analiz skorlarını günceller
 * Az yorumlu yerlerin skorlarını düşürür, çok yorumlu yerlerin skorlarını korur
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
  console.error('   .env.local dosyasında DATABASE_URL tanımlı olduğundan emin olun.')
  process.exit(1)
}

import { db } from '../lib/db'
import { places, analyses, reviews } from '../lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { adjustScoreByReviewCount } from '../lib/utils/score-adjustment'
import { logger } from '../lib/logging/logger'

interface AnalysisWithReviewCount {
  id: number
  placeId: number
  category: string
  companion: string
  score: number
  why: string
  risks: string | null
  reviewCount: number
  rating: number | null
}

async function reviseScores() {
  try {
    logger.info('🔄 Mevcut analiz skorlarını revize ediliyor...')

    // Tüm analizleri yorum sayısı ile birlikte çek
    const allAnalyses = await db
      .select({
        id: analyses.id,
        placeId: analyses.placeId,
        category: analyses.category,
        companion: analyses.companion,
        score: analyses.score,
        why: analyses.why,
        risks: analyses.risks,
        rating: places.rating,
      })
      .from(analyses)
      .innerJoin(places, eq(analyses.placeId, places.id))

    logger.info(`📊 ${allAnalyses.length} analiz bulundu`)

    // Her analiz için yorum sayısını al
    const analysesWithReviewCount: AnalysisWithReviewCount[] = []
    
    for (const analysis of allAnalyses) {
      // Bu place için yorum sayısını al
      const reviewCountResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(reviews)
        .where(eq(reviews.placeId, analysis.placeId))
      
      const reviewCount = reviewCountResult[0]?.count || 0
      
      analysesWithReviewCount.push({
        id: analysis.id,
        placeId: analysis.placeId,
        category: analysis.category,
        companion: analysis.companion,
        score: analysis.score,
        why: analysis.why,
        risks: analysis.risks,
        reviewCount,
        rating: analysis.rating,
      })
    }

    logger.info(`📝 Yorum sayıları hesaplandı`)

    // Her analiz için yeni skoru hesapla ve güncelle
    let updatedCount = 0
    let unchangedCount = 0
    let skippedCount = 0

    for (const analysis of analysesWithReviewCount) {
      // Yorum sayısına göre skoru ayarla
      // priorMean sabit 50 olmalı (rating'e göre değil), böylece az yorumlu yerlerin skorları düşer
      const newScore = adjustScoreByReviewCount(
        analysis.score,
        analysis.reviewCount,
        {
          method: 'bayesian',
          priorMean: 50, // Sabit prior mean - rating'e göre değil!
          confidenceConstant: 10,
        }
      )

      // Skor değişti mi kontrol et
      if (Math.abs(newScore - analysis.score) < 1) {
        // Skor neredeyse aynıysa (1 puan farktan az), güncelleme yapma
        unchangedCount++
        continue
      }

      // Eğer yorum sayısı çok azsa (0-2), skoru daha da düşür
      if (analysis.reviewCount < 3) {
        // Çok az yorumlu yerlerin skorunu daha agresif düşür
        const veryLowReviewScore = adjustScoreByReviewCount(
          analysis.score,
          analysis.reviewCount,
          {
            method: 'bayesian',
            priorMean: 50, // Sabit prior mean - rating'e göre değil!
            confidenceConstant: 20, // Daha yüksek güven sabiti = daha fazla düşüş
          }
        )
        
        await db
          .update(analyses)
          .set({ 
            score: veryLowReviewScore,
            updatedAt: new Date(),
          })
          .where(eq(analyses.id, analysis.id))
        
        updatedCount++
        logger.info(`   ⚠️  Analysis ID ${analysis.id}: Çok az yorum (${analysis.reviewCount}), skor düşürüldü: ${analysis.score} → ${veryLowReviewScore}`)
        continue
      }

      // Skoru güncelle
      await db
        .update(analyses)
        .set({ 
          score: newScore,
          updatedAt: new Date(),
        })
        .where(eq(analyses.id, analysis.id))

      updatedCount++
      
      if (updatedCount % 10 === 0) {
        logger.info(`   ✅ ${updatedCount} analiz güncellendi...`)
      }
    }

    logger.info(`\n🎉 Revize işlemi tamamlandı!`)
    logger.info(`   ✅ Güncellenen: ${updatedCount}`)
    logger.info(`   ⏭️  Değişmeyen: ${unchangedCount}`)
    logger.info(`   ⚠️  Atlanan (çok az yorum): ${skippedCount}`)
    logger.info(`   📊 Toplam: ${allAnalyses.length}`)

  } catch (error) {
    logger.error('❌ Error revising scores:', error)
    process.exit(1)
  }
}

reviseScores()

