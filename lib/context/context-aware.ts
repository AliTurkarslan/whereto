/**
 * Context Awareness System
 * 
 * Zaman, hava durumu, konum ve etkinlik bağlamını dikkate alarak
 * önerileri optimize eden sistem
 */

import { PlaceFeatures, ScoredPlace } from '@/lib/types/place-features'

/**
 * Context bilgisi
 */
export interface Context {
  time: {
    hour: number              // 0-23
    dayOfWeek: number         // 0 (Pazar) - 6 (Cumartesi)
    month: number             // 1-12
    season: 'spring' | 'summer' | 'fall' | 'winter'
  }
  weather?: {
    condition: 'sunny' | 'rainy' | 'snowy' | 'cloudy' | 'windy'
    temperature: number       // Celsius
    isBadWeather: boolean     // Kötü hava durumu (yağmur, kar, vb.)
  }
  location: {
    city?: string
    district?: string
    country?: string
  }
  event?: {
    type: 'holiday' | 'festival' | 'special' | 'weekend'
    name?: string
  }
}

/**
 * Mevsimi hesapla
 */
export function getSeason(month: number): 'spring' | 'summer' | 'fall' | 'winter' {
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'fall'
  return 'winter'
}

/**
 * Mevcut context'i oluştur
 */
export function getCurrentContext(location?: { city?: string; district?: string; country?: string }): Context {
  const now = new Date()
  const hour = now.getHours()
  const dayOfWeek = now.getDay()
  const month = now.getMonth() + 1
  
  return {
    time: {
      hour,
      dayOfWeek,
      month,
      season: getSeason(month),
    },
    location: location || {},
    event: getEventContext(dayOfWeek, month),
  }
}

/**
 * Etkinlik bağlamını belirle
 */
function getEventContext(dayOfWeek: number, month: number): Context['event'] | undefined {
  // Hafta sonu kontrolü
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { type: 'weekend' }
  }
  
  // Özel günler (basit kontrol, daha gelişmiş bir sistem için harici API kullanılabilir)
  // Türkiye için önemli günler
  if (month === 1 && dayOfWeek === 1) {
    // Yılbaşı yakınları
    return { type: 'holiday', name: 'Yılbaşı' }
  }
  
  // Daha fazla özel gün eklenebilir
  
  return undefined
}

/**
 * Context'e göre önerileri ayarla
 */
export function adjustRecommendationsByContext(
  places: ScoredPlace[],
  context: Context
): ScoredPlace[] {
  return places.map(place => {
    let contextBonus = 0
    let contextPenalty = 0
    
    // 1. Zaman bağlamı
    const timeBonus = calculateTimeBonus(place, context.time)
    contextBonus += timeBonus
    
    // 2. Hava durumu bağlamı
    if (context.weather) {
      const weatherBonus = calculateWeatherBonus(place, context.weather)
      contextBonus += weatherBonus
      
      const weatherPenalty = calculateWeatherPenalty(place, context.weather)
      contextPenalty += weatherPenalty
    }
    
    // 3. Etkinlik bağlamı
    if (context.event) {
      const eventBonus = calculateEventBonus(place, context.event, context.time)
      contextBonus += eventBonus
    }
    
    // Final score'a context bonus/penalty ekle
    const adjustedScore = Math.min(100, Math.max(0, place.finalScore + contextBonus - contextPenalty))
    
    return {
      ...place,
      finalScore: Math.round(adjustedScore),
    }
  })
}

/**
 * Zaman bağlamı bonusu hesapla
 */
function calculateTimeBonus(place: PlaceFeatures, time: Context['time']): number {
  let bonus = 0
  
  // Sabah (6-10): Kahvaltı mekanlarına bonus
  if (time.hour >= 6 && time.hour < 10) {
    if (place.servesBreakfast) {
      bonus += 5
    }
  }
  
  // Öğle (11-14): Öğle yemeği mekanlarına bonus
  if (time.hour >= 11 && time.hour < 14) {
    if (place.servesLunch) {
      bonus += 5
    }
  }
  
  // Akşam (18-22): Akşam yemeği mekanlarına bonus
  if (time.hour >= 18 && time.hour < 22) {
    if (place.servesDinner) {
      bonus += 5
    }
  }
  
  // Gece (22-02): Gece açık mekanlara bonus
  if (time.hour >= 22 || time.hour < 2) {
    // isOpenLate kontrolü zaten yapılıyor, burada sadece bonus veriyoruz
    bonus += 3
  }
  
  // Hafta sonu: Daha canlı mekanlara bonus
  if (time.dayOfWeek === 0 || time.dayOfWeek === 6) {
    if (place.atmosphere === 'lively' || place.atmosphere === 'casual') {
      bonus += 3
    }
  }
  
  // Hafta içi: Sessiz mekanlara bonus
  if (time.dayOfWeek >= 1 && time.dayOfWeek <= 5) {
    if (place.atmosphere === 'quiet' || place.atmosphere === 'formal') {
      bonus += 2
    }
  }
  
  // Mevsim: Yaz aylarında açık hava mekanlarına bonus
  if (time.season === 'summer' || time.season === 'spring') {
    if (place.outdoorSeating) {
      bonus += 4
    }
  }
  
  // Kış aylarında kapalı mekanlara bonus
  if (time.season === 'winter' || time.season === 'fall') {
    if (!place.outdoorSeating) {
      bonus += 2
    }
  }
  
  return bonus
}

/**
 * Hava durumu bonusu hesapla
 */
function calculateWeatherBonus(place: PlaceFeatures, weather: NonNullable<Context['weather']>): number {
  let bonus = 0
  
  // Güneşli hava: Açık hava mekanlarına bonus
  if (weather.condition === 'sunny' && weather.temperature > 15) {
    if (place.outdoorSeating) {
      bonus += 5
    }
  }
  
  // Sıcak hava: İç mekanlara bonus (serinlemek için)
  if (weather.temperature > 30) {
    if (!place.outdoorSeating) {
      bonus += 3
    }
  }
  
  return bonus
}

/**
 * Hava durumu cezası hesapla
 */
function calculateWeatherPenalty(place: PlaceFeatures, weather: NonNullable<Context['weather']>): number {
  let penalty = 0
  
  // Kötü hava durumu: Açık hava mekanlarına ceza
  if (weather.isBadWeather) {
    if (place.outdoorSeating && !place.indoorOptions) {
      penalty += 10 // Sadece açık hava varsa büyük ceza
    } else if (place.outdoorSeating) {
      penalty += 3 // Hem açık hem kapalı varsa küçük ceza
    }
  }
  
  // Soğuk hava: Açık hava mekanlarına ceza
  if (weather.temperature < 10) {
    if (place.outdoorSeating && !place.indoorOptions) {
      penalty += 8
    }
  }
  
  return penalty
}

/**
 * Etkinlik bağlamı bonusu hesapla
 */
function calculateEventBonus(
  place: PlaceFeatures,
  event: NonNullable<Context['event']>,
  time: Context['time']
): number {
  let bonus = 0
  
  // Hafta sonu: Canlı mekanlara bonus
  if (event.type === 'weekend') {
    if (place.atmosphere === 'lively' || place.atmosphere === 'casual') {
      bonus += 4
    }
  }
  
  // Tatil: Özel mekanlara bonus
  if (event.type === 'holiday') {
    if (place.atmosphere === 'romantik' || place.atmosphere === 'formal') {
      bonus += 5
    }
  }
  
  // Festival: Canlı mekanlara bonus
  if (event.type === 'festival') {
    if (place.atmosphere === 'lively') {
      bonus += 6
    }
  }
  
  return bonus
}

/**
 * PlaceFeatures'a outdoorSeating ve indoorOptions ekle (eğer yoksa)
 */
declare module '@/lib/types/place-features' {
  interface PlaceFeatures {
    outdoorSeating?: boolean
    indoorOptions?: boolean | {
      indoorSeating?: boolean
      [key: string]: any
    }
  }
}

