/**
 * Basit Skorlama Sistemi
 * 
 * AI olmadan da çalışabilen, yorumlara dayalı basit skorlama mantığı
 * Yorum sayısına göre güvenilirlik faktörü ile skor ayarlama yapılır
 */

import { ReviewCategory } from '@/lib/types/review'
import { adjustScoreByReviewCount } from '@/lib/utils/score-adjustment'

interface Review {
  text: string
  rating?: number
}

interface SimpleScoreResult {
  score: number // 0-100
  why: string
  risks?: string
  reviewCategories: ReviewCategory[]
}

/**
 * Basit yorum analizi - AI olmadan
 */
export function analyzeReviewsSimple(
  reviews: Review[],
  category: string,
  companion: string
): SimpleScoreResult {
  if (!reviews || reviews.length === 0) {
    return {
      score: 50,
      why: 'Yorum verisi yetersiz',
      reviewCategories: [],
    }
  }

  // Yorumları kategorilere göre analiz et
  const categories = analyzeReviewCategories(reviews)
  
  // Genel skor hesapla
  const baseScore = calculateBaseScore(reviews, categories)
  
  // Kategori ve companion'a göre ayarla
  let adjustedScore = adjustScoreForContext(baseScore, categories, category, companion)
  
  // Yorum sayısına göre skoru ayarla (Bayesian Average)
  // Az yorumlu yerlerin skorunu düşür, çok yorumlu yerlerin skorunu koru
  adjustedScore = adjustScoreByReviewCount(
    adjustedScore,
    reviews.length,
    {
      method: 'bayesian',
      priorMean: 50, // Varsayılan ortalama
      confidenceConstant: 10, // Minimum 10 yorum güvenilir kabul edilir
    }
  )
  
  // Neden ve riskler
  const { why, risks } = generateExplanation(categories, adjustedScore, category, companion, reviews.length)

  return {
    score: Math.round(adjustedScore),
    why,
    risks: risks || undefined,
    reviewCategories: categories,
  }
}

/**
 * Yorumları kategorilere göre analiz et
 */
function analyzeReviewCategories(reviews: Review[]): ReviewCategory[] {
  const categoryKeywords: Record<string, string[]> = {
    servis: ['servis', 'personel', 'garson', 'müşteri hizmeti', 'ilgili', 'kibar', 'yardımcı', 'hizmet', 'çalışan'],
    fiyat: ['fiyat', 'ucuz', 'pahalı', 'değer', 'para', 'ücret', 'fiyat-performans', 'ekonomik', 'bütçe'],
    kalite: ['kalite', 'lezzetli', 'taze', 'iyi', 'kötü', 'mükemmel', 'harika', 'berbat', 'kaliteli', 'ürün'],
    ortam: ['ortam', 'atmosfer', 'ambiyans', 'dekor', 'müzik', 'sessiz', 'gürültülü', 'rahat', 'sıcak', 'soğuk'],
    lokasyon: ['lokasyon', 'konum', 'ulaşım', 'park', 'metro', 'otobüs', 'merkez', 'uzak', 'yakın', 'erişim'],
    temizlik: ['temiz', 'kirli', 'hijyen', 'düzen', 'bakımsız', 'steril', 'tozlu', 'pis'],
    hiz: ['hızlı', 'yavaş', 'bekleme', 'servis hızı', 'gecikme', 'anında', 'uzun sürdü'],
  }

  const categories: ReviewCategory[] = []

  for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
    const categoryReviews = reviews.filter(review => 
      keywords.some(keyword => 
        review.text.toLowerCase().includes(keyword.toLowerCase())
      )
    )

    if (categoryReviews.length === 0) continue

    // Pozitif/negatif analizi
    const positiveCount = categoryReviews.filter(review => {
      const text = review.text.toLowerCase()
      const positiveWords = ['iyi', 'güzel', 'harika', 'mükemmel', 'beğendim', 'tavsiye', 'başarılı', 'kaliteli', 'hızlı', 'temiz', 'ucuz', 'değer']
      const negativeWords = ['kötü', 'berbat', 'kötü', 'yavaş', 'pahalı', 'kirli', 'ilgisiz', 'kaba']
      
      const positiveScore = positiveWords.filter(word => text.includes(word)).length
      const negativeScore = negativeWords.filter(word => text.includes(word)).length
      
      return positiveScore > negativeScore || (review.rating && review.rating >= 4)
    }).length

    const negativeCount = categoryReviews.length - positiveCount
    const positiveRatio = positiveCount / categoryReviews.length

    // Skor hesapla (0-100)
    const score = Math.round(positiveRatio * 100)

    // Örnek yorumlar seç
    const positiveWords = ['iyi', 'güzel', 'harika', 'mükemmel', 'beğendim', 'tavsiye', 'başarılı', 'kaliteli', 'hızlı', 'temiz', 'ucuz', 'değer']
    const negativeWords = ['kötü', 'berbat', 'yavaş', 'pahalı', 'kirli', 'ilgisiz', 'kaba']

    const positiveExamples = categoryReviews
      .filter(review => {
        const text = review.text.toLowerCase()
        return positiveWords.some(word => text.includes(word)) || (review.rating && review.rating >= 4)
      })
      .slice(0, 2)
      .map(r => r.text)

    const negativeExamples = categoryReviews
      .filter(review => {
        const text = review.text.toLowerCase()
        return negativeWords.some(word => text.includes(word)) || (review.rating && review.rating <= 2)
      })
      .slice(0, 2)
      .map(r => r.text)

    categories.push({
      name: categoryName,
      score,
      positiveRatio,
      positiveExamples: positiveExamples.length > 0 ? positiveExamples : undefined,
      negativeExamples: negativeExamples.length > 0 ? negativeExamples : undefined,
    })
  }

  return categories
}

/**
 * Temel skor hesapla
 */
function calculateBaseScore(reviews: Review[], categories: ReviewCategory[]): number {
  // Rating varsa kullan
  const ratings = reviews.filter(r => r.rating).map(r => r.rating!)
  if (ratings.length > 0) {
    const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length
    return (avgRating / 5) * 100 // 5 yıldız = 100 puan
  }

  // Kategori skorlarının ortalaması
  if (categories.length > 0) {
    const avgCategoryScore = categories.reduce((sum, cat) => sum + cat.score, 0) / categories.length
    return avgCategoryScore
  }

  // Pozitif/negatif kelime analizi
  const positiveWords = ['iyi', 'güzel', 'harika', 'mükemmel', 'beğendim', 'tavsiye', 'başarılı']
  const negativeWords = ['kötü', 'berbat', 'yavaş', 'pahalı', 'kirli', 'ilgisiz']

  let positiveCount = 0
  let negativeCount = 0

  reviews.forEach(review => {
    const text = review.text.toLowerCase()
    const pos = positiveWords.filter(word => text.includes(word)).length
    const neg = negativeWords.filter(word => text.includes(word)).length
    
    if (pos > neg) positiveCount++
    else if (neg > pos) negativeCount++
  })

  if (positiveCount + negativeCount === 0) return 50

  const positiveRatio = positiveCount / (positiveCount + negativeCount)
  return positiveRatio * 100
}

/**
 * Kategori ve companion'a göre skoru ayarla
 */
function adjustScoreForContext(
  baseScore: number,
  categories: ReviewCategory[],
  category: string,
  companion: string
): number {
  let adjusted = baseScore

  // Kategori bazlı ayarlamalar
  const categoryAdjustments: Record<string, number> = {
    food: 0, // Yemek için özel ayar yok
    coffee: 0,
    bar: 0,
    haircut: 0,
    spa: 0,
    shopping: 0,
    entertainment: 0,
  }

  adjusted += categoryAdjustments[category] || 0

  // Companion bazlı ayarlamalar
  const companionAdjustments: Record<string, number> = {
    alone: 0,
    partner: 5, // Partner ile genelde daha yüksek beklenti
    friends: 0,
    family: 10, // Aile ile daha yüksek beklenti (temizlik, güvenlik)
    colleagues: -5, // İş arkadaşları ile daha düşük beklenti
  }

  adjusted += companionAdjustments[companion] || 0

  // Kategori skorlarına göre ayarla
  if (category === 'food' && categories.find(c => c.name === 'kalite')) {
    const kaliteScore = categories.find(c => c.name === 'kalite')!.score
    adjusted = (adjusted + kaliteScore) / 2
  }

  if (companion === 'family' && categories.find(c => c.name === 'temizlik')) {
    const temizlikScore = categories.find(c => c.name === 'temizlik')!.score
    adjusted = (adjusted * 0.7) + (temizlikScore * 0.3)
  }

  // Sınırları kontrol et
  return Math.max(0, Math.min(100, adjusted))
}

/**
 * Açıklama ve riskler üret
 */
function generateExplanation(
  categories: ReviewCategory[],
  score: number,
  category: string,
  companion: string,
  reviewCount: number = 0
): { why: string; risks?: string } {
  const topCategories = categories
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const lowCategories = categories
    .filter(c => c.score < 60)
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)

  // Neden uygun?
  const whyParts: string[] = []

  if (score >= 80) {
    whyParts.push('Genel olarak olumlu yorumlar alıyor')
  } else if (score >= 60) {
    whyParts.push('Çoğunlukla olumlu yorumlar var')
  } else {
    whyParts.push('Karışık yorumlar mevcut')
  }

  if (topCategories.length > 0) {
    const categoryNames: Record<string, string> = {
      servis: 'servis kalitesi',
      fiyat: 'fiyat-performans',
      kalite: 'ürün kalitesi',
      ortam: 'atmosfer',
      lokasyon: 'konum',
      temizlik: 'temizlik',
      hiz: 'servis hızı',
    }
    const topNames = topCategories.map(c => categoryNames[c.name] || c.name).join(', ')
    whyParts.push(`${topNames} konusunda olumlu değerlendirmeler var`)
  }

  // Riskler
  let risks: string | undefined

  if (lowCategories.length > 0) {
    const riskNames: Record<string, string> = {
      servis: 'servis kalitesi',
      fiyat: 'fiyat',
      kalite: 'kalite',
      ortam: 'ortam',
      lokasyon: 'konum',
      temizlik: 'temizlik',
      hiz: 'servis hızı',
    }
    const riskList = lowCategories.map(c => riskNames[c.name] || c.name).join(', ')
    risks = `${riskList} konusunda bazı olumsuz yorumlar var`
  }

  if (score < 60) {
    risks = risks 
      ? `${risks}. Genel olarak karışık değerlendirmeler mevcut`
      : 'Genel olarak karışık değerlendirmeler mevcut'
  }

  // Yorum sayısı azsa risk ekle
  if (reviewCount < 10) {
    risks = risks 
      ? `${risks}. Yorum sayısı az olduğu için değerlendirme sınırlı (${reviewCount} yorum)`
      : `Yorum sayısı az olduğu için değerlendirme sınırlı (${reviewCount} yorum). Daha fazla bilgi için yorumları kontrol etmenizi öneririz.`
  }

  return {
    why: whyParts.join('. ') + '.',
    risks,
  }
}

