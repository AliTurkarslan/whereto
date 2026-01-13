/**
 * Diversity and Novelty System
 * 
 * Önerilerde çeşitlilik sağlamak ve tekrarlayan önerileri önlemek için
 * diversity ve novelty bonusları ekleyen sistem
 */

import { ScoredPlace } from '@/lib/types/place-features'

/**
 * Diversity seçenekleri
 */
export interface DiversityOptions {
  /**
   * Kullanıcının daha önce görüntülediği mekan ID'leri
   */
  userHistory?: number[]
  
  /**
   * Kullanıcının daha önce beğendiği mekan ID'leri
   */
  userLikes?: number[]
  
  /**
   * Kullanıcının daha önce beğenmediği mekan ID'leri
   */
  userDislikes?: number[]
  
  /**
   * Novelty bonus miktarı (0-10 arası)
   */
  noveltyBonus?: number
  
  /**
   * Diversity bonus miktarı (0-10 arası)
   */
  diversityBonus?: number
  
  /**
   * Minimum diversity threshold (0-1 arası)
   * Benzer mekanlar arasındaki minimum fark
   */
  minDiversity?: number
}

/**
 * Mekan benzerliği hesapla (0-1 arası, 1 = tamamen benzer)
 */
function calculatePlaceSimilarity(place1: ScoredPlace, place2: ScoredPlace): number {
  let similarity = 0
  let weightSum = 0
  
  // 1. Fiyat seviyesi benzerliği (%20)
  const priceDiff = Math.abs(place1.priceLevel - place2.priceLevel)
  const priceSimilarity = 1 - (priceDiff / 4) // 0-4 arası fark
  similarity += priceSimilarity * 0.2
  weightSum += 0.2
  
  // 2. Ortam benzerliği (%25)
  if (place1.atmosphere && place2.atmosphere) {
    const atmosphereMatch = place1.atmosphere === place2.atmosphere ? 1 : 0.5
    similarity += atmosphereMatch * 0.25
    weightSum += 0.25
  }
  
  // 3. Kültür benzerliği (%15)
  if (place1.cuisineType && place2.cuisineType) {
    const cuisineMatch = place1.cuisineType === place2.cuisineType ? 1 : 0
    similarity += cuisineMatch * 0.15
    weightSum += 0.15
  }
  
  // 4. Mesafe benzerliği (%10) - Yakın mekanlar benzer sayılır
  const distanceDiff = Math.abs(place1.distance - place2.distance)
  const maxDistance = 20 // km
  const distanceSimilarity = 1 - Math.min(1, distanceDiff / maxDistance)
  similarity += distanceSimilarity * 0.1
  weightSum += 0.1
  
  // 5. Rating benzerliği (%15)
  if (place1.rating && place2.rating) {
    const ratingDiff = Math.abs(place1.rating - place2.rating)
    const ratingSimilarity = 1 - (ratingDiff / 5) // 0-5 arası fark
    similarity += ratingSimilarity * 0.15
    weightSum += 0.15
  }
  
  // 6. Özellik benzerliği (%15) - wheelchair, petFriendly, vb.
  let featureMatches = 0
  let totalFeatures = 0
  
  const features: (keyof ScoredPlace)[] = [
    'wheelchairAccessible',
    'petFriendly',
    'kidFriendly',
    'parking',
    'wifi',
    'vegetarian',
    'vegan',
  ]
  
  for (const feature of features) {
    if (place1[feature] !== undefined && place2[feature] !== undefined) {
      totalFeatures++
      if (place1[feature] === place2[feature]) {
        featureMatches++
      }
    }
  }
  
  if (totalFeatures > 0) {
    const featureSimilarity = featureMatches / totalFeatures
    similarity += featureSimilarity * 0.15
    weightSum += 0.15
  }
  
  // Normalize
  return weightSum > 0 ? similarity / weightSum : 0
}

/**
 * Diversity bonusu ekle
 */
export function addDiversityBonus(
  places: ScoredPlace[],
  options: DiversityOptions = {}
): ScoredPlace[] {
  const {
    noveltyBonus = 5,
    diversityBonus = 3,
    minDiversity = 0.3,
  } = options
  
  // Her mekan için diversity skoru hesapla
  const placesWithDiversity = places.map((place, index) => {
    let diversityScore = 0
    
    // 1. Novelty bonus: Kullanıcının görmediği mekanlara bonus
    if (options.userHistory && !options.userHistory.includes(place.id)) {
      diversityScore += noveltyBonus
    }
    
    // 2. Diversity bonus: Önceki mekanlardan farklı olan mekanlara bonus
    if (index > 0) {
      // Önceki mekanlarla benzerlik kontrolü
      let maxSimilarity = 0
      for (let i = 0; i < index; i++) {
        const similarity = calculatePlaceSimilarity(place, places[i])
        maxSimilarity = Math.max(maxSimilarity, similarity)
      }
      
      // Eğer benzerlik düşükse (farklıysa), bonus ver
      if (maxSimilarity < minDiversity) {
        diversityScore += diversityBonus
      } else {
        // Çok benzerse, ceza ver (diversity için)
        diversityScore -= (maxSimilarity - minDiversity) * diversityBonus * 2
      }
    }
    
    // 3. Beğenilmeyen mekanlara ceza
    if (options.userDislikes && options.userDislikes.includes(place.id)) {
      diversityScore -= 10
    }
    
    // Final score'a diversity bonus ekle
    const adjustedScore = Math.min(100, Math.max(0, place.finalScore + diversityScore))
    
    return {
      ...place,
      finalScore: Math.round(adjustedScore),
    }
  })
  
  return placesWithDiversity
}

/**
 * Diversity-aware sıralama
 * 
 * Hem skor hem de diversity'yi dikkate alarak sıralama yapar
 */
export function sortWithDiversity(
  places: ScoredPlace[],
  options: DiversityOptions = {}
): ScoredPlace[] {
  // Önce diversity bonusu ekle
  const placesWithDiversity = addDiversityBonus(places, options)
  
  // Sonra skora göre sırala
  return placesWithDiversity.sort((a, b) => {
    // Önce final score'a göre
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore
    }
    // Sonra match score'a göre
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore
    }
    // Son olarak distance'a göre (yakın olan önce)
    return a.distance - b.distance
  })
}

/**
 * Serendipity bonusu ekle
 * 
 * Beklenmedik ama uygun öneriler için bonus
 */
export function addSerendipityBonus(
  places: ScoredPlace[],
  userHistory: number[] = []
): ScoredPlace[] {
  return places.map(place => {
    // Kullanıcının görmediği ama yüksek skorlu mekanlara serendipity bonusu
    const isNovel = !userHistory.includes(place.id)
    const hasHighScore = place.finalScore >= 70
    
    if (isNovel && hasHighScore) {
      const serendipityBonus = 3
      return {
        ...place,
        finalScore: Math.min(100, place.finalScore + serendipityBonus),
      }
    }
    
    return place
  })
}



