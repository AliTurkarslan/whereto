/**
 * KULLANICI İHTİYAÇ BAZLI KATEGORİLER
 * 
 * Kullanıcı günlük dilde ihtiyacını belirtir:
 * - "Yemek için dışarı çıkacağım"
 * - "Kahve içmek için dışarı çıkacağım"
 * - "Eğlence için dışarı çıkacağım"
 * 
 * Sistem bu ihtiyaçları Google Maps kategorilerine map eder.
 */

export interface UserNeedCategory {
  id: string // yemek, kahve, eglence, vb.
  displayName: {
    tr: string
    en: string
  }
  icon: string // Lucide icon name
  color: string // Tailwind color class
  googleMapsTypes: string[] // Bu ihtiyaca karşılık gelen Google Maps kategorileri
  description?: {
    tr: string
    en: string
  } // Kullanıcıya açıklama
}

/**
 * Kullanıcı İhtiyaç Kategorileri
 * Günlük dilde, anlaşılır kategoriler
 */
export const USER_NEED_CATEGORIES: Record<string, UserNeedCategory> = {
  // Yemek
  yemek: {
    id: 'yemek',
    displayName: {
      tr: 'Yemek',
      en: 'Food'
    },
    icon: 'UtensilsCrossed',
    color: 'bg-orange-500',
    googleMapsTypes: ['restaurant', 'cafe', 'bar', 'bakery', 'meal_takeaway', 'meal_delivery', 'food'],
    description: {
      tr: 'Restoran, kafe, bar veya yemek servisi',
      en: 'Restaurant, cafe, bar or food service'
    }
  },

  // Kahve
  kahve: {
    id: 'kahve',
    displayName: {
      tr: 'Kahve',
      en: 'Coffee'
    },
    icon: 'Coffee',
    color: 'bg-amber-600',
    googleMapsTypes: ['cafe', 'bakery'],
    description: {
      tr: 'Kahve içmek için mekanlar',
      en: 'Places for coffee'
    }
  },

  // İçecek
  icecek: {
    id: 'icecek',
    displayName: {
      tr: 'İçecek',
      en: 'Drinks'
    },
    icon: 'Wine',
    color: 'bg-purple-500',
    googleMapsTypes: ['bar', 'cafe', 'night_club'],
    description: {
      tr: 'Bar, gece kulübü veya içecek mekanları',
      en: 'Bar, nightclub or drink places'
    }
  },

  // Eğlence
  eglence: {
    id: 'eglence',
    displayName: {
      tr: 'Eğlence',
      en: 'Entertainment'
    },
    icon: 'Film',
    color: 'bg-blue-500',
    googleMapsTypes: ['movie_theater', 'night_club', 'amusement_center', 'amusement_park', 'bowling_alley', 'casino', 'stadium'],
    description: {
      tr: 'Sinema, gece kulübü, eğlence merkezi',
      en: 'Cinema, nightclub, entertainment center'
    }
  },

  // Alışveriş
  alisveris: {
    id: 'alisveris',
    displayName: {
      tr: 'Alışveriş',
      en: 'Shopping'
    },
    icon: 'ShoppingBag',
    color: 'bg-pink-500',
    googleMapsTypes: ['shopping_mall', 'clothing_store', 'shoe_store', 'supermarket', 'convenience_store', 'department_store', 'furniture_store', 'electronics_store', 'book_store', 'jewelry_store'],
    description: {
      tr: 'Alışveriş merkezi, mağaza, market',
      en: 'Shopping mall, store, supermarket'
    }
  },

  // Güzellik & Bakım
  guzellik: {
    id: 'guzellik',
    displayName: {
      tr: 'Güzellik & Bakım',
      en: 'Beauty & Care'
    },
    icon: 'Sparkles',
    color: 'bg-rose-500',
    googleMapsTypes: ['hair_salon', 'beauty_salon', 'spa', 'gym', 'fitness_center', 'nail_salon', 'tanning_salon'],
    description: {
      tr: 'Kuaför, güzellik salonu, spa, spor salonu',
      en: 'Hair salon, beauty salon, spa, gym'
    }
  },

  // Kültür & Sanat
  kultur: {
    id: 'kultur',
    displayName: {
      tr: 'Kültür & Sanat',
      en: 'Culture & Arts'
    },
    icon: 'Landmark',
    color: 'bg-purple-500',
    googleMapsTypes: ['museum', 'art_gallery', 'tourist_attraction', 'park', 'zoo', 'aquarium'],
    description: {
      tr: 'Müze, sanat galerisi, turistik yer',
      en: 'Museum, art gallery, tourist attraction'
    }
  },

  // Konaklama
  konaklama: {
    id: 'konaklama',
    displayName: {
      tr: 'Konaklama',
      en: 'Accommodation'
    },
    icon: 'Bed',
    color: 'bg-indigo-500',
    googleMapsTypes: ['lodging', 'hotel', 'motel', 'resort', 'hostel'],
    description: {
      tr: 'Otel, motel, resort, hostel',
      en: 'Hotel, motel, resort, hostel'
    }
  },

  // Sağlık
  saglik: {
    id: 'saglik',
    displayName: {
      tr: 'Sağlık',
      en: 'Health'
    },
    icon: 'Cross',
    color: 'bg-red-500',
    googleMapsTypes: ['hospital', 'pharmacy', 'dentist', 'doctor', 'physiotherapist', 'veterinary_care'],
    description: {
      tr: 'Hastane, eczane, doktor, diş hekimi',
      en: 'Hospital, pharmacy, doctor, dentist'
    }
  },

  // Ulaşım
  ulasim: {
    id: 'ulasim',
    displayName: {
      tr: 'Ulaşım',
      en: 'Transport'
    },
    icon: 'Car',
    color: 'bg-gray-500',
    googleMapsTypes: ['gas_station', 'parking', 'parking_lot', 'parking_garage', 'transit_station', 'subway_station', 'train_station', 'bus_station'],
    description: {
      tr: 'Benzin istasyonu, park yeri, toplu taşıma',
      en: 'Gas station, parking, public transport'
    }
  }
}

/**
 * Kullanıcı ihtiyaç kategorisi ID'sine göre Google Maps kategorilerini döndür
 */
export function getGoogleMapsTypesForUserNeed(userNeedId: string): string[] {
  const userNeed = USER_NEED_CATEGORIES[userNeedId]
  return userNeed?.googleMapsTypes || []
}

/**
 * Google Maps kategorisine göre hangi kullanıcı ihtiyacına ait olduğunu bul
 */
export function getUserNeedForGoogleMapsType(googleMapsType: string): string | undefined {
  for (const [userNeedId, userNeed] of Object.entries(USER_NEED_CATEGORIES)) {
    if (userNeed.googleMapsTypes.includes(googleMapsType)) {
      return userNeedId
    }
  }
  return undefined
}

/**
 * Tüm kullanıcı ihtiyaç kategorilerini döndür
 */
export function getAllUserNeedCategories(): UserNeedCategory[] {
  return Object.values(USER_NEED_CATEGORIES)
}



