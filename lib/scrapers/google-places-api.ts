/**
 * Google Places API (Yeni) Client
 * 
 * Resmi Google Places API kullanarak mekan verilerini çeker
 * Web scraping yerine API kullanarak daha güvenilir ve hızlı veri toplama
 * 
 * API Dokümantasyonu:
 * https://developers.google.com/maps/documentation/places/web-service/overview
 */

import { PlaceData } from './google-maps'
import { logger } from '../logging/logger'
import { getSafeRequestLimit, trackApiUsage } from '../utils/free-tier-protection'

const PLACES_API_BASE = 'https://places.googleapis.com/v1'

interface PlacesApiConfig {
  apiKey: string
}

interface PlaceSearchResponse {
  places: Array<{
    id: string
    displayName: {
      text: string
    }
    formattedAddress?: string
    shortFormattedAddress?: string
    location: {
      latitude: number
      longitude: number
    }
    viewport?: {
      low: { latitude: number; longitude: number }
      high: { latitude: number; longitude: number }
    }
    rating?: number
    userRatingCount?: number
    priceLevel?: string
    types?: string[]
    primaryType?: string
    primaryTypeDisplayName?: {
      text: string
    }
    internationalPhoneNumber?: string
    nationalPhoneNumber?: string
    websiteUri?: string
    currentOpeningHours?: {
      weekdayDescriptions?: string[]
      openNow?: boolean
    }
    regularOpeningHours?: {
      weekdayDescriptions?: string[]
    }
    editorialSummary?: {
      text: string
    }
    businessStatus?: string
    plusCode?: {
      globalCode?: string
      compoundCode?: string
    }
    photos?: Array<{
      name: string
      widthPx?: number
      heightPx?: number
    }>
    iconBackgroundColor?: string
    iconMaskBaseUri?: string
  }>
  nextPageToken?: string
}

interface PlaceDetailsResponse {
  id: string
  displayName: {
    text: string
    languageCode?: string
  }
  formattedAddress?: string
  shortFormattedAddress?: string
  addressComponents?: Array<{
    longText: string
    shortText: string
    types: string[]
    languageCode: string
  }>
  location: {
    latitude: number
    longitude: number
  }
  viewport?: {
    low: { latitude: number; longitude: number }
    high: { latitude: number; longitude: number }
  }
  rating?: number
  userRatingCount?: number
  reviews?: Array<{
    text: {
      text: string
    }
    rating: number
    authorAttribution: {
      displayName: string
      uri?: string
      photoUri?: string
    }
    publishTime: string
    relativePublishTimeDescription?: string
  }>
  priceLevel?: string
  types?: string[]
  primaryType?: string
  primaryTypeDisplayName?: {
    text: string
    languageCode?: string
  }
  // İletişim bilgileri
  internationalPhoneNumber?: string
  nationalPhoneNumber?: string
  websiteUri?: string
  // Çalışma saatleri
  currentOpeningHours?: {
    weekdayDescriptions?: string[]
    openNow?: boolean
    periods?: Array<{
      open: { day: number; hour: number; minute: number }
      close?: { day: number; hour: number; minute: number }
    }>
  }
  regularOpeningHours?: {
    weekdayDescriptions?: string[]
    periods?: Array<{
      open: { day: number; hour: number; minute: number }
      close?: { day: number; hour: number; minute: number }
    }>
  }
  // Diğer bilgiler
  editorialSummary?: {
    text: string
    languageCode?: string
  }
  businessStatus?: string
  plusCode?: {
    globalCode?: string
    compoundCode?: string
  }
  photos?: Array<{
    name: string
    widthPx?: number
    heightPx?: number
    authorAttributions?: Array<{
      displayName: string
      photoUri?: string
    }>
  }>
  iconBackgroundColor?: string
  iconMaskBaseUri?: string
  // Erişilebilirlik ve özellikler
  accessibilityOptions?: {
    wheelchairAccessibleParking?: boolean
    wheelchairAccessibleEntrance?: boolean
    wheelchairAccessibleRestroom?: boolean
    wheelchairAccessibleSeating?: boolean
  }
  evChargingOptions?: {
    connectorCount?: number
    connectorAggregation?: Array<{
      type?: string
      count?: number
    }>
  }
  fuelOptions?: {
    fuelPrices?: Array<{
      type: string
      price: {
        units: string
        nanos: number
        currencyCode: string
      }
      updateTime?: string
    }>
  }
  goodForChildren?: boolean
  goodForGroups?: boolean
  goodForWatchingSports?: boolean
  indoorOptions?: {
    indoorSeating?: boolean
    indoorOutdoorSeating?: boolean
  }
  liveMusic?: boolean
  menuForChildren?: boolean
  outdoorSeating?: boolean
  parkingOptions?: {
    parkingLot?: boolean
    parkingGarage?: boolean
    streetParking?: boolean
    valetParking?: boolean
    freeGarageParking?: boolean
    freeParkingLot?: boolean
    paidParkingLot?: boolean
    paidParkingGarage?: boolean
    paidStreetParking?: boolean
    valetParkingAvailable?: boolean
  }
  paymentOptions?: {
    acceptsCreditCards?: boolean
    acceptsDebitCards?: boolean
    acceptsCashOnly?: boolean
    acceptsNfc?: boolean
  }
  reservable?: boolean
  restroom?: boolean
  // Yemek ve içecek seçenekleri
  servesBreakfast?: boolean
  servesBrunch?: boolean
  servesDinner?: boolean
  servesLunch?: boolean
  servesBeer?: boolean
  servesWine?: boolean
  servesCocktails?: boolean
  servesVegetarianFood?: boolean
  // Hizmet seçenekleri
  takeout?: boolean
  delivery?: boolean
  dineIn?: boolean
  subDestinations?: Array<{
    id: string
    displayName: {
      text: string
    }
  }>
}

// Field mask'lar - Google Places API v1 için doğru field'lar
// Text Search ve Nearby Search için field mask
const SEARCH_FIELD_MASK = 'places.id,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.location,places.viewport,places.rating,places.userRatingCount,places.priceLevel,places.types,places.primaryType,places.primaryTypeDisplayName,places.internationalPhoneNumber,places.nationalPhoneNumber,places.websiteUri,places.currentOpeningHours,places.regularOpeningHours,places.editorialSummary,places.businessStatus,places.plusCode,places.photos,places.iconBackgroundColor,places.iconMaskBaseUri'

// Place Details için field mask - GÜVENLİ FIELD'LAR
// Sadece tüm place type'lar için geçerli olan field'ları içerir
// evChargingOptions ve fuelOptions sadece belirli place type'lar için mevcut olduğu için kaldırıldı
const PLACE_DETAILS_FIELD_MASK = 'id,displayName,formattedAddress,shortFormattedAddress,addressComponents,location,viewport,rating,userRatingCount,reviews,priceLevel,types,primaryType,primaryTypeDisplayName,internationalPhoneNumber,nationalPhoneNumber,websiteUri,currentOpeningHours,regularOpeningHours,editorialSummary,businessStatus,plusCode,photos,iconBackgroundColor,iconMaskBaseUri,accessibilityOptions,goodForChildren,goodForGroups,goodForWatchingSports,indoorOptions,liveMusic,menuForChildren,outdoorSeating,parkingOptions,paymentOptions,reservable,restroom,servesBreakfast,servesBrunch,servesDinner,servesLunch,servesBeer,servesWine,servesCocktails,servesVegetarianFood,takeout,delivery,dineIn,subDestinations,currentSecondaryOpeningHours'

/**
 * Google Places API ile mekan arama
 */
export async function searchPlaces(
  query: string,
  location: { lat: number; lng: number },
  apiKey: string,
  maxResults: number = 50
): Promise<PlaceData[]> {
  const results: PlaceData[] = []
  let nextPageToken: string | undefined

  try {
    // İlk arama
    const searchUrl = `${PLACES_API_BASE}/places:searchText`
    
    const requestBody = {
      textQuery: query,
      maxResultCount: 20, // API limit: 20 per request
      locationBias: {
        circle: {
          center: {
            latitude: location.lat,
            longitude: location.lng,
          },
          radius: 10000.0, // 10km radius
        },
      },
      includedType: getPlaceType(query),
    }

    // Free tier koruması - günlük limit kontrolü
    const safeMaxRequests = getSafeRequestLimit('placesTextSearch', Math.min(Math.ceil(maxResults / 20), 5))
    
    let requestCount = 0
    const maxRequests = safeMaxRequests // Free tier korumalı limit

    do {
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': SEARCH_FIELD_MASK,
        },
        body: JSON.stringify({
          ...requestBody,
          ...(nextPageToken && { pageToken: nextPageToken }),
        }),
      })

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch (e) {
          errorData = { error: { message: await response.text() } }
        }
        
        // Rate limit kontrolü
        if (response.status === 429) {
          logger.warn('⚠️  Rate limit reached, waiting 1 second...', { location })
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }
        
        const errorMessage = errorData?.error?.message || `Status ${response.status}`
        const errorDetails = errorData?.error?.details?.[0]?.fieldViolations?.[0]?.description || ''
        throw new Error(`Places API error: ${response.status} - ${errorMessage}${errorDetails ? ` - ${errorDetails}` : ''}`)
      }

      const data: PlaceSearchResponse = await response.json()
      
      // nextPageToken response'tan gelir
      if (data.nextPageToken) {
        nextPageToken = data.nextPageToken
      } else {
        nextPageToken = undefined
      }

      // Place'leri PlaceData formatına dönüştür
      for (const place of data.places) {
        if (results.length >= maxResults) break

        results.push({
          name: place.displayName.text,
          address: place.formattedAddress || place.shortFormattedAddress || '',
          rating: place.rating,
          reviewCount: place.userRatingCount,
          lat: place.location.latitude,
          lng: place.location.longitude,
          category: query,
          placeId: place.id,
        })
      }

      requestCount++

      // API kullanımını kaydet
      const usage = trackApiUsage('placesTextSearch', 1)
      if (!usage.allowed) {
        logger.warn('⚠️  Free tier günlük limiti aşıldı, sync durduruluyor', {
          remaining: usage.remaining,
          dailyLimit: 200 / 30, // ~$6.67/gün
        })
        break
      }

      // Rate limiting - API limit: 10 requests/second
      if (nextPageToken && requestCount < maxRequests) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } while (nextPageToken && results.length < maxResults && requestCount < maxRequests)

    logger.info(`✅ Places API: Found ${results.length} places for "${query}"`, { query, count: results.length })

    return results
  } catch (error) {
    logger.error('Places API search error', error instanceof Error ? error : new Error(String(error)), { query })
    throw error
  }
}

/**
 * Place detaylarını ve yorumlarını çek
 */
export async function getPlaceDetails(
  placeId: string,
  apiKey: string
): Promise<PlaceData | null> {
  // Free tier koruması - Place Details pahalı, kullanımı sınırla
  const usage = trackApiUsage('placesDetails', 1)
  
  if (!usage.allowed) {
    logger.warn('⚠️  Place Details API kullanımı free tier limiti nedeniyle engellendi', {
      placeId,
      remaining: usage.remaining,
    })
    return null
  }
  
  try {
    const url = `${PLACES_API_BASE}/places/${placeId}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': PLACE_DETAILS_FIELD_MASK,
      },
    })

    if (!response.ok) {
      let errorData: any = {}
      try {
        errorData = await response.json()
      } catch (e) {
        errorData = { error: { message: 'Unknown error' } }
      }
      const errorMessage = errorData?.error?.message || `Status ${response.status}`
      const errorDetails = errorData?.error?.details?.[0]?.fieldViolations?.[0]?.description || ''
      const fullError = `Places API details error: ${response.status} - ${errorMessage}${errorDetails ? ` - ${errorDetails}` : ''}`
      logger.error(`[getPlaceDetails] ${fullError}`, new Error(fullError), { 
        placeId, 
        errorData: JSON.stringify(errorData, null, 2) 
      })
      throw new Error(fullError)
    }

    const place: PlaceDetailsResponse = await response.json()

    // Yorumları çek ve filtrele (kaliteli yorumlar)
    const allReviews = place.reviews?.map(review => review.text.text) || []
    
    // Yorum kalitesi kontrolü: Minimum 30 karakter, anlamlı içerik
    const qualityReviews = allReviews.filter(review => {
      if (!review || review.trim().length < 30) return false
      
      // Çok kısa veya anlamsız yorumları filtrele
      const trimmed = review.trim()
      if (trimmed.length < 30) return false
      
      // Sadece noktalama işareti veya sayı içeren yorumları filtrele
      const hasContent = /[a-zA-ZçğıöşüÇĞIİÖŞÜ]/.test(trimmed)
      if (!hasContent) return false
      
      return true
    })
    
    // Eğer kaliteli yorum sayısı yetersizse, tüm yorumları kullan (ama en az 20 karakter)
    const reviews = qualityReviews.length >= 5 
      ? qualityReviews 
      : allReviews.filter(r => r && r.trim().length >= 20)

    return {
      name: place.displayName.text,
      address: place.formattedAddress || place.shortFormattedAddress || '',
      rating: place.rating,
      reviewCount: place.userRatingCount,
      lat: place.location.latitude,
      lng: place.location.longitude,
      reviews: reviews.length > 0 ? reviews : undefined,
      category: place.primaryType || undefined,
      placeId: place.id,
      // Temel iletişim bilgileri
      phone: place.internationalPhoneNumber || place.nationalPhoneNumber,
      website: place.websiteUri,
      openingHours: place.currentOpeningHours || place.regularOpeningHours ? {
        weekdayDescriptions: place.currentOpeningHours?.weekdayDescriptions || place.regularOpeningHours?.weekdayDescriptions,
        openNow: place.currentOpeningHours?.openNow,
      } : undefined,
      photos: place.photos,
      editorialSummary: place.editorialSummary?.text,
      businessStatus: place.businessStatus,
      priceLevel: place.priceLevel,
      plusCode: place.plusCode?.globalCode || place.plusCode?.compoundCode,
      // Kapsamlı alanlar
      shortFormattedAddress: place.shortFormattedAddress,
      addressComponents: place.addressComponents,
      viewport: place.viewport,
      primaryType: place.primaryType,
      primaryTypeDisplayName: place.primaryTypeDisplayName?.text,
      iconBackgroundColor: place.iconBackgroundColor,
      iconMaskBaseUri: place.iconMaskBaseUri,
      // Accessibility ve özellikler
      accessibilityOptions: place.accessibilityOptions,
      // evChargingOptions ve fuelOptions field mask'tan kaldırıldı (sadece belirli place type'lar için mevcut)
      goodForChildren: place.goodForChildren,
      goodForGroups: place.goodForGroups,
      goodForWatchingSports: place.goodForWatchingSports,
      indoorOptions: place.indoorOptions,
      liveMusic: place.liveMusic,
      menuForChildren: place.menuForChildren,
      outdoorSeating: place.outdoorSeating,
      parkingOptions: place.parkingOptions,
      paymentOptions: place.paymentOptions,
      reservable: place.reservable,
      restroom: place.restroom,
      // Yemek ve içecek seçenekleri
      servesBreakfast: place.servesBreakfast,
      servesBrunch: place.servesBrunch,
      servesDinner: place.servesDinner,
      servesLunch: place.servesLunch,
      servesBeer: place.servesBeer,
      servesWine: place.servesWine,
      servesCocktails: place.servesCocktails,
      servesVegetarianFood: place.servesVegetarianFood,
      // Hizmet seçenekleri
      takeout: place.takeout,
      delivery: place.delivery,
      dineIn: place.dineIn,
      subDestinations: place.subDestinations?.map(dest => ({
        id: dest.id,
        displayName: dest.displayName.text,
      })),
    }
  } catch (error) {
    logger.error(`[getPlaceDetails] Error fetching place details for ${placeId}`, error instanceof Error ? error : new Error(String(error)), { placeId })
    return null
  }
}

/**
 * Place type mapping
 */
function getPlaceType(query: string): string | undefined {
  const typeMap: Record<string, string> = {
    restaurant: 'restaurant',
    cafe: 'cafe',
    bar: 'bar',
    'hair salon': 'hair_salon',
    spa: 'spa',
    shopping: 'clothing_store',
    entertainment: 'amusement_center',
  }

  const normalizedQuery = query.toLowerCase().trim()
  return typeMap[normalizedQuery] || undefined
}

/**
 * Nearby Search - Belirli bir konum etrafında mekanları bul
 */
export async function searchNearby(
  location: { lat: number; lng: number },
  type: string | undefined,
  apiKey: string,
  radius: number = 5000, // 5km
  maxResults: number = 50
): Promise<PlaceData[]> {
  const results: PlaceData[] = []
  let nextPageToken: string | undefined

  try {
    const searchUrl = `${PLACES_API_BASE}/places:searchNearby`
    
    const requestBody: any = {
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude: location.lat,
            longitude: location.lng,
          },
          radius: Math.max(radius, 10000), // En az 10km
        },
      },
    }

    // Places API (New) için includedTypes (çoğul) kullanılmalı
    if (type) {
      requestBody.includedTypes = [type]
    }

    // Free tier koruması - günlük limit kontrolü
    const safeMaxRequests = getSafeRequestLimit('placesNearbySearch', Math.min(Math.ceil(maxResults / 20), 5))
    
    let requestCount = 0
    const maxRequests = safeMaxRequests // Free tier korumalı limit

    do {
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': SEARCH_FIELD_MASK,
        },
        body: JSON.stringify({
          ...requestBody,
          ...(nextPageToken && { pageToken: nextPageToken }),
        }),
      })

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch (e) {
          errorData = { error: { message: await response.text() } }
        }
        
        // Rate limit kontrolü
        if (response.status === 429) {
          logger.warn('⚠️  Rate limit reached, waiting 1 second...', { location })
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }
        
        const errorMessage = errorData?.error?.message || `Status ${response.status}`
        const errorDetails = errorData?.error?.details?.[0]?.fieldViolations?.[0]?.description || ''
        throw new Error(`Places API nearby error: ${response.status} - ${errorMessage}${errorDetails ? ` - ${errorDetails}` : ''}`)
      }

      const data: PlaceSearchResponse = await response.json()

      for (const place of data.places) {
        if (results.length >= maxResults) break

        results.push({
          name: place.displayName.text,
          address: place.formattedAddress || place.shortFormattedAddress || '',
          rating: place.rating,
          reviewCount: place.userRatingCount,
          lat: place.location.latitude,
          lng: place.location.longitude,
          category: type || 'unknown',
          placeId: place.id,
        })
      }

      // nextPageToken response'tan gelir
      if (data.nextPageToken) {
        nextPageToken = data.nextPageToken
      } else {
        nextPageToken = undefined
      }
      
      requestCount++

      // API kullanımını kaydet
      const usage = trackApiUsage('placesNearbySearch', 1)
      if (!usage.allowed) {
        logger.warn('⚠️  Free tier günlük limiti aşıldı, sync durduruluyor', {
          remaining: usage.remaining,
          dailyLimit: 200 / 30, // ~$6.67/gün
        })
        break
      }

      if (nextPageToken && requestCount < maxRequests) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } while (nextPageToken && results.length < maxResults && requestCount < maxRequests)

    logger.info(`✅ Places API Nearby: Found ${results.length} places`, { location, count: results.length })

    return results
  } catch (error) {
    logger.error('Places API nearby search error', error instanceof Error ? error : new Error(String(error)), { location })
    throw error
  }
}

/**
 * Hem Text Search hem Nearby Search kullanarak daha fazla mekan bul
 */
export async function searchPlacesComprehensive(
  query: string,
  location: { lat: number; lng: number },
  apiKey: string,
  maxResults: number = 100
): Promise<PlaceData[]> {
  const allResults: PlaceData[] = []
  const seenIds = new Set<string>()

  try {
    // 1. Text Search
    logger.debug(`🔍 Text Search: ${query}`, { query, location })
    const textResults = await searchPlaces(query, location, apiKey, maxResults)
    
    for (const place of textResults) {
      const key = `${place.lat}-${place.lng}-${place.name}`
      if (!seenIds.has(key)) {
        seenIds.add(key)
        allResults.push(place)
      }
    }

    // 2. Nearby Search (type ile) - daha geniş radius
    const placeType = getPlaceType(query)
    if (placeType) {
      logger.debug(`🔍 Nearby Search: ${placeType}`, { placeType, location })
      const nearbyResults = await searchNearby(location, placeType, apiKey, 10000, maxResults) // 10km radius
      
      for (const place of nearbyResults) {
        const key = `${place.lat}-${place.lng}-${place.name}`
        if (!seenIds.has(key)) {
          seenIds.add(key)
          allResults.push(place)
        }
      }
    }

    logger.info(`✅ Total unique places found: ${allResults.length}`, { query, location, count: allResults.length })

    return allResults
  } catch (error) {
    logger.error('Comprehensive search error', error instanceof Error ? error : new Error(String(error)), { query, location })
    throw error
  }
}
