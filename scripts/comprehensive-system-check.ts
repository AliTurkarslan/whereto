#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { places, reviews, analyses } from '../lib/db/schema'
import { sql, count, isNotNull, desc } from 'drizzle-orm'

async function comprehensiveSystemCheck() {
  console.log('🔍 Kapsamlı Sistem Kontrolü Başlatılıyor...\n')

  const issues: string[] = []
  const warnings: string[] = []
  const successes: string[] = []

  // 1. Database bağlantısı
  console.log('1️⃣  Database Bağlantısı...')
  try {
    await db.execute(sql`SELECT 1`)
    successes.push('✅ Database bağlantısı başarılı')
  } catch (error) {
    issues.push(`❌ Database bağlantı hatası: ${error}`)
  }
  console.log()

  // 2. Veri kalitesi
  console.log('2️⃣  Veri Kalitesi...')
  try {
    const totalPlaces = await db.select({ count: count() }).from(places)
    const totalReviews = await db.select({ count: count() }).from(reviews)
    const totalAnalyses = await db.select({ count: count() }).from(analyses)

    if (totalPlaces[0].count === 0) {
      issues.push('❌ Database\'de mekan yok')
    } else {
      successes.push(`✅ ${totalPlaces[0].count} mekan var`)
    }

    if (totalReviews[0].count === 0) {
      warnings.push('⚠️  Database\'de yorum yok')
    } else {
      successes.push(`✅ ${totalReviews[0].count} yorum var`)
    }

    if (totalAnalyses[0].count === 0) {
      warnings.push('⚠️  Database\'de analiz yok')
    } else {
      successes.push(`✅ ${totalAnalyses[0].count} analiz var`)
    }

    // Yorum-mekan oranı
    const avgReviewsPerPlace = totalReviews[0].count / totalPlaces[0].count
    if (avgReviewsPerPlace < 5) {
      warnings.push(`⚠️  Ortalama yorum sayısı düşük: ${avgReviewsPerPlace.toFixed(1)}`)
    } else {
      successes.push(`✅ Ortalama yorum sayısı: ${avgReviewsPerPlace.toFixed(1)}`)
    }

    // Analiz-mekan oranı
    const avgAnalysesPerPlace = totalAnalyses[0].count / totalPlaces[0].count
    if (avgAnalysesPerPlace < 3) {
      warnings.push(`⚠️  Ortalama analiz sayısı düşük: ${avgAnalysesPerPlace.toFixed(1)}`)
    } else {
      successes.push(`✅ Ortalama analiz sayısı: ${avgAnalysesPerPlace.toFixed(1)}`)
    }
  } catch (error) {
    issues.push(`❌ Veri kalitesi kontrolü hatası: ${error}`)
  }
  console.log()

  // 3. Mekan verisi kalitesi
  console.log('3️⃣  Mekan Verisi Kalitesi...')
  try {
    const placesWithRating = await db
      .select({ count: count() })
      .from(places)
      .where(isNotNull(places.rating))

    const placesWithGoogleMapsId = await db
      .select({ count: count() })
      .from(places)
      .where(isNotNull(places.googleMapsId))

    const totalPlaces = await db.select({ count: count() }).from(places)
    const total = totalPlaces[0].count

    const ratingPercentage = (placesWithRating[0].count / total) * 100
    const googleMapsIdPercentage = (placesWithGoogleMapsId[0].count / total) * 100

    if (ratingPercentage < 90) {
      warnings.push(`⚠️  Rating bilgisi olan mekan: ${ratingPercentage.toFixed(1)}%`)
    } else {
      successes.push(`✅ Rating bilgisi: ${ratingPercentage.toFixed(1)}%`)
    }

    if (googleMapsIdPercentage < 90) {
      warnings.push(`⚠️  Google Maps ID olan mekan: ${googleMapsIdPercentage.toFixed(1)}%`)
    } else {
      successes.push(`✅ Google Maps ID: ${googleMapsIdPercentage.toFixed(1)}%`)
    }
  } catch (error) {
    issues.push(`❌ Mekan verisi kontrolü hatası: ${error}`)
  }
  console.log()

  // 4. Yorum verisi kalitesi
  console.log('4️⃣  Yorum Verisi Kalitesi...')
  try {
    const totalReviews = await db.select({ count: count() }).from(reviews)
    const reviewsWithRating = await db.execute(sql`
      SELECT COUNT(*)::int as count 
      FROM reviews 
      WHERE rating IS NOT NULL
    `)
    const ratingCount = (reviewsWithRating as any).rows?.[0]?.count || 0

    if (totalReviews[0].count > 0) {
      const ratingPercentage = (ratingCount / totalReviews[0].count) * 100
      if (ratingPercentage < 50) {
        warnings.push(`⚠️  Rating bilgisi olan yorum: ${ratingPercentage.toFixed(1)}%`)
      } else {
        successes.push(`✅ Rating bilgisi: ${ratingPercentage.toFixed(1)}%`)
      }
    }
  } catch (error) {
    warnings.push(`⚠️  Yorum verisi kontrolü hatası: ${error}`)
  }
  console.log()

  // 5. Analiz kapsamı
  console.log('5️⃣  Analiz Kapsamı...')
  try {
    const placesWithAnalyses = await db.execute(sql`
      SELECT COUNT(DISTINCT place_id)::int as count
      FROM analyses
    `)
    const analysesCount = (placesWithAnalyses as any).rows?.[0]?.count || 0

    const totalPlaces = await db.select({ count: count() }).from(places)
    const coverage = (analysesCount / totalPlaces[0].count) * 100

    if (coverage < 80) {
      warnings.push(`⚠️  Analiz kapsamı: ${coverage.toFixed(1)}%`)
    } else {
      successes.push(`✅ Analiz kapsamı: ${coverage.toFixed(1)}%`)
    }
  } catch (error) {
    warnings.push(`⚠️  Analiz kapsamı kontrolü hatası: ${error}`)
  }
  console.log()

  // Özet
  console.log('='.repeat(60))
  console.log('📊 ÖZET')
  console.log('='.repeat(60))
  console.log(`✅ Başarılı: ${successes.length}`)
  console.log(`⚠️  Uyarı: ${warnings.length}`)
  console.log(`❌ Sorun: ${issues.length}`)
  console.log()

  if (successes.length > 0) {
    console.log('✅ BAŞARILILAR:')
    successes.forEach(s => console.log(`   ${s}`))
    console.log()
  }

  if (warnings.length > 0) {
    console.log('⚠️  UYARILAR:')
    warnings.forEach(w => console.log(`   ${w}`))
    console.log()
  }

  if (issues.length > 0) {
    console.log('❌ SORUNLAR:')
    issues.forEach(i => console.log(`   ${i}`))
    console.log()
  }

  // Genel durum
  console.log('='.repeat(60))
  if (issues.length === 0 && warnings.length <= 2) {
    console.log('✅ SİSTEM SAĞLIKLI')
  } else if (issues.length === 0) {
    console.log('⚠️  SİSTEM UYARI VERİYOR')
  } else {
    console.log('❌ SİSTEMDE SORUNLAR VAR')
  }
  console.log('='.repeat(60))
}

comprehensiveSystemCheck().catch(console.error)
