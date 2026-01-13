/**
 * Yemek Kültürü/Kategori Tespiti
 * 
 * Place'lerin hangi kültürde olduğunu tespit etme
 */

export interface CuisineInfo {
  primaryCuisine?: string // "turkish", "italian", "chinese", vb.
  secondaryCuisines?: string[] // Birden fazla kültür olabilir
  confidence: number // 0-1 (güven skoru)
  source: 'name' | 'description' | 'reviews' | 'types' | 'mixed'
}

/**
 * Kültür keyword'leri (Türkçe ve İngilizce)
 */
const CUISINE_KEYWORDS: Record<string, string[]> = {
  turkish: [
    'türk', 'turkish', 'kebap', 'kebab', 'döner', 'doner', 'lahmacun',
    'pide', 'köfte', 'kofte', 'çorba', 'corba', 'baklava', 'türk mutfağı',
    'turkish cuisine', 'anadolu', 'osmanlı', 'ottoman',
  ],
  italian: [
    'italyan', 'italian', 'pizza', 'pasta', 'risotto', 'tiramisu',
    'gelato', 'espresso', 'cappuccino', 'italian cuisine',
  ],
  chinese: [
    'çin', 'chinese', 'wok', 'noodle', 'dumpling', 'sushi', 'ramen',
    'chinese cuisine', 'peking', 'cantonese',
  ],
  japanese: [
    'japon', 'japanese', 'sushi', 'sashimi', 'ramen', 'tempura',
    'japanese cuisine', 'tokyo', 'osaka',
  ],
  mexican: [
    'meksika', 'mexican', 'taco', 'burrito', 'quesadilla', 'nachos',
    'mexican cuisine', 'tex-mex',
  ],
  french: [
    'fransız', 'french', 'bistro', 'brasserie', 'croissant', 'baguette',
    'french cuisine', 'paris',
  ],
  indian: [
    'hint', 'indian', 'curry', 'tandoori', 'naan', 'biryani',
    'indian cuisine', 'mumbai', 'delhi',
  ],
  thai: [
    'tayland', 'thai', 'pad thai', 'tom yum', 'green curry',
    'thai cuisine', 'bangkok',
  ],
  greek: [
    'yunan', 'greek', 'gyro', 'souvlaki', 'moussaka', 'tzatziki',
    'greek cuisine', 'athens',
  ],
  lebanese: [
    'lübnan', 'lebanese', 'hummus', 'falafel', 'shawarma', 'mezze',
    'lebanese cuisine', 'beirut',
  ],
  american: [
    'amerikan', 'american', 'burger', 'hamburger', 'bbq', 'barbecue',
    'american cuisine', 'steakhouse',
  ],
  mediterranean: [
    'akdeniz', 'mediterranean', 'mezze', 'olive', 'zeytin',
    'mediterranean cuisine',
  ],
}

/**
 * İsimden kültür tespiti
 */
export function detectCuisineFromName(name: string): CuisineInfo | null {
  const lowerName = name.toLowerCase()
  const matches: Array<{ cuisine: string; confidence: number }> = []

  for (const [cuisine, keywords] of Object.entries(CUISINE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword.toLowerCase())) {
        matches.push({
          cuisine,
          confidence: keyword.length > 5 ? 0.8 : 0.6, // Uzun keyword'ler daha güvenilir
        })
        break // Bir keyword bulundu, diğerlerine bakma
      }
    }
  }

  if (matches.length === 0) return null

  // En yüksek confidence'lı olanı seç
  matches.sort((a, b) => b.confidence - a.confidence)
  const primary = matches[0]

  return {
    primaryCuisine: primary.cuisine,
    secondaryCuisines: matches.slice(1).map(m => m.cuisine),
    confidence: primary.confidence,
    source: 'name',
  }
}

/**
 * Açıklamadan kültür tespiti
 */
export function detectCuisineFromDescription(description: string): CuisineInfo | null {
  const lowerDesc = description.toLowerCase()
  const matches: Array<{ cuisine: string; confidence: number }> = []

  for (const [cuisine, keywords] of Object.entries(CUISINE_KEYWORDS)) {
    let matchCount = 0
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        matchCount++
      }
    }
    if (matchCount > 0) {
      matches.push({
        cuisine,
        confidence: Math.min(0.9, 0.5 + matchCount * 0.1), // Birden fazla keyword = daha yüksek güven
      })
    }
  }

  if (matches.length === 0) return null

  matches.sort((a, b) => b.confidence - a.confidence)
  const primary = matches[0]

  return {
    primaryCuisine: primary.cuisine,
    secondaryCuisines: matches.slice(1).map(m => m.cuisine),
    confidence: primary.confidence,
    source: 'description',
  }
}

/**
 * Types array'den kültür tespiti
 */
export function detectCuisineFromTypes(types: string[]): CuisineInfo | null {
  // Google Maps types'da spesifik kültür bilgisi yok
  // Ama bazı pattern'ler var
  const lowerTypes = types.map(t => t.toLowerCase())
  
  // Özel type'lar (Google Maps'te olabilir)
  const typeMapping: Record<string, string> = {
    'italian_restaurant': 'italian',
    'chinese_restaurant': 'chinese',
    'japanese_restaurant': 'japanese',
    'mexican_restaurant': 'mexican',
    'indian_restaurant': 'indian',
    'thai_restaurant': 'thai',
    'greek_restaurant': 'greek',
    'lebanese_restaurant': 'lebanese',
  }

  for (const type of lowerTypes) {
    const cuisine = typeMapping[type]
    if (cuisine) {
      return {
        primaryCuisine: cuisine,
        confidence: 0.7,
        source: 'types',
      }
    }
  }

  return null
}

/**
 * Yorumlardan kültür tespiti (basit keyword matching)
 */
export function detectCuisineFromReviews(reviews: string[]): CuisineInfo | null {
  const allText = reviews.join(' ').toLowerCase()
  const matches: Array<{ cuisine: string; count: number }> = []

  for (const [cuisine, keywords] of Object.entries(CUISINE_KEYWORDS)) {
    let count = 0
    for (const keyword of keywords) {
      const regex = new RegExp(keyword.toLowerCase(), 'gi')
      const matches = allText.match(regex)
      if (matches) {
        count += matches.length
      }
    }
    if (count > 0) {
      matches.push({ cuisine, count })
    }
  }

  if (matches.length === 0) return null

  matches.sort((a, b) => b.count - a.count)
  const primary = matches[0]

  return {
    primaryCuisine: primary.cuisine,
    secondaryCuisines: matches.slice(1).map(m => m.cuisine),
    confidence: Math.min(0.9, 0.5 + primary.count * 0.1),
    source: 'reviews',
  }
}

/**
 * Hybrid kültür tespiti (tüm kaynakları birleştir)
 */
export function detectCuisine(
  name: string,
  description?: string,
  types?: string[],
  reviews?: string[]
): CuisineInfo | null {
  const results: CuisineInfo[] = []

  // 1. İsimden
  const nameResult = detectCuisineFromName(name)
  if (nameResult) results.push(nameResult)

  // 2. Açıklamadan
  if (description) {
    const descResult = detectCuisineFromDescription(description)
    if (descResult) results.push(descResult)
  }

  // 3. Types'dan
  if (types) {
    const typesResult = detectCuisineFromTypes(types)
    if (typesResult) results.push(typesResult)
  }

  // 4. Yorumlardan
  if (reviews && reviews.length > 0) {
    const reviewsResult = detectCuisineFromReviews(reviews)
    if (reviewsResult) results.push(reviewsResult)
  }

  if (results.length === 0) return null

  // Tüm sonuçları birleştir
  const cuisineCounts = new Map<string, { count: number; totalConfidence: number }>()

  for (const result of results) {
    if (result.primaryCuisine) {
      const existing = cuisineCounts.get(result.primaryCuisine)
      if (existing) {
        existing.count++
        existing.totalConfidence += result.confidence
      } else {
        cuisineCounts.set(result.primaryCuisine, {
          count: 1,
          totalConfidence: result.confidence,
        })
      }
    }
  }

  // En çok geçen ve en yüksek confidence'lı olanı seç
  let bestCuisine: string | null = null
  let bestScore = 0

  for (const [cuisine, data] of cuisineCounts.entries()) {
    const score = data.count * 0.5 + (data.totalConfidence / data.count) * 0.5
    if (score > bestScore) {
      bestScore = score
      bestCuisine = cuisine
    }
  }

  if (!bestCuisine) return null

  const primaryData = cuisineCounts.get(bestCuisine)!
  const avgConfidence = primaryData.totalConfidence / primaryData.count

  return {
    primaryCuisine: bestCuisine,
    secondaryCuisines: Array.from(cuisineCounts.keys()).filter(c => c !== bestCuisine),
    confidence: Math.min(0.95, avgConfidence + (primaryData.count - 1) * 0.1), // Birden fazla kaynak = daha yüksek güven
    source: 'mixed',
  }
}



