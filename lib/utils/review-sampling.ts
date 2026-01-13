/**
 * Akıllı Yorum Örnekleme Sistemi
 * 
 * 10 bin yorum varsa, bunların hepsini analiz etmek yerine
 * temsili bir örnekleme yaparak verimliliği artırır.
 * 
 * Stratejiler:
 * 1. Stratified Sampling: Rating'e göre örnekleme
 * 2. Zaman Bazlı Önceliklendirme: Son yorumlar öncelikli
 * 3. Uzunluk Bazlı Önceliklendirme: Daha uzun yorumlar daha detaylı
 */

export interface Review {
  text: string
  rating?: number | null
  date?: Date | number | null
  author?: string | null
}

export interface SamplingOptions {
  /** Hedef örnekleme sayısı (varsayılan: otomatik hesaplanır) */
  targetCount?: number
  /** Minimum örnekleme sayısı (varsayılan: 50) */
  minCount?: number
  /** Maksimum örnekleme sayısı (varsayılan: 200) */
  maxCount?: number
  /** Rating dağılımı (varsayılan: dengeli) */
  ratingDistribution?: {
    [rating: number]: number // Rating -> yüzde (örn: {5: 0.3, 4: 0.3, 3: 0.2, 2: 0.1, 1: 0.1})
  }
  /** Dinamik örnekleme kullan (varsayılan: true) */
  useDynamicSampling?: boolean
}

/**
 * Toplam yorum sayısına göre optimal örnekleme sayısını hesapla
 * 
 * Mantık:
 * - 50 yorum veya az: Tümünü al
 * - 50-200 yorum: %50-100 örnekleme
 * - 200-1000 yorum: %20-30 örnekleme
 * - 1000+ yorum: %10-20 örnekleme (maksimum 200)
 */
export function calculateOptimalSampleSize(totalReviews: number): number {
  if (totalReviews <= 50) {
    // Çok az yorum varsa, hepsini al
    return totalReviews
  }
  
  if (totalReviews <= 200) {
    // Orta seviye: %50-100 örnekleme
    return Math.max(50, Math.floor(totalReviews * 0.5))
  }
  
  if (totalReviews <= 500) {
    // 200-500 yorum: %20-30 örnekleme (100-150 yorum)
    return Math.max(50, Math.min(150, Math.floor(totalReviews * 0.25)))
  }
  
  if (totalReviews <= 1000) {
    // 500-1000 yorum: %15-20 örnekleme (75-200 yorum)
    return Math.max(75, Math.min(200, Math.floor(totalReviews * 0.15)))
  }
  
  // 1000+ yorum: %10-15 örnekleme (maksimum 200)
  return Math.min(200, Math.max(100, Math.floor(totalReviews * 0.1)))
}

const DEFAULT_RATING_DISTRIBUTION = {
  5: 0.3, // %30
  4: 0.3, // %30
  3: 0.2, // %20
  2: 0.1, // %10
  1: 0.1, // %10
}

/**
 * Yorumları rating'e göre grupla
 */
function groupByRating(reviews: Review[]): Map<number, Review[]> {
  const grouped = new Map<number, Review[]>()
  
  for (const review of reviews) {
    const rating = review.rating || 3 // Rating yoksa 3 olarak varsay
    const roundedRating = Math.round(rating)
    const clampedRating = Math.max(1, Math.min(5, roundedRating))
    
    if (!grouped.has(clampedRating)) {
      grouped.set(clampedRating, [])
    }
    grouped.get(clampedRating)!.push(review)
  }
  
  return grouped
}

/**
 * Yorumları tarihe göre sırala (en yeni önce)
 */
function sortByDate(reviews: Review[]): Review[] {
  return [...reviews].sort((a, b) => {
    const dateA = a.date ? (typeof a.date === 'number' ? a.date : a.date.getTime()) : 0
    const dateB = b.date ? (typeof b.date === 'number' ? b.date : b.date.getTime()) : 0
    return dateB - dateA // En yeni önce
  })
}

/**
 * Yorumları uzunluğa göre sırala (en uzun önce)
 */
function sortByLength(reviews: Review[]): Review[] {
  return [...reviews].sort((a, b) => b.text.length - a.text.length)
}

/**
 * Bir rating grubundan örnekleme yap
 */
function sampleFromGroup(
  reviews: Review[],
  targetCount: number,
  prioritizeRecent: boolean = true,
  prioritizeLong: boolean = true
): Review[] {
  if (reviews.length <= targetCount) {
    return reviews
  }
  
  // Tarihe göre sırala
  const sortedByDate = prioritizeRecent ? sortByDate(reviews) : reviews
  
  // Uzunluğa göre sırala
  const sortedByLength = prioritizeLong ? sortByLength(reviews) : reviews
  
  // Kombine skor hesapla (tarih + uzunluk)
  const scored = reviews.map(review => {
    const dateIndex = sortedByDate.findIndex(r => r.text === review.text)
    const lengthIndex = sortedByLength.findIndex(r => r.text === review.text)
    
    // Tarih skoru: En yeni = yüksek skor
    const dateScore = dateIndex >= 0 ? (reviews.length - dateIndex) / reviews.length : 0.5
    
    // Uzunluk skoru: En uzun = yüksek skor
    const lengthScore = lengthIndex >= 0 ? (reviews.length - lengthIndex) / reviews.length : 0.5
    
    // Kombine skor (tarih %60, uzunluk %40)
    const combinedScore = dateScore * 0.6 + lengthScore * 0.4
    
    return {
      review,
      score: combinedScore,
    }
  })
  
  // Skora göre sırala ve ilk targetCount kadarını al
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, targetCount).map(item => item.review)
}

/**
 * Yorumları akıllı örnekleme ile seç
 * 
 * @param reviews Tüm yorumlar
 * @param options Örnekleme seçenekleri
 * @returns Örneklenmiş yorumlar
 */
export function sampleReviews(
  reviews: Review[],
  options: SamplingOptions = {}
): Review[] {
  const {
    useDynamicSampling = true,
    minCount = 50,
    maxCount = 200,
    ratingDistribution = DEFAULT_RATING_DISTRIBUTION,
  } = options
  
  // Dinamik örnekleme kullanılıyorsa, optimal sayıyı hesapla
  const targetCount = options.targetCount ?? (
    useDynamicSampling 
      ? calculateOptimalSampleSize(reviews.length)
      : 100
  )
  
  // Yorum sayısı azsa, hepsini döndür
  if (reviews.length <= minCount) {
    return reviews
  }
  
  // Rating'e göre grupla
  const groupedByRating = groupByRating(reviews)
  
  // Her rating grubu için hedef sayıyı hesapla
  const samples: Review[] = []
  
  for (const [rating, percentage] of Object.entries(ratingDistribution)) {
    const ratingNum = parseInt(rating, 10)
    const group = groupedByRating.get(ratingNum) || []
    
    if (group.length === 0) continue
    
    // Bu rating grubundan kaç yorum alınacak
    const groupTarget = Math.ceil(targetCount * percentage)
    
    // Gruptan örnekleme yap
    const groupSamples = sampleFromGroup(group, groupTarget)
    samples.push(...groupSamples)
  }
  
  // Eğer rating dağılımı yoksa, rastgele örnekleme yap
  if (samples.length === 0) {
    // Tarih ve uzunluk bazlı önceliklendirme ile örnekle
    const sorted = sortByDate(reviews)
    const longSorted = sortByLength(reviews)
    
    // İlk %50'sini tarih bazlı, sonra uzunluk bazlı al
    const recentCount = Math.floor(targetCount * 0.5)
    const longCount = targetCount - recentCount
    
    const recentSamples = sorted.slice(0, recentCount)
    const longSamples = longSorted
      .filter(r => !recentSamples.some(rs => rs.text === r.text))
      .slice(0, longCount)
    
    samples.push(...recentSamples, ...longSamples)
  }
  
  // Hedef sayıya göre ayarla
  let finalSamples = samples
  
  if (finalSamples.length < minCount && reviews.length >= minCount) {
    // Eksikse, rastgele ekle
    const remaining = reviews.filter(r => !finalSamples.some(s => s.text === r.text))
    const needed = minCount - finalSamples.length
    finalSamples = [...finalSamples, ...remaining.slice(0, needed)]
  }
  
  if (finalSamples.length > maxCount) {
    // Fazlaysa, en önemlilerini al
    finalSamples = finalSamples.slice(0, maxCount)
  }
  
  // Duplicate'leri temizle
  const uniqueSamples = Array.from(
    new Map(finalSamples.map(r => [r.text, r])).values()
  )
  
  return uniqueSamples
}

/**
 * Örnekleme istatistikleri
 */
export interface SamplingStats {
  totalReviews: number
  sampledReviews: number
  samplingRate: number
  ratingDistribution: {
    [rating: number]: {
      total: number
      sampled: number
      rate: number
    }
  }
}

/**
 * Örnekleme istatistiklerini hesapla
 */
export function getSamplingStats(
  allReviews: Review[],
  sampledReviews: Review[]
): SamplingStats {
  const allGrouped = groupByRating(allReviews)
  const sampledGrouped = groupByRating(sampledReviews)
  
  const ratingDistribution: SamplingStats['ratingDistribution'] = {}
  
  for (let rating = 1; rating <= 5; rating++) {
    const all = allGrouped.get(rating) || []
    const sampled = sampledGrouped.get(rating) || []
    
    ratingDistribution[rating] = {
      total: all.length,
      sampled: sampled.length,
      rate: all.length > 0 ? sampled.length / all.length : 0,
    }
  }
  
  return {
    totalReviews: allReviews.length,
    sampledReviews: sampledReviews.length,
    samplingRate: allReviews.length > 0 ? sampledReviews.length / allReviews.length : 0,
    ratingDistribution,
  }
}

