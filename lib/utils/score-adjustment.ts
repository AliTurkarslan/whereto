/**
 * Score Adjustment Utilities
 * 
 * Yorum sayısına göre skor ayarlama ve güvenilirlik faktörü
 * Az yorumlu yerlerin yüksek skorlarını düşürür, çok yorumlu yerlerin skorlarını korur
 */

/**
 * Bayesian Average ile skor ayarlama
 * 
 * Az yorumlu yerlerin skorunu düşürür, çok yorumlu yerlerin skorunu korur
 * 
 * @param score Mevcut skor (0-100)
 * @param reviewCount Yorum sayısı
 * @param priorMean Prior ortalama (genellikle 50 veya ortalama rating)
 * @param confidenceConstant Güven sabiti (minimum yorum sayısı, örn. 10)
 * @returns Ayarlanmış skor (0-100)
 */
export function adjustScoreWithBayesianAverage(
  score: number,
  reviewCount: number,
  priorMean: number = 50,
  confidenceConstant: number = 10
): number {
  if (reviewCount <= 0) {
    // Yorum yoksa, prior mean'e yakın bir değer döndür
    return priorMean
  }

  // Bayesian Average: (C * m + n * score) / (C + n)
  // C = confidence constant (minimum yorum sayısı)
  // m = prior mean (genellikle 50)
  // n = yorum sayısı
  // score = mevcut skor
  
  const adjustedScore = (confidenceConstant * priorMean + reviewCount * score) / (confidenceConstant + reviewCount)
  
  return Math.round(Math.max(0, Math.min(100, adjustedScore)))
}

/**
 * Yorum sayısına göre güvenilirlik faktörü (0-1)
 * 
 * @param reviewCount Yorum sayısı
 * @param minReviews Minimum yorum sayısı (default: 10)
 * @param maxReviews Maksimum yorum sayısı (default: 100)
 * @returns Güvenilirlik faktörü (0-1)
 */
export function getConfidenceFactor(
  reviewCount: number,
  minReviews: number = 10,
  maxReviews: number = 100
): number {
  if (reviewCount <= 0) return 0
  if (reviewCount >= maxReviews) return 1
  
  // Logaritmik ölçek: İlk 10 yorum çok önemli, sonrası daha az
  const normalized = Math.log10(reviewCount + 1) / Math.log10(maxReviews + 1)
  return Math.min(1, Math.max(0, normalized))
}

/**
 * Skor ayarlama - Yorum sayısına göre
 * 
 * @param score Mevcut skor (0-100)
 * @param reviewCount Yorum sayısı
 * @param options Ayarlama seçenekleri
 * @returns Ayarlanmış skor (0-100)
 */
export function adjustScoreByReviewCount(
  score: number,
  reviewCount: number,
  options: {
    method?: 'bayesian' | 'confidence'
    priorMean?: number
    confidenceConstant?: number
    minReviews?: number
    maxReviews?: number
  } = {}
): number {
  const {
    method = 'bayesian',
    priorMean = 50,
    confidenceConstant = 10,
    minReviews = 10,
    maxReviews = 100,
  } = options

  if (method === 'bayesian') {
    return adjustScoreWithBayesianAverage(score, reviewCount, priorMean, confidenceConstant)
  } else {
    // Confidence factor yöntemi
    const confidence = getConfidenceFactor(reviewCount, minReviews, maxReviews)
    // Güvenilirlik faktörü ile skoru ayarla
    // Az yorumlu yerlerin skorunu düşür
    const adjustedScore = score * confidence + priorMean * (1 - confidence)
    return Math.round(Math.max(0, Math.min(100, adjustedScore)))
  }
}

/**
 * Minimum yorum sayısı kontrolü
 * 
 * @param reviewCount Yorum sayısı
 * @param minReviews Minimum yorum sayısı (default: 5)
 * @returns Yeterli yorum var mı?
 */
export function hasMinimumReviews(reviewCount: number, minReviews: number = 5): boolean {
  return reviewCount >= minReviews
}

/**
 * Sıralama için skor hesaplama (yorum sayısı dahil)
 * 
 * @param score Mevcut skor (0-100)
 * @param reviewCount Yorum sayısı
 * @param rating Rating (1-5)
 * @returns Sıralama skoru (yorum sayısı dahil)
 */
export function calculateSortingScore(
  score: number,
  reviewCount: number,
  rating?: number
): number {
  // Önce yorum sayısına göre skoru ayarla
  // priorMean sabit 50 olmalı (rating'e göre değil), böylece az yorumlu yerlerin skorları düşer
  const adjustedScore = adjustScoreByReviewCount(score, reviewCount, {
    method: 'bayesian',
    priorMean: 50, // Sabit prior mean - rating'e göre değil!
    confidenceConstant: 10,
  })

  // Yorum sayısı bonusu (çok yorumlu yerler için küçük bonus)
  // 100+ yorum için +5 puan bonus
  const reviewBonus = Math.min(5, Math.floor(reviewCount / 20))
  
  return adjustedScore + reviewBonus
}

