/**
 * Place Converter
 * 
 * Database place'lerini PlaceFeatures formatına dönüştürme
 */

import { PlaceFeatures, ReviewScores } from '@/lib/types/place-features'
import type { ScoredPlace as DbScoredPlace } from '@/lib/types/place'
import { isOpenLate } from '@/lib/utils/opening-hours'

// getPlacesWithAnalyses'den dönen tip için (esnek tip)
type DbPlace = {
  name: string
  address: string
  score: number
  why: string
  risks?: string
  distance?: number
  rating?: number | null | undefined
  lat?: number | null
  lng?: number | null
  reviewCategories?: Array<{
    name: string
    score: number
    positiveRatio: number
    positiveExamples?: string[]
    negativeExamples?: string[]
  }> | null
  analyzedReviewCount?: number | null
  totalReviewCount?: number | null
  googleMapsId?: string | null
  priceLevel?: string | null
  accessibilityOptions?: {
    wheelchairAccessibleParking?: boolean
    wheelchairAccessibleEntrance?: boolean
    wheelchairAccessibleRestroom?: boolean
    wheelchairAccessibleSeating?: boolean
  } | string | null
  parkingOptions?: {
    parkingLot?: boolean
    parkingGarage?: boolean
    streetParking?: boolean
    [key: string]: any
  } | string | null
  goodForChildren?: boolean | null
  servesBreakfast?: boolean | null
  servesLunch?: boolean | null
  servesDinner?: boolean | null
  servesBrunch?: boolean | null
  servesVegetarianFood?: boolean | null
  outdoorSeating?: boolean | null
  indoorOptions?: string | boolean | {
    indoorSeating?: boolean
    [key: string]: any
  } | null
  [key: string]: any
}

/**
 * Database place'ini PlaceFeatures formatına dönüştür
 */
export function convertPlaceToFeatures(place: DbPlace): PlaceFeatures {
  // Price level'ı number'a çevir
  const priceLevelMap: Record<string, 0 | 1 | 2 | 3 | 4> = {
    'FREE': 0,
    'INEXPENSIVE': 1,
    'MODERATE': 2,
    'EXPENSIVE': 3,
    'VERY_EXPENSIVE': 4,
  }
  
  const priceLevel = place.priceLevel 
    ? (priceLevelMap[place.priceLevel] ?? 2)
    : 2

  // Review scores'u oluştur
  let reviewScores: ReviewScores | undefined = undefined
  if (place.reviewCategories && place.reviewCategories.length > 0) {
    const scores: Partial<ReviewScores> = {}
    for (const category of place.reviewCategories) {
      const categoryName = category.name.toLowerCase()
      if (categoryName === 'servis' || categoryName === 'service') {
        scores.service = category.score
      } else if (categoryName === 'fiyat' || categoryName === 'price') {
        scores.price = category.score
      } else if (categoryName === 'kalite' || categoryName === 'quality') {
        scores.quality = category.score
      } else if (categoryName === 'ortam' || categoryName === 'atmosphere') {
        scores.atmosphere = category.score
      } else if (categoryName === 'lokasyon' || categoryName === 'location') {
        scores.location = category.score
      } else if (categoryName === 'temizlik' || categoryName === 'cleanliness') {
        scores.cleanliness = category.score
      } else if (categoryName === 'hız' || categoryName === 'speed' || categoryName === 'hiz') {
        scores.speed = category.score
      }
    }
    
    // Eksik skorları varsayılan değerlerle doldur
    reviewScores = {
      service: scores.service ?? 50,
      price: scores.price ?? 50,
      quality: scores.quality ?? 50,
      atmosphere: scores.atmosphere ?? 50,
      location: scores.location ?? 50,
      cleanliness: scores.cleanliness ?? 50,
      speed: scores.speed ?? 50,
    }
  }

  // Accessibility options'dan wheelchair accessible'i çıkar
  const wheelchairAccessible = place.accessibilityOptions && typeof place.accessibilityOptions === 'object'
    ? (place.accessibilityOptions.wheelchairAccessibleParking ||
       place.accessibilityOptions.wheelchairAccessibleEntrance ||
       place.accessibilityOptions.wheelchairAccessibleRestroom ||
       place.accessibilityOptions.wheelchairAccessibleSeating)
    : undefined

  // Parking options'dan parking'i çıkar
  const parkingOptions = typeof place.parkingOptions === 'string'
    ? (() => {
        try {
          return JSON.parse(place.parkingOptions)
        } catch {
          return null
        }
      })()
    : place.parkingOptions
  const parking = parkingOptions
    ? (parkingOptions.parkingLot ||
       parkingOptions.parkingGarage ||
       parkingOptions.streetParking ||
       parkingOptions.freeGarageParking ||
       parkingOptions.freeParkingLot)
    : undefined

  return {
    id: 0, // Database'den gelmiyorsa 0
    name: place.name,
    address: place.address,
    lat: place.lat || 0,
    lng: place.lng || 0,
    priceLevel,
    rating: place.rating ?? undefined,
    reviewCount: place.totalReviewCount ?? place.analyzedReviewCount ?? undefined,
    distance: place.distance || 0,
    
    // Kültür (gelecekte database'den gelecek)
    cuisineType: undefined,
    
  // Ortam (database'den veya yorumlardan)
  atmosphere: place.atmosphere ? (typeof place.atmosphere === 'string' ? place.atmosphere as any : undefined) : undefined,
  
  // Özel özellikler
  wheelchairAccessible,
  petFriendly: place.petFriendly ?? undefined,
    kidFriendly: place.goodForChildren ?? undefined,
    parking,
    wifi: place.wifi ?? undefined,
    vegetarian: place.servesVegetarianFood ?? undefined,
  vegan: place.vegan ?? undefined,
    
    // Zaman
    servesBreakfast: place.servesBreakfast ?? undefined,
    servesLunch: place.servesLunch ?? undefined,
    servesDinner: place.servesDinner ?? undefined,
    servesBrunch: place.servesBrunch ?? undefined,
    
    // Opening hours bilgisi (isOpenLate için)
    openingHours: place.openingHours,
    
    // Context awareness için
    outdoorSeating: place.outdoorSeating ?? undefined,
    indoorOptions: place.indoorOptions
      ? (typeof place.indoorOptions === 'string'
          ? (() => {
              try {
                const parsed = JSON.parse(place.indoorOptions)
                return parsed
              } catch {
                return place.indoorOptions === 'true' || place.indoorOptions === '1'
              }
            })()
          : place.indoorOptions)
      : undefined,
    
    // Yorum analizi
    reviewScores,
    
    // AI analiz sonucu
    score: place.score,
    why: place.why,
    risks: place.risks,
  }
}

