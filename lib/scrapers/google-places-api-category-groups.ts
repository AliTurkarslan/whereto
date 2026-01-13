/**
 * Google Maps Ana Kategori Grupları ile Arama
 * 
 * Google Maps UI'da görünen ana kategorileri kullanarak arama yapar
 * Örneğin "Restoranlar" seçildiğinde, restaurant, cafe, bar, bakery, vb. tüm alt tipleri arar
 */

import { searchPlacesComprehensive, searchNearby } from './google-places-api'
import { PlaceData } from './google-maps'
import { 
  GOOGLE_MAPS_CATEGORY_GROUPS, 
  getPlaceTypesForCategoryGroup,
  getSearchQueryForCategoryGroup 
} from '../config/google-maps-category-groups'
import { logger } from '../logging/logger'

/**
 * Ana kategori grubuna göre mekanları ara
 * 
 * @param categoryGroupId - Ana kategori ID (restaurants, hotels, things_to_do, vb.)
 * @param location - Arama konumu
 * @param apiKey - Google Places API key
 * @param maxResults - Maksimum sonuç sayısı
 * @returns Bulunan mekanlar
 */
export async function searchPlacesByCategoryGroup(
  categoryGroupId: string,
  location: { lat: number; lng: number },
  apiKey: string,
  maxResults: number = 100
): Promise<PlaceData[]> {
  const categoryGroup = GOOGLE_MAPS_CATEGORY_GROUPS[categoryGroupId]
  
  if (!categoryGroup) {
    logger.error(`Geçersiz kategori grubu: ${categoryGroupId}`, new Error('Invalid category group'), { categoryGroupId })
    return []
  }

  logger.info(`🔍 Ana kategori ile arama: ${categoryGroup.displayName.tr}`, { 
    categoryGroupId, 
    placeTypesCount: categoryGroup.placeTypes.length 
  })

  const allResults: PlaceData[] = []
  const seenIds = new Set<string>()

  // 1. Ana kategori için search query kullan (eğer varsa)
  if (categoryGroup.searchQuery) {
    try {
      const queryResults = await searchPlacesComprehensive(
        categoryGroup.searchQuery,
        location,
        apiKey,
        maxResults
      )

      for (const place of queryResults) {
        const key = `${place.lat}-${place.lng}-${place.name}`
        if (!seenIds.has(key)) {
          seenIds.add(key)
          allResults.push(place)
        }
      }

      logger.info(`   ✅ Query araması: ${queryResults.length} mekan bulundu`, { 
        query: categoryGroup.searchQuery,
        count: queryResults.length 
      })
    } catch (error) {
      logger.warn(`   ⚠️  Query araması başarısız: ${categoryGroup.searchQuery}`, { 
        error: error instanceof Error ? error.message : String(error),
        query: categoryGroup.searchQuery 
      })
    }
  }

  // 2. Her place type için Nearby Search yap
  // Not: Çok fazla API çağrısı yapmamak için, sadece en önemli type'ları kullan
  const primaryTypes = categoryGroup.placeTypes.slice(0, 5) // İlk 5 type'ı kullan

  for (const placeType of primaryTypes) {
    try {
      const nearbyResults = await searchNearby(
        location,
        placeType,
        apiKey,
        10000, // 10km radius
        Math.ceil(maxResults / primaryTypes.length) // Her type için eşit dağıt
      )

      for (const place of nearbyResults) {
        const key = `${place.lat}-${place.lng}-${place.name}`
        if (!seenIds.has(key)) {
          seenIds.add(key)
          allResults.push(place)
        }
      }

      logger.info(`   ✅ ${placeType}: ${nearbyResults.length} mekan bulundu`, { 
        placeType,
        count: nearbyResults.length 
      })

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (error) {
      logger.warn(`   ⚠️  ${placeType} araması başarısız`, { 
        error: error instanceof Error ? error.message : String(error),
        placeType 
      })
    }
  }

  // 3. Sonuçları filtrele: Sadece bu kategori grubuna ait place type'ları
  const filteredResults = allResults.filter(place => {
    // Primary type kontrolü (types property'si PlaceData'da yok, primaryType kullan)
    if (place.primaryType) {
      return categoryGroup.placeTypes.includes(place.primaryType)
    }
    // Eğer type bilgisi yoksa, tüm sonuçları kabul et (query aramasından gelmiş olabilir)
    return true
  })

  logger.info(`   📊 Toplam: ${filteredResults.length} mekan (${allResults.length} sonuçtan filtrelendi)`, { 
    total: allResults.length,
    filtered: filteredResults.length 
  })

  return filteredResults.slice(0, maxResults)
}

/**
 * Place'in hangi ana kategori grubuna ait olduğunu belirle
 */
export function getCategoryGroupForPlace(place: PlaceData): string | undefined {
  // Primary type kontrolü (types property'si PlaceData'da yok)
  if (place.primaryType) {
    for (const [groupId, group] of Object.entries(GOOGLE_MAPS_CATEGORY_GROUPS)) {
      if (group.placeTypes.includes(place.primaryType)) {
        return groupId
      }
    }
  }
  
  // Category kontrolü (fallback)
  if (place.category) {
    for (const [groupId, group] of Object.entries(GOOGLE_MAPS_CATEGORY_GROUPS)) {
      if (group.placeTypes.includes(place.category)) {
        return groupId
      }
    }
  }
  
  return undefined
}

