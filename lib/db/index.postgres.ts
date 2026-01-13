import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { sql, and, eq, like, inArray, or } from 'drizzle-orm'
import * as schema from './schema'
import { logger } from '../logging/logger'

// PostgreSQL connection
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  logger.error('DATABASE_URL environment variable is required', new Error('DATABASE_URL not set'), {})
  throw new Error('DATABASE_URL environment variable is required')
}

// Connection pooling için postgres client
const client = postgres(connectionString, {
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
})

export const db = drizzle(client, { schema })
export { schema }

// Helper functions
// Google Maps API kategorilerini direkt kullan (artık sadece Google Maps kategorileri)
/**
 * Ana kategori grubuna göre place type'ları döndür
 * Örneğin "restaurants" → ["restaurant", "cafe", "bar", "bakery", ...]
 */
function getCategoryMapping(categoryGroupId: string): string[] {
  // Ana kategori grubu ID'si (restaurants, hotels, things_to_do, vb.)
  const { getPlaceTypesForCategoryGroup } = require('@/lib/config/google-maps-category-groups')
  const placeTypes = getPlaceTypesForCategoryGroup(categoryGroupId)
  
  // Eğer place type'lar bulunamazsa, kategori grubunu direkt kullan (fallback)
  return placeTypes.length > 0 ? placeTypes : [categoryGroupId.toLowerCase().trim()]
}

export async function getPlacesByLocation(
  lat: number,
  lng: number,
  radius: number = 10, // km
  category?: string
) {
  // PostgreSQL için mesafe hesaplama (PostGIS kullanılabilir, ama basit versiyon)
  const conditions = [
    sql`(ABS(${lat} - lat) + ABS(${lng} - lng)) * 111 <= ${radius}`,
  ]
  
  if (category) {
    // Ana kategori grubuna göre place type'ları al
    const placeTypes = getCategoryMapping(category)
    
    // Place type'lara göre filtrele (inArray kullan - daha basit ve hızlı)
    if (placeTypes.length > 0) {
      conditions.push(inArray(schema.places.category, placeTypes))
    }
    
    // Ayrıca categoryGroup ile de filtrele (daha hızlı)
    conditions.push(eq(schema.places.categoryGroup, category.toLowerCase().trim()))
  }
  
  const results = await db
    .select()
    .from(schema.places)
    .where(and(...conditions))
    .limit(200)
  
  return results
}

/**
 * Database'den mekanları ve yorumlarını çek
 */
export async function getPlacesWithReviews(placeIds: number[]): Promise<Map<number, Array<{ text: string; rating?: number | null }>>> {
  if (placeIds.length === 0) return new Map()

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
  categoryGroupId: string, // Ana kategori grubu ID (restaurants, hotels, vb.)
  companion: string,
  limit: number = 10
) {
  // 1. Önce ana kategori grubu ile yakın mekanları bul
  let nearbyPlaces = await getPlacesByLocation(lat, lng, 10, categoryGroupId)
  
  // 2. Eğer category ile sonuç yoksa, category filtresiz dene (fallback)
  if (nearbyPlaces.length === 0) {
    logger.warn(`⚠️  No places found with category group ${categoryGroupId}, trying without category filter...`, { categoryGroupId, lat, lng })
    nearbyPlaces = await getPlacesByLocation(lat, lng, 10)
    logger.info(`✅ Found ${nearbyPlaces.length} places without category filter`, { count: nearbyPlaces.length })
  }
  
  // 3. Eğer hala sonuç yoksa, radius'u genişlet
  if (nearbyPlaces.length === 0) {
    logger.warn(`⚠️  No places found in 10km radius, expanding to 20km...`, { lat, lng, categoryGroupId })
    nearbyPlaces = await getPlacesByLocation(lat, lng, 20, categoryGroupId)
    if (nearbyPlaces.length === 0) {
      nearbyPlaces = await getPlacesByLocation(lat, lng, 20)
    }
    logger.info(`✅ Found ${nearbyPlaces.length} places in expanded radius`, { count: nearbyPlaces.length, radius: 20 })
  }
  
  // 4. Yorumları çek
  const placeIds = nearbyPlaces.map(p => p.id)
  const reviewsByPlace = await getPlacesWithReviews(placeIds)

  // 5. Tüm analizleri tek seferde çek (N+1 Query Problem çözümü)
  // Ana kategori grubuna ait tüm place type'ları al
  const placeTypes = getCategoryMapping(categoryGroupId)
  
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
  const placesWithAnalyses = await Promise.all(
    nearbyPlaces.map(async (place) => {
      // Yorumları ekle
      const placeReviews = reviewsByPlace.get(place.id) || []
      
      // Analizi Map'ten al (önce tam eşleşme, sonra category-only)
      const analysis = exactAnalysesMap.get(place.id) || categoryAnalysesMap.get(place.id)

      // Mesafe hesapla
      const distance = calculateDistance(lat, lng, place.lat, place.lng)

      // Eğer analiz yoksa ama yorumlar varsa, basit skorlama yap
      if (!analysis && placeReviews.length > 0) {
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
        const primaryPlaceType = placeTypes.length > 0 ? placeTypes[0] : categoryGroupId
        
        const simpleAnalysis = analyzeReviewsSimple(
          sampledReviews.map(r => ({ text: r.text, rating: r.rating ?? undefined })),
          primaryPlaceType,
          companion
        )

        return {
          ...place,
          score: simpleAnalysis.score,
          why: simpleAnalysis.why,
          risks: simpleAnalysis.risks || undefined,
          distance,
          reviewCategories: simpleAnalysis.reviewCategories,
          analyzedReviewCount: placeReviews.length,
          totalReviewCount: place.reviewCount || placeReviews.length,
        }
      }

      // Default değerler - analiz yoksa bile mekanı göster
      const defaultWhy = place.rating 
        ? `Bu mekan ${place.rating.toFixed(1)} yıldız puanına sahip ve ${distance.toFixed(1)} km uzaklıkta.`
        : `Bu mekan ${distance.toFixed(1)} km uzaklıkta.`
      
      const defaultRisks = 'Detaylı analiz henüz yapılmadı. Yorumları kontrol etmenizi öneririz.'

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

      return {
        ...place,
        distance,
        score: analysis?.score || (place.rating ? Math.round(place.rating * 20) : 50), // Rating'i score'a çevir (5 yıldız = 100)
        why: analysis?.why || defaultWhy,
        risks: analysis?.risks || (analysis ? undefined : defaultRisks),
        reviewCategories: analysis?.reviewCategories
          ? JSON.parse(analysis.reviewCategories)
          : undefined,
        analyzedReviewCount: placeReviews.length, // Analiz edilen yorum sayısı
        totalReviewCount: place.reviewCount || placeReviews.length, // Toplam yorum sayısı
        googleMapsId: place.googleMapsId || undefined, // Google Maps Place ID
        // Temel iletişim bilgileri
        phone: place.phone || undefined,
        website: place.website || undefined,
        openingHours: openingHours,
        photos: photos,
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

  // Skora göre sırala (analiz varsa öncelik, sonra rating, sonra mesafe)
  const sorted = placesWithAnalyses.sort((a, b) => {
    // Önce score'a göre
    if (a.score !== b.score) return b.score - a.score
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

