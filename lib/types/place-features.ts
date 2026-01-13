/**
 * Mekan Özellikleri Tipleri
 * 
 * Öneri motoru için mekan özelliklerini tanımlayan tip tanımlamaları
 */

/**
 * Ortam tipi
 */
export type AtmosphereType = 'quiet' | 'lively' | 'romantic' | 'romantik' | 'casual' | 'formal'

/**
 * Yorum skorları
 */
export interface ReviewScores {
  service: number      // 0-100
  price: number        // 0-100
  quality: number      // 0-100
  atmosphere: number   // 0-100
  location: number     // 0-100
  cleanliness: number  // 0-100
  speed: number        // 0-100
}

/**
 * Mekan özellikleri (öneri motoru için)
 */
export interface PlaceFeatures {
  // Temel
  id: number
  name: string
  address: string
  lat: number
  lng: number
  priceLevel: 0 | 1 | 2 | 3 | 4
  rating?: number
  reviewCount?: number
  distance: number
  
  // Kültür
  cuisineType?: string
  
  // Ortam (yorumlardan çıkarılacak)
  atmosphere?: AtmosphereType
  
  // Özel özellikler
  wheelchairAccessible?: boolean
  petFriendly?: boolean
  kidFriendly?: boolean
  parking?: boolean
  wifi?: boolean
  vegetarian?: boolean
  vegan?: boolean
  
  // Zaman
  servesBreakfast?: boolean
  servesLunch?: boolean
  servesDinner?: boolean
  servesBrunch?: boolean
  
  // Opening hours (isOpenLate için)
  openingHours?: {
    weekdayDescriptions?: string[]
    openNow?: boolean
    periods?: Array<{
      open: { day: number; time: string }
      close?: { day: number; time: string }
    }>
  } | string | null
  
  // Context awareness için
  outdoorSeating?: boolean
  indoorOptions?: boolean | {
    indoorSeating?: boolean
    [key: string]: any
  }
  
  // Yorum analizi
  reviewScores?: ReviewScores
  
  // AI analiz sonucu
  score?: number
  why?: string
  risks?: string
}

/**
 * Skorlanmış mekan (öneri motoru çıktısı)
 */
export interface ScoredPlace extends PlaceFeatures {
  matchScore: number        // 0-100 (kullanıcı profili ile uyum skoru)
  finalScore: number        // 0-100 (matchScore + AI score kombinasyonu)
  matchDetails?: {
    budgetMatch: number
    atmosphereMatch: number
    specialNeedsMatch: number
    mealTypeMatch: number
    reviewMatch: number
  }
}

