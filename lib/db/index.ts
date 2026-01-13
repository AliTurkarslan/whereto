import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { sql, and, eq, like, inArray, or, isNull } from 'drizzle-orm'
import * as schema from './schema'
import { logger } from '../logging/logger'
import { getPlaceTypesForCategoryGroup, getCategoryGroupForPlaceType, GOOGLE_MAPS_CATEGORY_GROUPS } from '@/lib/config/google-maps-category-groups'
import { USER_NEED_CATEGORIES, getGoogleMapsTypesForUserNeed } from '@/lib/config/user-needs-categories'
import { adjustScoreByReviewCount, calculateSortingScore } from '@/lib/utils/score-adjustment'

// PostgreSQL connection - Lazy initialization
let dbInstance: ReturnType<typeof drizzle> | null = null
let clientInstance: ReturnType<typeof postgres> | null = null

function getDatabaseConnection() {
  if (dbInstance) {
    return dbInstance
  }

  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    logger.error('DATABASE_URL environment variable is required', new Error('DATABASE_URL not set'), {})
    throw new Error('DATABASE_URL environment variable is required. Make sure .env.local is loaded before importing lib/db')
  }

  // Connection pooling için postgres client
  clientInstance = postgres(connectionString, {
    max: 10, // Connection pool size
    idle_timeout: 20,
    connect_timeout: 10,
  })

  dbInstance = drizzle(clientInstance, { schema })
  return dbInstance
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const instance = getDatabaseConnection()
    return (instance as any)[prop]
  }
})
export { schema }

// Helper functions
// Google Maps API kategorilerini direkt kullan (artık sadece Google Maps kategorileri)
/**
 * Ana kategori grubuna göre place type'ları döndür
 * Örneğin "restaurants" → ["restaurant", "cafe", "bar", "bakery", ...]
 */
function getCategoryMapping(categoryGroupId: string): string[] {
  // Ana kategori grubu ID'si (restaurants, hotels, things_to_do, vb.)
  const placeTypes = getPlaceTypesForCategoryGroup(categoryGroupId)
  
  // Eğer place type'lar bulunamazsa, kategori grubunu direkt kullan (fallback)
  return placeTypes.length > 0 ? placeTypes : [categoryGroupId.toLowerCase().trim()]
}

export async function getPlacesByLocation(
  lat: number,
  lng: number,
  radius: number = 10, // km - Kadıköy için daha geniş
  category?: string,
  placeTypes?: string[] // Opsiyonel: Direkt place type array (kullanıcı ihtiyaç kategorisi için)
) {
  // PostgreSQL için mesafe hesaplama - Haversine formülü kullan
  // Haversine: d = 2 * R * arcsin(sqrt(sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlng/2)))
  // Basitleştirilmiş versiyon: yaklaşık mesafe hesaplama (daha hızlı)
  // Doğru mesafe calculateDistance fonksiyonunda hesaplanıyor
  const conditions = [
    // Yaklaşık mesafe: 1 derece lat ≈ 111 km, 1 derece lng ≈ 111 * cos(lat) km
    // Daha doğru: Haversine formülü kullan (PostGIS yoksa)
    sql`(
      6371 * acos(
        cos(radians(${lat})) * 
        cos(radians(lat)) * 
        cos(radians(lng) - radians(${lng})) + 
        sin(radians(${lat})) * 
        sin(radians(lat))
      )
    ) <= ${radius}`,
  ]
  
  // Kategori filtreleme mantığı:
  // 1. Eğer placeTypes verilmişse (kullanıcı ihtiyaç kategorisi için), sadece placeTypes ile filtrele
  // 2. Eğer placeTypes yoksa ama category varsa, category'yi Google Maps kategori grubu veya place type olarak kullan
  if (placeTypes && placeTypes.length > 0) {
    // Kullanıcı ihtiyaç kategorisi için: Sadece placeTypes ile filtrele
    // category parametresini görmezden gel (çünkü "yemek" gibi bir kategori Google Maps kategorisi değil)
    // Place type'lara göre filtrele (inArray kullan - daha basit ve hızlı)
    conditions.push(inArray(schema.places.category, placeTypes))
    
    // Not: categoryGroup NULL olan kayıtlar için ek kontrol gerekmez
    // Çünkü yukarıdaki OR koşulu zaten category değerini kontrol ediyor
    // categoryGroup NULL olsa bile, category değeri placeTypes'tan biri ise zaten eşleşecek
  } else if (category) {
    // Eski sistem: category Google Maps kategori grubu veya place type
    const isCategoryGroup = GOOGLE_MAPS_CATEGORY_GROUPS[category] !== undefined
    
    if (isCategoryGroup) {
      // Ana kategori grubuna göre place type'ları al
      const finalPlaceTypes = getCategoryMapping(category)
      
      // Place type'lara göre filtrele (inArray kullan)
      if (finalPlaceTypes.length > 0) {
        conditions.push(inArray(schema.places.category, finalPlaceTypes))
      }
      
      // Ayrıca categoryGroup ile de filtrele (daha hızlı ve doğru)
      const categoryGroupFilter = category.toLowerCase().trim()
      const categoryGroupMatch = eq(schema.places.categoryGroup, categoryGroupFilter)
      
      // categoryGroup NULL ama category placeTypes'tan biri olan kayıtlar (eski kayıtlar)
      const nullCategoryGroupButValidCategory = sql`(${schema.places.categoryGroup} IS NULL AND ${schema.places.category} = ANY(${finalPlaceTypes}))`
      
      // or() fonksiyonunu kullan (her iki condition da SQL condition döndürüyor)
      const orCondition = or(
        categoryGroupMatch,
        nullCategoryGroupButValidCategory
      )
      if (orCondition) {
        conditions.push(orCondition)
      }
    } else {
      // Spesifik place type - direkt filtrele
      conditions.push(eq(schema.places.category, category.toLowerCase().trim()))
      
      // CategoryGroup'u da bul ve filtrele (eğer varsa)
      const categoryGroup = getCategoryGroupForPlaceType(category)
      if (categoryGroup) {
        conditions.push(eq(schema.places.categoryGroup, categoryGroup))
      }
    }
  }
  
  const results = await db
    .select()
    .from(schema.places)
    .where(and(...conditions))
    .limit(200) // Daha fazla mekan (200'e çıkarıldı)
  
  return results
}

/**
 * Database'den mekanları ve yorumlarını çek
 */
export async function getPlacesWithReviews(placeIds: number[]): Promise<Map<number, Array<{ text: string; rating?: number | null }>>> {
  if (placeIds.length === 0) return new Map()

  // inArray zaten dosyanın başında import edilmiş
  const allReviews = await db
    .select({
      placeId: schema.reviews.placeId,
      text: schema.reviews.text,
      rating: schema.reviews.rating,
    })
    .from(schema.reviews)
    .where(inArray(schema.reviews.placeId, placeIds))

  // Place ID'ye göre grupla
  const reviewsByPlace = new Map<number, Array<{ text: string; rating?: number | null }>>()
  allReviews.forEach(review => {
    if (!reviewsByPlace.has(review.placeId)) {
      reviewsByPlace.set(review.placeId, [])
    }
    reviewsByPlace.get(review.placeId)!.push({
      text: review.text,
      rating: review.rating || undefined,
    })
  })

  return reviewsByPlace
}

export async function getPlacesWithAnalyses(
  lat: number,
  lng: number,
  categoryOrGroupId: string, // Artık kullanıcı ihtiyaç kategorisi (yemek, kahve), kategori grubu (restaurants) veya spesifik place type (restaurant) olabilir
  companion: string,
  limit: number = 10,
  googleMapsTypes?: string[] // Opsiyonel: Direkt Google Maps kategorileri (kullanıcı ihtiyaç kategorisi için)
) {
  // Kullanıcı ihtiyaç kategorisi mi kontrol et (user_need: prefix ile)
  let placeTypes: string[] = []
  let isUserNeedCategory = false
  
  if (categoryOrGroupId.startsWith('user_need:')) {
    // Kullanıcı ihtiyaç kategorisi
    const userNeedId = categoryOrGroupId.replace('user_need:', '')
    if (googleMapsTypes && googleMapsTypes.length > 0) {
      placeTypes = googleMapsTypes
    } else if (USER_NEED_CATEGORIES[userNeedId]) {
      placeTypes = getGoogleMapsTypesForUserNeed(userNeedId)
    }
    isUserNeedCategory = true
  } else if (GOOGLE_MAPS_CATEGORY_GROUPS[categoryOrGroupId]) {
    // Google Maps kategori grubu
    placeTypes = getPlaceTypesForCategoryGroup(categoryOrGroupId)
  } else {
    // Spesifik place type
    placeTypes = [categoryOrGroupId]
  }
  
  // 1. Önce kategori/grubu ile yakın mekanları bul
  // getPlacesByLocation artık placeTypes array'ini kabul edebilmeli veya categoryOrGroupId ile çalışmalı
  let nearbyPlaces = await getPlacesByLocation(lat, lng, 10, categoryOrGroupId, placeTypes)
  
  // 2. Eğer category ile sonuç yoksa, category filtresiz dene (fallback)
  if (nearbyPlaces.length === 0) {
    logger.warn(`⚠️  No places found with category ${categoryOrGroupId}, trying without category filter...`, { categoryOrGroupId, lat, lng })
    nearbyPlaces = await getPlacesByLocation(lat, lng, 10, undefined, placeTypes)
    logger.info(`✅ Found ${nearbyPlaces.length} places without category filter`, { count: nearbyPlaces.length })
  }
  
  // 3. Eğer hala sonuç yoksa, radius'u genişlet
  if (nearbyPlaces.length === 0) {
    logger.warn(`⚠️  No places found in 10km radius, expanding to 20km...`, { lat, lng, categoryOrGroupId })
    nearbyPlaces = await getPlacesByLocation(lat, lng, 20, categoryOrGroupId, placeTypes)
    if (nearbyPlaces.length === 0) {
      nearbyPlaces = await getPlacesByLocation(lat, lng, 20, undefined, placeTypes)
    }
    logger.info(`✅ Found ${nearbyPlaces.length} places in expanded radius`, { count: nearbyPlaces.length, radius: 20 })
  }
  
  // 4. Yorumları çek
  const placeIds = nearbyPlaces.map(p => p.id)
  const reviewsByPlace = await getPlacesWithReviews(placeIds)

  // 5. Tüm analizleri tek seferde çek (N+1 Query Problem çözümü)
  // placeTypes zaten yukarıda belirlendi (kullanıcı ihtiyaç kategorisi, kategori grubu veya spesifik place type)
  
  // Önce tam eşleşme (place type + companion) için tüm analizleri çek
  const exactAnalyses = placeIds.length > 0 && placeTypes.length > 0 ? await db
    .select()
    .from(schema.analyses)
    .where(
      and(
        inArray(schema.analyses.placeId, placeIds),
        inArray(schema.analyses.category, placeTypes), // Place type'larından biri
        eq(schema.analyses.companion, companion)
      )
    ) : []
  
  // Place type-only analizleri çek (companion farklı olabilir)
  const categoryAnalyses = placeIds.length > 0 && placeTypes.length > 0 ? await db
    .select()
    .from(schema.analyses)
    .where(
      and(
        inArray(schema.analyses.placeId, placeIds),
        inArray(schema.analyses.category, placeTypes) // Place type'larından biri
      )
    ) : []
  
  // Analizleri Map'e çevir (placeId -> analysis)
  const exactAnalysesMap = new Map<number, typeof schema.analyses.$inferSelect>()
  const categoryAnalysesMap = new Map<number, typeof schema.analyses.$inferSelect>()
  
  exactAnalyses.forEach(analysis => {
    exactAnalysesMap.set(analysis.placeId, analysis)
  })
  
  categoryAnalyses.forEach(analysis => {
    if (!exactAnalysesMap.has(analysis.placeId)) {
      categoryAnalysesMap.set(analysis.placeId, analysis)
    }
  })

  // 6. Her mekan için analiz sonuçlarını getir
  // Error handling ile: Bir mekan hata verirse diğerlerini etkilemesin
  const placesWithAnalysesResults = await Promise.allSettled(
    nearbyPlaces.map(async (place) => {
      // Yorumları ekle
      const placeReviews = reviewsByPlace.get(place.id) || []
      
      // Analizi Map'ten al (önce tam eşleşme, sonra category-only)
      const originalAnalysis = exactAnalysesMap.get(place.id) || categoryAnalysesMap.get(place.id)

      // Mesafe hesapla
      const distance = calculateDistance(lat, lng, place.lat, place.lng)
      
      // Yorum sayısına göre skoru ayarla (Bayesian Average)
      // Bu skor hem analiz varsa hem de yoksa kullanılacak
      const reviewCount = place.reviewCount || placeReviews.length
      let adjustedScore: number
      
      if (originalAnalysis) {
        // Analiz varsa, analiz skorunu yorum sayısına göre ayarla
        // priorMean sabit 50 olmalı (rating'e göre değil), böylece az yorumlu yerlerin skorları düşer
        adjustedScore = adjustScoreByReviewCount(
          originalAnalysis.score,
          reviewCount,
          {
            method: 'bayesian',
            priorMean: 50, // Sabit prior mean - rating'e göre değil!
            confidenceConstant: 10,
          }
        )
      } else {
        // Analiz yoksa, rating'e göre skor hesapla ve yorum sayısına göre ayarla
        const baseScore = place.rating ? Math.round(place.rating * 20) : 50
        adjustedScore = adjustScoreByReviewCount(
          baseScore,
          reviewCount,
          {
            method: 'bayesian',
            priorMean: 50, // Sabit prior mean - rating'e göre değil!
            confidenceConstant: 10,
          }
        )
      }

      // Eğer analiz yoksa ama yorumlar varsa, basit skorlama yap
      if (!originalAnalysis && placeReviews.length > 0) {
        const { analyzeReviewsSimple } = await import('@/lib/analysis/simple-scoring')
        const { sampleReviews } = await import('@/lib/utils/review-sampling')
        
        // Yorumları örnekle (eğer çok fazla varsa)
        const reviewSamples = placeReviews.map(r => ({
          text: r.text,
          rating: r.rating ?? undefined,
          date: undefined,
        }))
        
        // Dinamik örnekleme: Yorum sayısına göre optimal örnekleme
        const sampledReviews = sampleReviews(reviewSamples, {
          useDynamicSampling: true, // Otomatik optimal sayı hesapla
          minCount: 50,
          maxCount: 200,
        })
        
        // Ana kategori grubunun ilk place type'ını kullan (fallback için)
        const primaryPlaceType = placeTypes.length > 0 ? placeTypes[0] : categoryOrGroupId
        
        const simpleAnalysis = analyzeReviewsSimple(
          sampledReviews.map(r => ({ text: r.text, rating: r.rating ?? undefined })),
          primaryPlaceType,
          companion
        )

        // Yorum sayısına göre skoru ayarla (Bayesian Average)
        const reviewCount = place.reviewCount || placeReviews.length
        const adjustedScore = adjustScoreByReviewCount(
          simpleAnalysis.score,
          reviewCount,
          {
            method: 'bayesian',
            priorMean: 50, // Sabit prior mean - rating'e göre değil!
            confidenceConstant: 10, // Minimum 10 yorum güvenilir kabul edilir
          }
        )

        return {
          ...place,
          score: adjustedScore,
          why: simpleAnalysis.why,
          risks: simpleAnalysis.risks || undefined,
          distance,
          reviewCategories: simpleAnalysis.reviewCategories,
          analyzedReviewCount: placeReviews.length,
          totalReviewCount: reviewCount,
        }
      }

      // Default değerler - analiz yoksa bile mekanı göster
      // adjustedScore zaten yukarıda hesaplandı
      const defaultWhy = place.rating 
        ? `Bu mekan ${place.rating.toFixed(1)} yıldız puanına sahip ve ${distance.toFixed(1)} km uzaklıkta.`
        : `Bu mekan ${distance.toFixed(1)} km uzaklıkta.`
      
      const defaultRisks = reviewCount < 10 
        ? 'Yorum sayısı az olduğu için değerlendirme sınırlı. Daha fazla bilgi için yorumları kontrol etmenizi öneririz.'
        : 'Detaylı analiz henüz yapılmadı. Yorumları kontrol etmenizi öneririz.'

      // Yeni alanları parse et (güvenli parse)
      type OpeningHours = {
        weekdayDescriptions?: string[]
        openNow?: boolean
      } | string[]
      
      let openingHours: OpeningHours | undefined = undefined
      if (place.openingHours) {
        try {
          openingHours = typeof place.openingHours === 'string' 
            ? JSON.parse(place.openingHours) as OpeningHours
            : place.openingHours as OpeningHours
        } catch (e) {
          logger.warn(`Failed to parse openingHours for place ${place.id}`, { placeId: place.id, error: e instanceof Error ? e.message : String(e) })
          openingHours = undefined
        }
      }
      
      type Photo = {
        name: string
        widthPx?: number
        heightPx?: number
      }
      
      let photos: Photo[] | undefined = undefined
      if (place.photos) {
        try {
          photos = typeof place.photos === 'string' 
            ? JSON.parse(place.photos) as Photo[]
            : place.photos as Photo[]
        } catch (e) {
          logger.warn(`Failed to parse photos for place ${place.id}`, { placeId: place.id, error: e instanceof Error ? e.message : String(e) })
          photos = undefined
        }
      }

      // Final skor: adjustedScore zaten yukarıda hesaplandı (yorum sayısına göre)
      return {
        ...place,
        distance,
        score: adjustedScore, // Zaten yorum sayısına göre ayarlanmış skor
        why: originalAnalysis?.why || defaultWhy,
        risks: originalAnalysis?.risks || (originalAnalysis ? undefined : defaultRisks),
        reviewCategories: originalAnalysis?.reviewCategories
          ? JSON.parse(originalAnalysis.reviewCategories)
          : undefined,
        analyzedReviewCount: placeReviews.length, // Analiz edilen yorum sayısı
        totalReviewCount: place.reviewCount || placeReviews.length, // Toplam yorum sayısı
        googleMapsId: place.googleMapsId || undefined, // Google Maps Place ID
        // Temel iletişim bilgileri
        phone: place.phone || undefined,
        website: place.website || undefined,
        openingHours: openingHours,
        photos: photos,
        // Özellikler (database'den)
        atmosphere: place.atmosphere || undefined,
        petFriendly: place.petFriendly ?? undefined,
        wifi: place.wifi ?? undefined,
        vegan: place.vegan ?? undefined,
        editorialSummary: place.editorialSummary || undefined,
        businessStatus: place.businessStatus || undefined,
        plusCode: place.plusCode || undefined,
        priceLevel: place.priceLevel || undefined,
        // Kapsamlı alanlar - JSON parse
        shortFormattedAddress: place.shortFormattedAddress || undefined,
        addressComponents: place.addressComponents 
          ? (typeof place.addressComponents === 'string' ? JSON.parse(place.addressComponents) : place.addressComponents)
          : undefined,
        viewport: place.viewport 
          ? (typeof place.viewport === 'string' ? JSON.parse(place.viewport) : place.viewport)
          : undefined,
        primaryType: place.primaryType || undefined,
        primaryTypeDisplayName: place.primaryTypeDisplayName || undefined,
        // Accessibility ve özellikler
        accessibilityOptions: place.accessibilityOptions 
          ? (typeof place.accessibilityOptions === 'string' ? JSON.parse(place.accessibilityOptions) : place.accessibilityOptions)
          : undefined,
        // ❌ evChargingOptions, fuelOptions, indoorOptions kaldırıldı - API'den çekilmiyor ve database'de yok
        goodForChildren: place.goodForChildren ?? undefined,
        goodForGroups: place.goodForGroups ?? undefined,
        goodForWatchingSports: place.goodForWatchingSports ?? undefined,
        liveMusic: place.liveMusic ?? undefined,
        menuForChildren: place.menuForChildren ?? undefined,
        outdoorSeating: place.outdoorSeating ?? undefined,
        parkingOptions: place.parkingOptions 
          ? (typeof place.parkingOptions === 'string' ? JSON.parse(place.parkingOptions) : place.parkingOptions)
          : undefined,
        paymentOptions: place.paymentOptions 
          ? (typeof place.paymentOptions === 'string' ? JSON.parse(place.paymentOptions) : place.paymentOptions)
          : undefined,
        reservable: place.reservable ?? undefined,
        restroom: place.restroom ?? undefined,
        // Yemek ve içecek seçenekleri
        servesBreakfast: place.servesBreakfast ?? undefined,
        servesBrunch: place.servesBrunch ?? undefined,
        servesDinner: place.servesDinner ?? undefined,
        servesLunch: place.servesLunch ?? undefined,
        servesBeer: place.servesBeer ?? undefined,
        servesWine: place.servesWine ?? undefined,
        servesCocktails: place.servesCocktails ?? undefined,
        servesVegetarianFood: place.servesVegetarianFood ?? undefined,
        // Hizmet seçenekleri
        takeout: place.takeout ?? undefined,
        delivery: place.delivery ?? undefined,
        dineIn: place.dineIn ?? undefined,
        subDestinations: place.subDestinations 
          ? (typeof place.subDestinations === 'string' ? JSON.parse(place.subDestinations) : place.subDestinations)
          : undefined,
        currentSecondaryOpeningHours: place.currentSecondaryOpeningHours 
          ? (typeof place.currentSecondaryOpeningHours === 'string' ? JSON.parse(place.currentSecondaryOpeningHours) : place.currentSecondaryOpeningHours)
          : undefined,
      }
    })
  )

  // Promise.allSettled sonuçlarını işle - başarılı olanları al, hatalı olanları logla
  const placesWithAnalyses = placesWithAnalysesResults
    .map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        // Hata durumunda logla ama devam et
        const place = nearbyPlaces[index]
        logger.warn(
          `Failed to process place: ${place?.name || 'unknown'}`,
          {
            placeId: place?.id,
            placeName: place?.name,
            error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          }
        )
        return null
      }
    })
    .filter((place): place is NonNullable<typeof place> => place !== null)

  // Skora göre sırala (yorum sayısı dahil, sonra rating, sonra mesafe)
  const sorted = placesWithAnalyses.sort((a, b) => {
    // Önce yorum sayısı dahil sıralama skoruna göre
    const aSortingScore = calculateSortingScore(
      a.score,
      a.totalReviewCount || a.analyzedReviewCount || 0,
      a.rating ?? undefined
    )
    const bSortingScore = calculateSortingScore(
      b.score,
      b.totalReviewCount || b.analyzedReviewCount || 0,
      b.rating ?? undefined
    )
    
    if (aSortingScore !== bSortingScore) return bSortingScore - aSortingScore
    
    // Sonra yorum sayısına göre (daha çok yorumlu olan önce)
    const aReviewCount = a.totalReviewCount || a.analyzedReviewCount || 0
    const bReviewCount = b.totalReviewCount || b.analyzedReviewCount || 0
    if (aReviewCount !== bReviewCount) return bReviewCount - aReviewCount
    
    // Sonra rating'e göre
    if (a.rating && b.rating && a.rating !== b.rating) return b.rating - a.rating
    
    // Son olarak mesafeye göre
    if (a.distance && b.distance) return a.distance - b.distance
    return 0
  })

  return sorted.slice(0, limit)
}

// Mesafe hesaplama helper
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Dünya yarıçapı (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

