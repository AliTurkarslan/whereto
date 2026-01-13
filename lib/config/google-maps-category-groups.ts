/**
 * Google Maps Ana Kategori Grupları
 * 
 * Google Maps UI'da görünen ana kategoriler ve bunların altındaki tüm place type'ları
 * Bu kategoriler Google Maps'te üstte görünen kategorilerdir:
 * - Restoranlar (Restaurants)
 * - Oteller (Hotels)
 * - Yapılacaklar (Things to do)
 * - Müzeler (Museums)
 * - Toplu Taşıma (Transit)
 * - Eczaneler (Pharmacies)
 * - ATM
 * vb.
 */

export interface GoogleMapsCategoryGroup {
  id: string // Ana kategori ID (restaurants, hotels, vb.)
  displayName: {
    tr: string
    en: string
  }
  icon?: string // Lucide icon name
  color?: string // Tailwind color class
  placeTypes: string[] // Bu kategorideki tüm Google Places API type'ları
  searchQuery?: string // Arama için kullanılacak query (opsiyonel)
}

/**
 * Google Maps Ana Kategori Grupları
 * Google Maps UI'da görünen kategoriler
 */
export const GOOGLE_MAPS_CATEGORY_GROUPS: Record<string, GoogleMapsCategoryGroup> = {
  // Restoranlar (Restaurants)
  restaurants: {
    id: 'restaurants',
    displayName: {
      tr: 'Restoranlar',
      en: 'Restaurants'
    },
    icon: 'UtensilsCrossed',
    color: 'bg-orange-500',
    placeTypes: [
      'restaurant',
      'cafe',
      'bar',
      'bakery',
      'meal_takeaway',
      'meal_delivery',
      'food',
      'establishment'
    ],
    searchQuery: 'restaurant'
  },

  // Oteller (Hotels)
  hotels: {
    id: 'hotels',
    displayName: {
      tr: 'Oteller',
      en: 'Hotels'
    },
    icon: 'Bed',
    color: 'bg-indigo-500',
    placeTypes: [
      'lodging',
      'hotel',
      'motel',
      'resort',
      'hostel'
    ],
    searchQuery: 'hotel'
  },

  // Yapılacaklar (Things to do)
  things_to_do: {
    id: 'things_to_do',
    displayName: {
      tr: 'Yapılacaklar',
      en: 'Things to do'
    },
    icon: 'Map',
    color: 'bg-blue-500',
    placeTypes: [
      'tourist_attraction',
      'amusement_center',
      'amusement_park',
      'park',
      'zoo',
      'aquarium',
      'museum',
      'art_gallery',
      'movie_theater',
      'night_club',
      'bowling_alley',
      'casino',
      'stadium',
      'rv_park',
      'campground'
    ],
    searchQuery: 'attraction'
  },

  // Müzeler (Museums)
  museums: {
    id: 'museums',
    displayName: {
      tr: 'Müzeler',
      en: 'Museums'
    },
    icon: 'Landmark',
    color: 'bg-purple-500',
    placeTypes: [
      'museum',
      'art_gallery'
    ],
    searchQuery: 'museum'
  },

  // Toplu Taşıma (Transit)
  transit: {
    id: 'transit',
    displayName: {
      tr: 'Toplu Taşıma',
      en: 'Transit'
    },
    icon: 'Navigation',
    color: 'bg-green-500',
    placeTypes: [
      'transit_station',
      'subway_station',
      'train_station',
      'bus_station',
      'taxi_stand',
      'light_rail_station'
    ],
    searchQuery: 'transit'
  },

  // Eczaneler (Pharmacies)
  pharmacies: {
    id: 'pharmacies',
    displayName: {
      tr: 'Eczaneler',
      en: 'Pharmacies'
    },
    icon: 'Pill',
    color: 'bg-green-600',
    placeTypes: [
      'pharmacy',
      'drugstore'
    ],
    searchQuery: 'pharmacy'
  },

  // ATM
  atm: {
    id: 'atm',
    displayName: {
      tr: 'ATM',
      en: 'ATM'
    },
    icon: 'CreditCard',
    color: 'bg-blue-600',
    placeTypes: [
      'atm',
      'bank'
    ],
    searchQuery: 'atm'
  },

  // Alışveriş (Shopping)
  shopping: {
    id: 'shopping',
    displayName: {
      tr: 'Alışveriş',
      en: 'Shopping'
    },
    icon: 'ShoppingBag',
    color: 'bg-pink-500',
    placeTypes: [
      'shopping_mall',
      'clothing_store',
      'shoe_store',
      'supermarket',
      'convenience_store',
      'department_store',
      'furniture_store',
      'electronics_store',
      'book_store',
      'jewelry_store',
      'store'
    ],
    searchQuery: 'shopping'
  },

  // Güzellik & Bakım (Beauty & Care)
  beauty: {
    id: 'beauty',
    displayName: {
      tr: 'Güzellik & Bakım',
      en: 'Beauty & Care'
    },
    icon: 'Sparkles',
    color: 'bg-rose-500',
    placeTypes: [
      'hair_salon',
      'beauty_salon',
      'spa',
      'gym',
      'fitness_center',
      'nail_salon',
      'tanning_salon'
    ],
    searchQuery: 'beauty'
  },

  // Sağlık (Health)
  health: {
    id: 'health',
    displayName: {
      tr: 'Sağlık',
      en: 'Health'
    },
    icon: 'Cross',
    color: 'bg-red-500',
    placeTypes: [
      'hospital',
      'pharmacy',
      'dentist',
      'doctor',
      'physiotherapist',
      'veterinary_care',
      'health'
    ],
    searchQuery: 'hospital'
  },

  // Benzin İstasyonları (Gas Stations)
  gas_stations: {
    id: 'gas_stations',
    displayName: {
      tr: 'Benzin İstasyonları',
      en: 'Gas Stations'
    },
    icon: 'Fuel',
    color: 'bg-yellow-500',
    placeTypes: [
      'gas_station',
      'fuel'
    ],
    searchQuery: 'gas station'
  },

  // Park Yerleri (Parking)
  parking: {
    id: 'parking',
    displayName: {
      tr: 'Park Yerleri',
      en: 'Parking'
    },
    icon: 'Car',
    color: 'bg-gray-500',
    placeTypes: [
      'parking',
      'parking_lot',
      'parking_garage'
    ],
    searchQuery: 'parking'
  }
}

/**
 * Ana kategori ID'lerini array olarak döndür
 */
export function getCategoryGroupIds(): string[] {
  return Object.keys(GOOGLE_MAPS_CATEGORY_GROUPS)
}

/**
 * Ana kategoriye göre place type'ları döndür
 */
export function getPlaceTypesForCategoryGroup(categoryGroupId: string): string[] {
  const group = GOOGLE_MAPS_CATEGORY_GROUPS[categoryGroupId]
  return group?.placeTypes || []
}

/**
 * Place type'a göre hangi ana kategoriye ait olduğunu bul
 */
export function getCategoryGroupForPlaceType(placeType: string): string | undefined {
  for (const [groupId, group] of Object.entries(GOOGLE_MAPS_CATEGORY_GROUPS)) {
    if (group.placeTypes.includes(placeType)) {
      return groupId
    }
  }
  return undefined
}

/**
 * Ana kategoriye göre search query döndür
 */
export function getSearchQueryForCategoryGroup(categoryGroupId: string): string | undefined {
  const group = GOOGLE_MAPS_CATEGORY_GROUPS[categoryGroupId]
  return group?.searchQuery
}

