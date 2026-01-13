/**
 * Etimesgut Veri Kontrol Scripti
 * 
 * Veritabanındaki Etimesgut verilerini kontrol eder ve sorunları tespit eder
 */

import { db } from '../lib/db'
import { places, reviews, analyses } from '../lib/db/schema'
import { eq, sql, and, like, isNotNull, isNull } from 'drizzle-orm'
import { logger } from '../lib/logging/logger'

interface DataStats {
  totalPlaces: number
  placesWithCoordinates: number
  placesWithoutCoordinates: number
  placesWithRating: number
  placesWithoutRating: number
  placesWithScore: number
  placesWithoutScore: number
  placesWithPhone: number
  placesWithWebsite: number
  placesWithOpeningHours: number
  placesWithPhotos: number
  totalReviews: number
  totalAnalyses: number
  placesWithReviews: number
  placesWithoutReviews: number
  placesWithAnalyses: number
  placesWithoutAnalyses: number
  averageScore: number
  averageRating: number
  scoreDistribution: Record<string, number>
  categoryDistribution: Record<string, number>
}

interface DataIssue {
  type: 'error' | 'warning' | 'info'
  message: string
  placeId?: number
  placeName?: string
  details?: Record<string, unknown>
}

async function checkEtimesgutData(): Promise<void> {
  logger.info('Etimesgut veri kontrolü başlatılıyor...')

  const issues: DataIssue[] = []
  const stats: DataStats = {
    totalPlaces: 0,
    placesWithCoordinates: 0,
    placesWithoutCoordinates: 0,
    placesWithRating: 0,
    placesWithoutRating: 0,
    placesWithScore: 0,
    placesWithoutScore: 0,
    placesWithPhone: 0,
    placesWithWebsite: 0,
    placesWithOpeningHours: 0,
    placesWithPhotos: 0,
    totalReviews: 0,
    totalAnalyses: 0,
    placesWithReviews: 0,
    placesWithoutReviews: 0,
    placesWithAnalyses: 0,
    placesWithoutAnalyses: 0,
    averageScore: 0,
    averageRating: 0,
    scoreDistribution: {},
    categoryDistribution: {},
  }

  try {
    // 1. Tüm mekanları getir (Etimesgut içeren adresler)
    const allPlaces = await db
      .select()
      .from(places)
      .where(like(places.address, '%Etimesgut%'))

    stats.totalPlaces = allPlaces.length
    logger.info(`Toplam ${stats.totalPlaces} mekan bulundu`)

    if (stats.totalPlaces === 0) {
      logger.warn('Etimesgut için hiç mekan bulunamadı!')
      return
    }

    // 2. Koordinat kontrolü
    for (const place of allPlaces) {
      if (place.lat && place.lng && place.lat !== 0 && place.lng !== 0) {
        stats.placesWithCoordinates++
        
        // Geçerli koordinat aralığı kontrolü (Türkiye için)
        if (place.lat < 35 || place.lat > 43 || place.lng < 25 || place.lng > 45) {
          issues.push({
            type: 'error',
            message: `Geçersiz koordinat aralığı`,
            placeId: place.id,
            placeName: place.name,
            details: { lat: place.lat, lng: place.lng },
          })
        }
      } else {
        stats.placesWithoutCoordinates++
        issues.push({
          type: 'error',
          message: `Koordinat bilgisi eksik veya geçersiz`,
          placeId: place.id,
          placeName: place.name,
          details: { lat: place.lat, lng: place.lng },
        })
      }

      // 3. Rating kontrolü
      if (place.rating && place.rating > 0 && place.rating <= 5) {
        stats.placesWithRating++
      } else {
        stats.placesWithoutRating++
        if (!place.rating || place.rating === 0) {
          issues.push({
            type: 'warning',
            message: `Rating bilgisi eksik`,
            placeId: place.id,
            placeName: place.name,
          })
        } else if (place.rating > 5 || place.rating < 0) {
          issues.push({
            type: 'error',
            message: `Geçersiz rating değeri (0-5 arası olmalı)`,
            placeId: place.id,
            placeName: place.name,
            details: { rating: place.rating },
          })
        }
      }

      // 4. Score kontrolü - analyses tablosundan kontrol et
      // Score places tablosunda değil, analyses tablosunda tutuluyor (category+companion'a göre değişir)
      // Bu yüzden bu kontrolü atlıyoruz - analyses kontrolü aşağıda yapılıyor

      // 5. İletişim bilgileri kontrolü
      if (place.phone) stats.placesWithPhone++
      if (place.website) stats.placesWithWebsite++
      if (place.openingHours) stats.placesWithOpeningHours++
      if (place.photos) {
        try {
          const photos = typeof place.photos === 'string' ? JSON.parse(place.photos) : place.photos
          if (Array.isArray(photos) && photos.length > 0) {
            stats.placesWithPhotos++
          }
        } catch (e) {
          issues.push({
            type: 'warning',
            message: `Photos JSON parse hatası`,
            placeId: place.id,
            placeName: place.name,
          })
        }
      }

      // 6. İsim ve adres kontrolü
      if (!place.name || place.name.trim().length === 0) {
        issues.push({
          type: 'error',
          message: `İsim bilgisi eksik`,
          placeId: place.id,
        })
      }

      if (!place.address || place.address.trim().length === 0) {
        issues.push({
          type: 'error',
          message: `Adres bilgisi eksik`,
          placeId: place.id,
          placeName: place.name,
        })
      }

      // 7. Score dağılımı - analyses tablosundan hesaplanacak

      // 8. Kategori dağılımı
      if (place.category) {
        stats.categoryDistribution[place.category] = (stats.categoryDistribution[place.category] || 0) + 1
      }
    }

    // 9. Yorum kontrolü
    const placeIds = allPlaces.map(p => p.id)
    if (placeIds.length > 0) {
      const allReviews = await db
        .select()
        .from(reviews)
        .where(sql`${reviews.placeId} IN (${sql.join(placeIds.map(id => sql`${id}`), sql`, `)})`)

      stats.totalReviews = allReviews.length
      
      const placesWithReviewsSet = new Set(allReviews.map(r => r.placeId))
      stats.placesWithReviews = placesWithReviewsSet.size
      stats.placesWithoutReviews = stats.totalPlaces - stats.placesWithReviews

      // Yorum kalitesi kontrolü
      for (const review of allReviews) {
        if (!review.text || review.text.trim().length === 0) {
          issues.push({
            type: 'warning',
            message: `Boş yorum metni`,
            details: { reviewId: review.id, placeId: review.placeId },
          })
        }

        if (review.rating && (review.rating < 1 || review.rating > 5)) {
          issues.push({
            type: 'error',
            message: `Geçersiz yorum rating değeri`,
            details: { reviewId: review.id, placeId: review.placeId, rating: review.rating },
          })
        }
      }
    }

    // 10. Analiz kontrolü
    if (placeIds.length > 0) {
      const allAnalyses = await db
        .select()
        .from(analyses)
        .where(sql`${analyses.placeId} IN (${sql.join(placeIds.map(id => sql`${id}`), sql`, `)})`)

      stats.totalAnalyses = allAnalyses.length
      
      const placesWithAnalysesSet = new Set(allAnalyses.map(a => a.placeId))
      stats.placesWithAnalyses = placesWithAnalysesSet.size
      stats.placesWithoutAnalyses = stats.totalPlaces - stats.placesWithAnalyses

      // Score dağılımı hesapla
      for (const analysis of allAnalyses) {
        if (analysis.score !== null && analysis.score !== undefined) {
          const range = analysis.score < 40 ? '0-39' : analysis.score < 60 ? '40-59' : analysis.score < 80 ? '60-79' : '80-100'
          stats.scoreDistribution[range] = (stats.scoreDistribution[range] || 0) + 1
        }
      }

      // Analiz kalitesi kontrolü
      for (const analysis of allAnalyses) {
        if (!analysis.why || analysis.why.trim().length === 0) {
          issues.push({
            type: 'error',
            message: `Analiz 'why' bilgisi eksik`,
            placeId: analysis.placeId,
          })
        }

        if (analysis.score === null || analysis.score === undefined) {
          issues.push({
            type: 'error',
            message: `Analiz score bilgisi eksik`,
            placeId: analysis.placeId,
          })
        } else if (analysis.score < 0 || analysis.score > 100) {
          issues.push({
            type: 'error',
            message: `Geçersiz analiz score değeri`,
            placeId: analysis.placeId,
            details: { score: analysis.score },
          })
        }
      }
    }

    // 11. Ortalama hesaplamaları - analyses tablosundan
    if (stats.totalAnalyses > 0) {
      const allAnalyses = await db
        .select({ score: analyses.score })
        .from(analyses)
        .where(sql`${analyses.placeId} IN (${sql.join(placeIds.map(id => sql`${id}`), sql`, `)})`)
      
      if (allAnalyses.length > 0) {
        stats.averageScore = allAnalyses.reduce((sum, a) => sum + (a.score || 0), 0) / allAnalyses.length
      }
    }

    const placesWithRating = allPlaces.filter(p => p.rating && p.rating > 0)
    if (placesWithRating.length > 0) {
      stats.averageRating = placesWithRating.reduce((sum, p) => sum + (p.rating || 0), 0) / placesWithRating.length
    }

    // 12. Raporlama
    console.log('\n' + '='.repeat(80))
    console.log('📊 ETİMESGUT VERİ İSTATİSTİKLERİ')
    console.log('='.repeat(80))
    console.log(`\n📍 Toplam Mekan: ${stats.totalPlaces}`)
    console.log(`   ✅ Koordinatlı: ${stats.placesWithCoordinates} (${((stats.placesWithCoordinates / stats.totalPlaces) * 100).toFixed(1)}%)`)
    console.log(`   ❌ Koordinatsız: ${stats.placesWithoutCoordinates}`)
    console.log(`\n⭐ Rating Bilgisi:`)
    console.log(`   ✅ Rating'li: ${stats.placesWithRating} (${((stats.placesWithRating / stats.totalPlaces) * 100).toFixed(1)}%)`)
    console.log(`   ❌ Rating'siz: ${stats.placesWithoutRating}`)
    console.log(`   📊 Ortalama Rating: ${stats.averageRating.toFixed(2)}`)
    console.log(`\n🎯 Score Bilgisi (Analyses tablosundan):`)
    console.log(`   ✅ Analizli Mekan: ${stats.placesWithAnalyses} (${((stats.placesWithAnalyses / stats.totalPlaces) * 100).toFixed(1)}%)`)
    console.log(`   ❌ Analizsiz Mekan: ${stats.placesWithoutAnalyses}`)
    console.log(`   📊 Ortalama Score: ${stats.averageScore.toFixed(2)}`)
    console.log(`\n📞 İletişim Bilgileri:`)
    console.log(`   📱 Telefon: ${stats.placesWithPhone} (${((stats.placesWithPhone / stats.totalPlaces) * 100).toFixed(1)}%)`)
    console.log(`   🌐 Website: ${stats.placesWithWebsite} (${((stats.placesWithWebsite / stats.totalPlaces) * 100).toFixed(1)}%)`)
    console.log(`   🕐 Çalışma Saatleri: ${stats.placesWithOpeningHours} (${((stats.placesWithOpeningHours / stats.totalPlaces) * 100).toFixed(1)}%)`)
    console.log(`   📸 Fotoğraflar: ${stats.placesWithPhotos} (${((stats.placesWithPhotos / stats.totalPlaces) * 100).toFixed(1)}%)`)
    console.log(`\n💬 Yorumlar:`)
    console.log(`   📝 Toplam Yorum: ${stats.totalReviews}`)
    console.log(`   ✅ Yorumlu Mekan: ${stats.placesWithReviews} (${((stats.placesWithReviews / stats.totalPlaces) * 100).toFixed(1)}%)`)
    console.log(`   ❌ Yorumsuz Mekan: ${stats.placesWithoutReviews}`)
    console.log(`\n🤖 Analizler:`)
    console.log(`   📊 Toplam Analiz: ${stats.totalAnalyses}`)
    console.log(`   ✅ Analizli Mekan: ${stats.placesWithAnalyses} (${((stats.placesWithAnalyses / stats.totalPlaces) * 100).toFixed(1)}%)`)
    console.log(`   ❌ Analizsiz Mekan: ${stats.placesWithoutAnalyses}`)

    if (Object.keys(stats.scoreDistribution).length > 0) {
      console.log(`\n📈 Score Dağılımı:`)
      Object.entries(stats.scoreDistribution)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([range, count]) => {
          console.log(`   ${range}: ${count} mekan`)
        })
    }

    if (Object.keys(stats.categoryDistribution).length > 0) {
      console.log(`\n🏷️  Kategori Dağılımı:`)
      Object.entries(stats.categoryDistribution)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
          console.log(`   ${category}: ${count} mekan`)
        })
    }

    // Sorunlar raporu
    console.log('\n' + '='.repeat(80))
    console.log('⚠️  TESPİT EDİLEN SORUNLAR')
    console.log('='.repeat(80))

    const errors = issues.filter(i => i.type === 'error')
    const warnings = issues.filter(i => i.type === 'warning')
    const infos = issues.filter(i => i.type === 'info')

    console.log(`\n❌ Kritik Hatalar: ${errors.length}`)
    if (errors.length > 0) {
      errors.slice(0, 20).forEach((issue, idx) => {
        console.log(`   ${idx + 1}. ${issue.message}`)
        if (issue.placeName) console.log(`      Mekan: ${issue.placeName}`)
        if (issue.placeId) console.log(`      ID: ${issue.placeId}`)
        if (issue.details) console.log(`      Detaylar: ${JSON.stringify(issue.details)}`)
      })
      if (errors.length > 20) {
        console.log(`   ... ve ${errors.length - 20} hata daha`)
      }
    }

    console.log(`\n⚠️  Uyarılar: ${warnings.length}`)
    if (warnings.length > 0) {
      warnings.slice(0, 10).forEach((issue, idx) => {
        console.log(`   ${idx + 1}. ${issue.message}`)
        if (issue.placeName) console.log(`      Mekan: ${issue.placeName}`)
        if (issue.placeId) console.log(`      ID: ${issue.placeId}`)
      })
      if (warnings.length > 10) {
        console.log(`   ... ve ${warnings.length - 10} uyarı daha`)
      }
    }

    if (infos.length > 0) {
      console.log(`\nℹ️  Bilgiler: ${infos.length}`)
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ KONTROL TAMAMLANDI')
    console.log('='.repeat(80) + '\n')

    // Özet
    if (errors.length === 0 && warnings.length === 0) {
      logger.info('✅ Tüm veriler temiz! Hiç sorun bulunamadı.')
    } else {
      logger.warn(`⚠️  ${errors.length} kritik hata ve ${warnings.length} uyarı tespit edildi.`)
    }

  } catch (error) {
    logger.error('Veri kontrolü sırasında hata oluştu', error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

// Script çalıştır
checkEtimesgutData()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Kontrol hatası:', error)
    process.exit(1)
  })

