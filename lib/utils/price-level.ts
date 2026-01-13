/**
 * Price Level Utilities
 * 
 * Google Places API price level helper functions
 * Price levels: FREE (0), INEXPENSIVE (1), MODERATE (2), EXPENSIVE (3), VERY_EXPENSIVE (4)
 */

export type PriceLevel = 0 | 1 | 2 | 3 | 4 | 'FREE' | 'INEXPENSIVE' | 'MODERATE' | 'EXPENSIVE' | 'VERY_EXPENSIVE'

/**
 * Convert price level string to number
 */
export function parsePriceLevel(priceLevel: string | number | undefined): number | undefined {
  if (priceLevel === undefined || priceLevel === null) return undefined
  
  if (typeof priceLevel === 'number') {
    return priceLevel >= 0 && priceLevel <= 4 ? priceLevel : undefined
  }
  
  const levelMap: Record<string, number> = {
    'FREE': 0,
    'INEXPENSIVE': 1,
    'MODERATE': 2,
    'EXPENSIVE': 3,
    'VERY_EXPENSIVE': 4,
  }
  
  return levelMap[priceLevel.toUpperCase()] ?? undefined
}

/**
 * Get price level display text (Turkish)
 */
export function getPriceLevelText(priceLevel: PriceLevel | undefined, locale: 'tr' | 'en' = 'tr'): string {
  const level = parsePriceLevel(priceLevel)
  if (level === undefined) return ''
  
  if (locale === 'tr') {
    const texts = ['Ücretsiz', 'Ucuz', 'Orta', 'Pahalı', 'Çok Pahalı']
    return texts[level] || ''
  } else {
    const texts = ['Free', 'Inexpensive', 'Moderate', 'Expensive', 'Very Expensive']
    return texts[level] || ''
  }
}

/**
 * Get price level description (Turkish)
 */
export function getPriceLevelDescription(priceLevel: PriceLevel | undefined, locale: 'tr' | 'en' = 'tr'): string {
  const level = parsePriceLevel(priceLevel)
  if (level === undefined) return ''
  
  if (locale === 'tr') {
    const descriptions = [
      'Ücretsiz - Hiçbir ücret alınmaz',
      'Ucuz - Bütçe dostu fiyatlar',
      'Orta - Makul fiyat seviyesi',
      'Pahalı - Yüksek fiyat seviyesi',
      'Çok Pahalı - Premium fiyat seviyesi'
    ]
    return descriptions[level] || ''
  } else {
    const descriptions = [
      'Free - No charge',
      'Inexpensive - Budget-friendly prices',
      'Moderate - Reasonable price level',
      'Expensive - High price level',
      'Very Expensive - Premium price level'
    ]
    return descriptions[level] || ''
  }
}

/**
 * Get price level color class (Tailwind)
 */
export function getPriceLevelColor(priceLevel: PriceLevel | undefined): string {
  const level = parsePriceLevel(priceLevel)
  if (level === undefined) return 'text-muted-foreground'
  
  const colors = [
    'text-green-600 dark:text-green-400', // FREE
    'text-blue-600 dark:text-blue-400',    // INEXPENSIVE
    'text-yellow-600 dark:text-yellow-400', // MODERATE
    'text-orange-600 dark:text-orange-400', // EXPENSIVE
    'text-red-600 dark:text-red-400',      // VERY_EXPENSIVE
  ]
  
  return colors[level] || 'text-muted-foreground'
}

/**
 * Get price level badge color class (Tailwind)
 */
export function getPriceLevelBadgeColor(priceLevel: PriceLevel | undefined): string {
  const level = parsePriceLevel(priceLevel)
  if (level === undefined) return 'bg-muted text-muted-foreground'
  
  const colors = [
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', // FREE
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',    // INEXPENSIVE
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', // MODERATE
    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', // EXPENSIVE
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',      // VERY_EXPENSIVE
  ]
  
  return colors[level] || 'bg-muted text-muted-foreground'
}

/**
 * Get price level icon (dollar signs) - Google Maps style
 * 0 = $, 1 = $$, 2 = $$$, 3 = $$$$, 4 = $$$$$
 */
export function getPriceLevelIcon(priceLevel: PriceLevel | undefined): string {
  const level = parsePriceLevel(priceLevel)
  if (level === undefined) return ''
  
  return '$'.repeat(level + 1)
}

/**
 * Get price level display (Google Maps style - just dollar signs)
 * Returns: $, $$, $$$, $$$$, $$$$$
 */
export function getPriceLevelDisplay(priceLevel: PriceLevel | undefined): string {
  return getPriceLevelIcon(priceLevel)
}

