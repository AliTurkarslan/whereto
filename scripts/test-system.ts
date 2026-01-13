/**
 * Sistem Test Scripti
 * 
 * WhereTo sisteminin doğru çalışıp çalışmadığını test eder
 * - Database bağlantısı
 * - Veri bütünlüğü
 * - API entegrasyonları
 * - Sync mekanizması
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db, schema } from '../lib/db'
import { getPlacesWithAnalyses } from '../lib/db'
import { eq, sql, count } from 'drizzle-orm'

interface TestResult {
  name: string
  passed: boolean
  message: string
  details?: any
}

const results: TestResult[] = []

function addResult(name: string, passed: boolean, message: string, details?: any) {
  results.push({ name, passed, message, details })
  console.log(`${passed ? '✅' : '❌'} ${name}: ${message}`)
  if (details) {
    console.log(`   Detaylar:`, details)
  }
}

async function testDatabaseConnection() {
  try {
    const result = await db.select({ test: sql<number>`1` }).from(schema.places).limit(1)
    addResult('Database Bağlantısı', true, 'Database bağlantısı başarılı', { connected: true })
    return true
  } catch (error) {
    addResult('Database Bağlantısı', false, 'Database bağlantısı başarısız', error)
    return false
  }
}

async function testDatabaseSchema() {
  try {
    // Places tablosu kontrolü
    const placesCount = await db.select({ count: count() }).from(schema.places)
    const reviewsCount = await db.select({ count: count() }).from(schema.reviews)
    const analysesCount = await db.select({ count: count() }).from(schema.analyses)

    addResult('Database Şeması', true, 'Tüm tablolar mevcut', {
      places: placesCount[0].count,
      reviews: reviewsCount[0].count,
      analyses: analysesCount[0].count,
    })

    return true
  } catch (error) {
    addResult('Database Şeması', false, 'Şema kontrolü başarısız', error)
    return false
  }
}

async function testDataIntegrity() {
  try {
    // Place ID'lerin benzersizliği - Drizzle ORM ile
    const allPlaces = await db.select({ googleMapsId: schema.places.googleMapsId }).from(schema.places)
    const googleMapsIds = allPlaces.filter(p => p.googleMapsId).map(p => p.googleMapsId)
    const duplicates = googleMapsIds.filter((id, index) => googleMapsIds.indexOf(id) !== index)

    if (duplicates.length > 0) {
      addResult('Veri Bütünlüğü', false, 'Duplicate place ID\'ler bulundu', { duplicates: duplicates.length })
      return false
    }

    // Review'ların place'lere bağlı olması - Drizzle ORM ile
    const allReviews = await db.select({ placeId: schema.reviews.placeId }).from(schema.reviews)
    const allPlaceIds = new Set((await db.select({ id: schema.places.id }).from(schema.places)).map(p => p.id))
    const orphanReviews = allReviews.filter(r => !allPlaceIds.has(r.placeId))

    if (orphanReviews.length > 0) {
      addResult('Veri Bütünlüğü', false, 'Orphan review\'lar bulundu', { count: orphanReviews.length })
      return false
    }

    // Analysis'lerin place'lere bağlı olması - Drizzle ORM ile
    const allAnalyses = await db.select({ placeId: schema.analyses.placeId }).from(schema.analyses)
    const orphanAnalyses = allAnalyses.filter(a => !allPlaceIds.has(a.placeId))

    if (orphanAnalyses.length > 0) {
      addResult('Veri Bütünlüğü', false, 'Orphan analysis\'ler bulundu', { count: orphanAnalyses.length })
      return false
    }

    addResult('Veri Bütünlüğü', true, 'Tüm veriler tutarlı')
    return true
  } catch (error) {
    addResult('Veri Bütünlüğü', false, 'Veri bütünlüğü kontrolü başarısız', error)
    return false
  }
}

async function testPlaceData() {
  try {
    // Örnek bir mekan al
    const samplePlace = await db
      .select()
      .from(schema.places)
      .limit(1)

    if (samplePlace.length === 0) {
      addResult('Place Verileri', false, 'Database\'de mekan yok')
      return false
    }

    const place = samplePlace[0]

    // Gerekli alanların dolu olması
    const requiredFields = ['name', 'address', 'lat', 'lng']
    const missingFields = requiredFields.filter(field => !place[field as keyof typeof place])

    if (missingFields.length > 0) {
      addResult('Place Verileri', false, 'Eksik alanlar var', { missingFields, place })
      return false
    }

    // Koordinat validasyonu
    if (place.lat < -90 || place.lat > 90 || place.lng < -180 || place.lng > 180) {
      addResult('Place Verileri', false, 'Geçersiz koordinatlar', place)
      return false
    }

    addResult('Place Verileri', true, 'Place verileri geçerli', {
      name: place.name,
      hasGoogleMapsId: !!place.googleMapsId,
      hasRating: !!place.rating,
      hasReviewCount: !!place.reviewCount,
    })

    return true
  } catch (error) {
    addResult('Place Verileri', false, 'Place verileri kontrolü başarısız', error)
    return false
  }
}

async function testReviewData() {
  try {
    // Review'ları kontrol et
    const reviews = await db
      .select()
      .from(schema.reviews)
      .limit(10)

    if (reviews.length === 0) {
      addResult('Review Verileri', false, 'Database\'de yorum yok')
      return false
    }

    // Review'ların text alanının dolu olması
    const emptyReviews = reviews.filter(r => !r.text || r.text.trim() === '')

    if (emptyReviews.length > 0) {
      addResult('Review Verileri', false, 'Boş yorumlar var', emptyReviews)
      return false
    }

    addResult('Review Verileri', true, 'Review verileri geçerli', {
      sampleCount: reviews.length,
      averageLength: Math.round(reviews.reduce((sum, r) => sum + r.text.length, 0) / reviews.length),
    })

    return true
  } catch (error) {
    addResult('Review Verileri', false, 'Review verileri kontrolü başarısız', error)
    return false
  }
}

async function testAnalysisData() {
  try {
    // Analysis'leri kontrol et
    const analyses = await db
      .select()
      .from(schema.analyses)
      .limit(10)

    if (analyses.length === 0) {
      addResult('Analysis Verileri', false, 'Database\'de analiz yok')
      return false
    }

    // Analysis'lerin gerekli alanlarının dolu olması
    const invalidAnalyses = analyses.filter(a => 
      !a.score || 
      a.score < 0 || 
      a.score > 100 || 
      !a.why || 
      !a.category || 
      !a.companion
    )

    if (invalidAnalyses.length > 0) {
      addResult('Analysis Verileri', false, 'Geçersiz analizler var', invalidAnalyses)
      return false
    }

    addResult('Analysis Verileri', true, 'Analysis verileri geçerli', {
      sampleCount: analyses.length,
      scoreRange: {
        min: Math.min(...analyses.map(a => a.score)),
        max: Math.max(...analyses.map(a => a.score)),
        avg: Math.round(analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length),
      },
    })

    return true
  } catch (error) {
    addResult('Analysis Verileri', false, 'Analysis verileri kontrolü başarısız', error)
    return false
  }
}

async function testGetPlacesWithAnalyses() {
  try {
    // Kadıköy koordinatları
    const kadikoy = { lat: 40.9900, lng: 29.0244 }
    
    // Test için bir kategori ve companion seç
    const testCategory = 'food'
    const testCompanion = 'alone'

    const places = await getPlacesWithAnalyses(
      kadikoy.lat,
      kadikoy.lng,
      testCategory,
      testCompanion,
      5
    )

    if (places.length === 0) {
      addResult('getPlacesWithAnalyses', false, 'Mekan bulunamadı')
      return false
    }

    // Her mekanın gerekli alanlarının dolu olması
    const invalidPlaces = places.filter(p => 
      !p.name || 
      !p.address || 
      !p.score || 
      p.score < 0 || 
      p.score > 100 ||
      !p.why
    )

    if (invalidPlaces.length > 0) {
      addResult('getPlacesWithAnalyses', false, 'Geçersiz mekanlar var', invalidPlaces)
      return false
    }

    addResult('getPlacesWithAnalyses', true, 'Mekanlar başarıyla getirildi', {
      count: places.length,
      averageScore: Math.round(places.reduce((sum, p) => sum + p.score, 0) / places.length),
      hasGoogleMapsId: places.filter(p => p.googleMapsId).length,
    })

    return true
  } catch (error) {
    addResult('getPlacesWithAnalyses', false, 'Mekan getirme başarısız', error)
    return false
  }
}

async function testEnvironmentVariables() {
  // GOOGLE_AI_API_KEY opsiyonel (fallback var)
  const requiredVars = [
    'GOOGLE_PLACES_API_KEY',
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  ]

  const optionalVars = [
    'GOOGLE_AI_API_KEY',
  ]

  const missingVars: string[] = []
  const presentVars: string[] = []
  const optionalPresent: string[] = []

  requiredVars.forEach(varName => {
    const value = process.env[varName]
    if (!value || value.trim() === '') {
      missingVars.push(varName)
    } else {
      presentVars.push(varName)
    }
  })

  optionalVars.forEach(varName => {
    const value = process.env[varName]
    if (value && value.trim() !== '') {
      optionalPresent.push(varName)
    }
  })

  if (missingVars.length > 0) {
    addResult('Environment Variables', false, 'Eksik environment variable\'lar', { missingVars, presentVars, optionalPresent })
    return false
  }

  addResult('Environment Variables', true, 'Tüm gerekli environment variable\'lar mevcut', { 
    presentVars, 
    optionalPresent,
    note: optionalPresent.length === 0 ? 'GOOGLE_AI_API_KEY yok, basit skorlama kullanılacak' : undefined
  })
  return true
}

async function testCategoryDistribution() {
  try {
    const allPlaces = await db.select({ category: schema.places.category }).from(schema.places)
    const categoryCounts: Record<string, number> = {}
    
    allPlaces.forEach(place => {
      if (place.category) {
        categoryCounts[place.category] = (categoryCounts[place.category] || 0) + 1
      }
    })

    const categories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)

    addResult('Kategori Dağılımı', true, 'Kategoriler analiz edildi', categories)

    return true
  } catch (error) {
    addResult('Kategori Dağılımı', false, 'Kategori analizi başarısız', error)
    return false
  }
}

async function testLocationCoverage() {
  try {
    // Türkiye sınırları içinde mekanlar
    const turkeyBounds = {
      minLat: 35.8,
      maxLat: 42.1,
      minLng: 25.7,
      maxLng: 44.8,
    }

    const allPlaces = await db.select({ lat: schema.places.lat, lng: schema.places.lng }).from(schema.places)
    const placesInTurkey = allPlaces.filter(p => 
      p.lat >= turkeyBounds.minLat && 
      p.lat <= turkeyBounds.maxLat &&
      p.lng >= turkeyBounds.minLng && 
      p.lng <= turkeyBounds.maxLng
    )

    const totalPlaces = allPlaces.length
    const coverage = totalPlaces > 0
      ? (placesInTurkey.length / totalPlaces) * 100
      : 0

    addResult('Lokasyon Kapsamı', true, 'Türkiye sınırları içinde mekanlar', {
      totalPlaces,
      placesInTurkey: placesInTurkey.length,
      coverage: `${coverage.toFixed(1)}%`,
    })

    return true
  } catch (error) {
    addResult('Lokasyon Kapsamı', false, 'Lokasyon analizi başarısız', error)
    return false
  }
}

async function runAllTests() {
  console.log('🧪 WhereTo Sistem Testi Başlatılıyor...\n')

  await testDatabaseConnection()
  await testDatabaseSchema()
  await testDataIntegrity()
  await testPlaceData()
  await testReviewData()
  await testAnalysisData()
  await testGetPlacesWithAnalyses()
  await testEnvironmentVariables()
  await testCategoryDistribution()
  await testLocationCoverage()

  console.log('\n📊 Test Sonuçları:')
  console.log('='.repeat(50))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length

  console.log(`\n✅ Başarılı: ${passed}/${total}`)
  console.log(`❌ Başarısız: ${failed}/${total}`)
  console.log(`📈 Başarı Oranı: ${((passed / total) * 100).toFixed(1)}%`)

  if (failed > 0) {
    console.log('\n⚠️  Başarısız Testler:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`)
    })
  }

  console.log('\n' + '='.repeat(50))

  if (failed === 0) {
    console.log('\n🎉 Tüm testler başarılı! Sistem hazır.')
    process.exit(0)
  } else {
    console.log('\n⚠️  Bazı testler başarısız. Lütfen sorunları düzeltin.')
    process.exit(1)
  }
}

runAllTests().catch(console.error)

