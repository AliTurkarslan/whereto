/**
 * Fiyat Bilgisi Çıkarma ve Analiz
 * 
 * Yorumlardan fiyat bilgisi çıkarma ve kategorize etme
 */

export interface ExtractedPrice {
  item: string // "çay", "kahve", "dürüm", "pizza", vb.
  price: number // Fiyat (TL)
  currency: string // "TL", "USD", vb.
  confidence: number // 0-1 (güven skoru)
  source: string // Yorum metni
}

export interface PriceInfo {
  priceLevel: 0 | 1 | 2 | 3 | 4 // Google Maps price level
  extractedPrices: ExtractedPrice[] // Yorumlardan çıkarılan fiyatlar
  averagePrices: {
    category: string
    minPrice: number
    maxPrice: number
    averagePrice: number
    currency: string
    sampleCount: number
  }[]
  estimatedAverageSpending?: {
    min: number
    max: number
    currency: string
  }
}

/**
 * Yorumlardan fiyat bilgisi çıkar (basit regex)
 */
export function extractPricesFromReviews(reviews: string[]): ExtractedPrice[] {
  const extracted: ExtractedPrice[] = []
  const seen = new Set<string>()

  // Fiyat pattern'leri
  const pricePatterns = [
    // "çay 15 TL", "kahve 25 TL"
    /(\w+)\s+(\d+(?:[.,]\d+)?)\s*(?:TL|tl|₺|lira)/gi,
    // "15 TL çay", "25 TL kahve"
    /(\d+(?:[.,]\d+)?)\s*(?:TL|tl|₺|lira)\s+(\w+)/gi,
    // "çay: 15 TL", "kahve: 25 TL"
    /(\w+):\s*(\d+(?:[.,]\d+)?)\s*(?:TL|tl|₺|lira)/gi,
    // "15₺ çay", "25₺ kahve"
    /(\d+(?:[.,]\d+)?)₺\s+(\w+)/gi,
  ]

  for (const review of reviews) {
    for (const pattern of pricePatterns) {
      const matches = review.matchAll(pattern)
      for (const match of matches) {
        const item = match[1]?.toLowerCase().trim()
        const priceStr = match[2]?.replace(',', '.')
        const price = parseFloat(priceStr || '0')

        if (item && price > 0 && price < 10000) {
          // Duplicate kontrolü
          const key = `${item}-${price}`
          if (!seen.has(key)) {
            seen.add(key)
            extracted.push({
              item,
              price,
              currency: 'TL',
              confidence: 0.7, // Regex ile çıkarıldığı için orta güven
              source: review.substring(0, 100), // İlk 100 karakter
            })
          }
        }
      }
    }
  }

  return extracted
}

/**
 * Fiyat bilgilerini kategorize et ve ortalama hesapla
 */
export function categorizePrices(
  extractedPrices: ExtractedPrice[],
  priceLevel: 0 | 1 | 2 | 3 | 4
): PriceInfo['averagePrices'] {
  // Kategori mapping (Türkçe)
  const categoryMapping: Record<string, string> = {
    çay: 'çay',
    kahve: 'kahve',
    coffee: 'kahve',
    espresso: 'kahve',
    latte: 'kahve',
    cappuccino: 'kahve',
    americano: 'kahve',
    dürüm: 'dürüm',
    döner: 'döner',
    kebap: 'kebap',
    pizza: 'pizza',
    hamburger: 'hamburger',
    burger: 'hamburger',
    lahmacun: 'lahmacun',
    pide: 'pide',
    köfte: 'köfte',
    çorba: 'çorba',
    salata: 'salata',
    meze: 'meze',
    tatlı: 'tatlı',
    baklava: 'tatlı',
    su: 'su',
    meşrubat: 'meşrubat',
    kola: 'meşrubat',
    bira: 'bira',
    şarap: 'şarap',
    rakı: 'rakı',
  }

  // Fiyatları kategorilere göre grupla
  const categorized = new Map<string, number[]>()

  for (const price of extractedPrices) {
    const category = categoryMapping[price.item] || price.item
    if (!categorized.has(category)) {
      categorized.set(category, [])
    }
    categorized.get(category)!.push(price.price)
  }

  // Her kategori için ortalama hesapla
  const averagePrices: PriceInfo['averagePrices'] = []

  for (const [category, prices] of categorized.entries()) {
    if (prices.length > 0) {
      const sorted = [...prices].sort((a, b) => a - b)
      const min = sorted[0]
      const max = sorted[sorted.length - 1]
      const average = prices.reduce((sum, p) => sum + p, 0) / prices.length

      averagePrices.push({
        category,
        minPrice: min,
        maxPrice: max,
        averagePrice: Math.round(average),
        currency: 'TL',
        sampleCount: prices.length,
      })
    }
  }

  return averagePrices
}

/**
 * Price level'a göre tahmini ortalama harcama
 */
export function estimateAverageSpending(
  priceLevel: 0 | 1 | 2 | 3 | 4,
  category: string
): { min: number; max: number; currency: string } | undefined {
  // Kategori bazlı ortalama harcama tahminleri (TL)
  const estimates: Record<string, Record<number, { min: number; max: number }>> = {
    restaurant: {
      1: { min: 50, max: 150 }, // INEXPENSIVE
      2: { min: 150, max: 300 }, // MODERATE
      3: { min: 300, max: 500 }, // EXPENSIVE
      4: { min: 500, max: 1000 }, // VERY_EXPENSIVE
    },
    cafe: {
      1: { min: 20, max: 50 }, // INEXPENSIVE
      2: { min: 50, max: 100 }, // MODERATE
      3: { min: 100, max: 200 }, // EXPENSIVE
      4: { min: 200, max: 400 }, // VERY_EXPENSIVE
    },
    bar: {
      1: { min: 50, max: 150 }, // INEXPENSIVE
      2: { min: 150, max: 300 }, // MODERATE
      3: { min: 300, max: 500 }, // EXPENSIVE
      4: { min: 500, max: 1000 }, // VERY_EXPENSIVE
    },
  }

  const categoryEstimate = estimates[category]?.[priceLevel]
  if (categoryEstimate) {
    return {
      ...categoryEstimate,
      currency: 'TL',
    }
  }

  return undefined
}

/**
 * Tam fiyat bilgisi oluştur
 */
export function buildPriceInfo(
  priceLevel: 0 | 1 | 2 | 3 | 4,
  reviews: string[],
  category: string
): PriceInfo {
  // Yorumlardan fiyat çıkar
  const extractedPrices = extractPricesFromReviews(reviews)

  // Kategorize et ve ortalama hesapla
  const averagePrices = categorizePrices(extractedPrices, priceLevel)

  // Tahmini ortalama harcama
  const estimatedAverageSpending = estimateAverageSpending(priceLevel, category)

  return {
    priceLevel,
    extractedPrices,
    averagePrices,
    estimatedAverageSpending,
  }
}



