/**
 * Veri Kalitesi Kontrolü ve Filtreleme
 * 
 * Yüksek kaliteli mekanları ve yorumları seçmek için yardımcı fonksiyonlar
 */

export interface QualityCriteria {
  minReviewCount: number // Minimum yorum sayısı (default: 20)
  minRating: number // Minimum rating (default: 3.5)
  minReviewLength: number // Minimum yorum uzunluğu (karakter) (default: 30)
  requireValidCategory: boolean // Kategori doğrulaması gerekli mi (default: true)
  requireValidLocation: boolean // Geçerli koordinat gerekli mi (default: true)
  requireValidName: boolean // Geçerli isim gerekli mi (default: true)
  requireValidAddress: boolean // Geçerli adres gerekli mi (default: true)
}

export const DEFAULT_QUALITY_CRITERIA: QualityCriteria = {
  minReviewCount: 20, // Minimum 20 yorum
  minRating: 3.5, // Minimum 3.5 rating
  minReviewLength: 30, // Minimum 30 karakter yorum
  requireValidCategory: true,
  requireValidLocation: true,
  requireValidName: true,
  requireValidAddress: true,
}

export interface PlaceQualityCheck {
  isValid: boolean
  reasons: string[]
  score: number // 0-100 kalite skoru
}

/**
 * Place kalitesini kontrol et
 */
export function checkPlaceQuality(
  place: {
    name?: string | null
    address?: string | null
    lat?: number | null
    lng?: number | null
    rating?: number | null
    reviewCount?: number | null
    category?: string | null
    reviews?: string[] | null
  },
  criteria: QualityCriteria = DEFAULT_QUALITY_CRITERIA
): PlaceQualityCheck {
  const reasons: string[] = []
  let score = 100

  // 1. İsim kontrolü
  if (criteria.requireValidName) {
    if (!place.name || place.name.trim().length < 2) {
      reasons.push('Geçersiz veya eksik isim')
      score -= 20
    }
  }

  // 2. Adres kontrolü
  if (criteria.requireValidAddress) {
    if (!place.address || place.address.trim().length < 5) {
      reasons.push('Geçersiz veya eksik adres')
      score -= 15
    }
  }

  // 3. Konum kontrolü
  if (criteria.requireValidLocation) {
    if (!place.lat || !place.lng || 
        place.lat === 0 || place.lng === 0 ||
        place.lat < -90 || place.lat > 90 ||
        place.lng < -180 || place.lng > 180) {
      reasons.push('Geçersiz koordinat')
      score -= 25
    }
  }

  // 4. Kategori kontrolü
  if (criteria.requireValidCategory) {
    if (!place.category || place.category.trim().length === 0) {
      reasons.push('Kategori belirtilmemiş')
      score -= 10
    }
  }

  // 5. Rating kontrolü
  if (place.rating !== null && place.rating !== undefined) {
    if (place.rating < criteria.minRating) {
      reasons.push(`Rating çok düşük (${place.rating.toFixed(1)} < ${criteria.minRating})`)
      score -= 30
    } else if (place.rating >= 4.5) {
      score += 5 // Yüksek rating bonus
    }
  } else {
    reasons.push('Rating bilgisi yok')
    score -= 15
  }

  // 6. Yorum sayısı kontrolü (EN ÖNEMLİ)
  const reviewCount = place.reviewCount || place.reviews?.length || 0
  if (reviewCount < criteria.minReviewCount) {
    reasons.push(`Yorum sayısı yetersiz (${reviewCount} < ${criteria.minReviewCount})`)
    score -= 40 // Yorum sayısı çok önemli
  } else if (reviewCount >= 50) {
    score += 10 // Çok yorumlu yerler bonus
  } else if (reviewCount >= 100) {
    score += 15 // Çok popüler yerler bonus
  }

  // 7. Yorum kalitesi kontrolü
  if (place.reviews && place.reviews.length > 0) {
    const validReviews = place.reviews.filter(
      review => review && review.trim().length >= criteria.minReviewLength
    )
    
    if (validReviews.length < criteria.minReviewCount) {
      reasons.push(`Kaliteli yorum sayısı yetersiz (${validReviews.length} < ${criteria.minReviewCount})`)
      score -= 20
    }

    // Ortalama yorum uzunluğu
    const avgLength = validReviews.reduce((sum, r) => sum + r.length, 0) / validReviews.length
    if (avgLength < 50) {
      reasons.push('Yorumlar çok kısa (ortalama < 50 karakter)')
      score -= 10
    }
  }

  const isValid = score >= 50 && reasons.length === 0

  return {
    isValid,
    reasons,
    score: Math.max(0, Math.min(100, score)),
  }
}

/**
 * Kategori uyumunu kontrol et
 * Place'in kategorisi, aranan kategori ile uyumlu mu?
 */
export function checkCategoryMatch(
  placeCategory: string | null | undefined,
  searchCategory: string
): boolean {
  if (!placeCategory) return false

  // Exact match
  if (placeCategory.toLowerCase() === searchCategory.toLowerCase()) {
    return true
  }

  // Place'in types array'inde searchCategory var mı?
  // (Eğer placeCategory bir array ise)
  
  return false
}

/**
 * Popülerlik skoru hesapla
 * Review count ve rating'e göre
 */
export function calculatePopularityScore(
  reviewCount: number,
  rating?: number | null
): number {
  let score = 0

  // Review count skoru (0-60 puan)
  if (reviewCount >= 100) {
    score += 60
  } else if (reviewCount >= 50) {
    score += 50
  } else if (reviewCount >= 30) {
    score += 40
  } else if (reviewCount >= 20) {
    score += 30
  } else if (reviewCount >= 10) {
    score += 15
  } else {
    score += 5
  }

  // Rating skoru (0-40 puan)
  if (rating) {
    if (rating >= 4.5) {
      score += 40
    } else if (rating >= 4.0) {
      score += 30
    } else if (rating >= 3.5) {
      score += 20
    } else if (rating >= 3.0) {
      score += 10
    }
  }

  return Math.min(100, score)
}

/**
 * Yorum kalitesi kontrolü
 */
export function checkReviewQuality(
  reviews: string[]
): {
  validCount: number
  avgLength: number
  qualityScore: number
} {
  const validReviews = reviews.filter(
    review => review && review.trim().length >= 30
  )

  const avgLength = validReviews.length > 0
    ? validReviews.reduce((sum, r) => sum + r.length, 0) / validReviews.length
    : 0

  // Kalite skoru: geçerli yorum oranı + ortalama uzunluk
  const validRatio = reviews.length > 0 ? validReviews.length / reviews.length : 0
  const lengthScore = Math.min(1, avgLength / 200) // 200 karakter = 1.0
  const qualityScore = (validRatio * 0.6 + lengthScore * 0.4) * 100

  return {
    validCount: validReviews.length,
    avgLength,
    qualityScore,
  }
}

/**
 * Place'leri kalite skoruna göre sırala
 */
export function sortPlacesByQuality<T extends {
  rating?: number | null
  reviewCount?: number | null
  reviews?: string[] | null
}>(
  places: T[]
): T[] {
  return [...places].sort((a, b) => {
    const aReviewCount = a.reviewCount || a.reviews?.length || 0
    const bReviewCount = b.reviewCount || b.reviews?.length || 0

    const aPopularity = calculatePopularityScore(aReviewCount, a.rating)
    const bPopularity = calculatePopularityScore(bReviewCount, b.rating)

    // Önce popülerlik skoruna göre
    if (aPopularity !== bPopularity) {
      return bPopularity - aPopularity
    }

    // Sonra yorum sayısına göre
    if (aReviewCount !== bReviewCount) {
      return bReviewCount - aReviewCount
    }

    // Son olarak rating'e göre
    const aRating = a.rating || 0
    const bRating = b.rating || 0
    if (aRating !== bRating) {
      return bRating - aRating
    }

    return 0
  })
}

/**
 * Place'leri filtrele ve sırala
 */
export function filterAndSortPlaces<T extends {
  name?: string | null
  address?: string | null
  lat?: number | null
  lng?: number | null
  rating?: number | null
  reviewCount?: number | null
  category?: string | null
  reviews?: string[] | null
}>(
  places: T[],
  criteria: QualityCriteria = DEFAULT_QUALITY_CRITERIA
): T[] {
  // 1. Kalite kontrolünden geçenleri filtrele
  const qualityChecked = places.map(place => ({
    place,
    check: checkPlaceQuality(place, criteria),
  }))

  // 2. Geçerli olanları al
  const validPlaces = qualityChecked
    .filter(({ check }) => check.isValid)
    .map(({ place }) => place)

  // 3. Kalite skoruna göre sırala
  return sortPlacesByQuality(validPlaces)
}



