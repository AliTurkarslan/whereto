/**
 * Google Maps Places API Kategorileri
 * Tüm Google Maps kategorilerini ve Türkçe karşılıklarını içerir
 */

export interface GoogleMapsCategory {
  apiType: string // Google Places API type
  displayName: {
    tr: string
    en: string
  }
  icon?: string // Lucide icon name
  color?: string // Tailwind color class
  parentCategory?: string // Ana kategori (grouping için)
}

/**
 * Google Maps'in tüm ana kategorileri
 * https://developers.google.com/maps/documentation/places/web-service/supported_types
 */
export const GOOGLE_MAPS_CATEGORIES: Record<string, GoogleMapsCategory> = {
  // Yemek & İçecek
  restaurant: {
    apiType: 'restaurant',
    displayName: { tr: 'Restoran', en: 'Restaurant' },
    icon: 'UtensilsCrossed',
    color: 'bg-orange-500',
    parentCategory: 'food'
  },
  cafe: {
    apiType: 'cafe',
    displayName: { tr: 'Kafe', en: 'Cafe' },
    icon: 'Coffee',
    color: 'bg-amber-600',
    parentCategory: 'food'
  },
  bar: {
    apiType: 'bar',
    displayName: { tr: 'Bar', en: 'Bar' },
    icon: 'Wine',
    color: 'bg-purple-500',
    parentCategory: 'food'
  },
  bakery: {
    apiType: 'bakery',
    displayName: { tr: 'Fırın', en: 'Bakery' },
    icon: 'Cookie',
    color: 'bg-yellow-500',
    parentCategory: 'food'
  },
  meal_takeaway: {
    apiType: 'meal_takeaway',
    displayName: { tr: 'Paket Servis', en: 'Takeaway' },
    icon: 'ShoppingBag',
    color: 'bg-blue-500',
    parentCategory: 'food'
  },
  meal_delivery: {
    apiType: 'meal_delivery',
    displayName: { tr: 'Yemek Servisi', en: 'Food Delivery' },
    icon: 'Truck',
    color: 'bg-green-500',
    parentCategory: 'food'
  },
  
  // Güzellik & Kişisel Bakım
  hair_salon: {
    apiType: 'hair_salon',
    displayName: { tr: 'Kuaför', en: 'Hair Salon' },
    icon: 'Scissors',
    color: 'bg-pink-500',
    parentCategory: 'beauty'
  },
  beauty_salon: {
    apiType: 'beauty_salon',
    displayName: { tr: 'Güzellik Salonu', en: 'Beauty Salon' },
    icon: 'Sparkles',
    color: 'bg-rose-500',
    parentCategory: 'beauty'
  },
  spa: {
    apiType: 'spa',
    displayName: { tr: 'Spa', en: 'Spa' },
    icon: 'Sparkles',
    color: 'bg-teal-500',
    parentCategory: 'beauty'
  },
  gym: {
    apiType: 'gym',
    displayName: { tr: 'Spor Salonu', en: 'Gym' },
    icon: 'Dumbbell',
    color: 'bg-red-500',
    parentCategory: 'beauty'
  },
  
  // Alışveriş
  clothing_store: {
    apiType: 'clothing_store',
    displayName: { tr: 'Giyim Mağazası', en: 'Clothing Store' },
    icon: 'Shirt',
    color: 'bg-blue-500',
    parentCategory: 'shopping'
  },
  shoe_store: {
    apiType: 'shoe_store',
    displayName: { tr: 'Ayakkabı Mağazası', en: 'Shoe Store' },
    icon: 'Footprints',
    color: 'bg-indigo-500',
    parentCategory: 'shopping'
  },
  shopping_mall: {
    apiType: 'shopping_mall',
    displayName: { tr: 'Alışveriş Merkezi', en: 'Shopping Mall' },
    icon: 'ShoppingBag',
    color: 'bg-purple-500',
    parentCategory: 'shopping'
  },
  supermarket: {
    apiType: 'supermarket',
    displayName: { tr: 'Süpermarket', en: 'Supermarket' },
    icon: 'ShoppingCart',
    color: 'bg-green-500',
    parentCategory: 'shopping'
  },
  
  // Eğlence
  amusement_center: {
    apiType: 'amusement_center',
    displayName: { tr: 'Eğlence Merkezi', en: 'Amusement Center' },
    icon: 'Gamepad2',
    color: 'bg-red-500',
    parentCategory: 'entertainment'
  },
  movie_theater: {
    apiType: 'movie_theater',
    displayName: { tr: 'Sinema', en: 'Movie Theater' },
    icon: 'Film',
    color: 'bg-red-600',
    parentCategory: 'entertainment'
  },
  night_club: {
    apiType: 'night_club',
    displayName: { tr: 'Gece Kulübü', en: 'Night Club' },
    icon: 'Music',
    color: 'bg-purple-600',
    parentCategory: 'entertainment'
  },
  bowling_alley: {
    apiType: 'bowling_alley',
    displayName: { tr: 'Bowling', en: 'Bowling' },
    icon: 'Circle',
    color: 'bg-blue-600',
    parentCategory: 'entertainment'
  },
  
  // Sağlık
  hospital: {
    apiType: 'hospital',
    displayName: { tr: 'Hastane', en: 'Hospital' },
    icon: 'Cross',
    color: 'bg-red-500',
    parentCategory: 'health'
  },
  pharmacy: {
    apiType: 'pharmacy',
    displayName: { tr: 'Eczane', en: 'Pharmacy' },
    icon: 'Pill',
    color: 'bg-green-500',
    parentCategory: 'health'
  },
  dentist: {
    apiType: 'dentist',
    displayName: { tr: 'Diş Hekimi', en: 'Dentist' },
    icon: 'Smile',
    color: 'bg-blue-500',
    parentCategory: 'health'
  },
  
  // Ulaşım
  gas_station: {
    apiType: 'gas_station',
    displayName: { tr: 'Benzin İstasyonu', en: 'Gas Station' },
    icon: 'Fuel',
    color: 'bg-yellow-500',
    parentCategory: 'transport'
  },
  parking: {
    apiType: 'parking',
    displayName: { tr: 'Otopark', en: 'Parking' },
    icon: 'Car',
    color: 'bg-gray-500',
    parentCategory: 'transport'
  },
  
  // Diğer
  bank: {
    apiType: 'bank',
    displayName: { tr: 'Banka', en: 'Bank' },
    icon: 'Landmark',
    color: 'bg-green-600',
    parentCategory: 'other'
  },
  atm: {
    apiType: 'atm',
    displayName: { tr: 'ATM', en: 'ATM' },
    icon: 'CreditCard',
    color: 'bg-blue-600',
    parentCategory: 'other'
  },
  hotel: {
    apiType: 'lodging',
    displayName: { tr: 'Otel', en: 'Hotel' },
    icon: 'Bed',
    color: 'bg-indigo-500',
    parentCategory: 'other'
  },
}

/**
 * Kategori grupları (UI'da gösterim için)
 */
export const CATEGORY_GROUPS = {
  food: {
    name: { tr: 'Yemek & İçecek', en: 'Food & Drink' },
    categories: ['restaurant', 'cafe', 'bar', 'bakery', 'meal_takeaway', 'meal_delivery']
  },
  beauty: {
    name: { tr: 'Güzellik & Bakım', en: 'Beauty & Care' },
    categories: ['hair_salon', 'beauty_salon', 'spa', 'gym']
  },
  shopping: {
    name: { tr: 'Alışveriş', en: 'Shopping' },
    categories: ['clothing_store', 'shoe_store', 'shopping_mall', 'supermarket']
  },
  entertainment: {
    name: { tr: 'Eğlence', en: 'Entertainment' },
    categories: ['amusement_center', 'movie_theater', 'night_club', 'bowling_alley']
  },
  health: {
    name: { tr: 'Sağlık', en: 'Health' },
    categories: ['hospital', 'pharmacy', 'dentist']
  },
  transport: {
    name: { tr: 'Ulaşım', en: 'Transport' },
    categories: ['gas_station', 'parking']
  },
  other: {
    name: { tr: 'Diğer', en: 'Other' },
    categories: ['bank', 'atm', 'lodging']
  }
}

/**
 * Eski kategori sisteminden yeni sisteme mapping
 * Backward compatibility için
 */
export const LEGACY_CATEGORY_MAPPING: Record<string, string> = {
  food: 'restaurant',
  coffee: 'cafe',
  bar: 'bar',
  haircut: 'hair_salon',
  spa: 'spa',
  shopping: 'clothing_store',
  entertainment: 'amusement_center',
  other: 'restaurant' // Default fallback
}

/**
 * Google Maps API type'ından kategori bilgisini al
 */
export function getCategoryByApiType(apiType: string): GoogleMapsCategory | undefined {
  return Object.values(GOOGLE_MAPS_CATEGORIES).find(cat => cat.apiType === apiType)
}

/**
 * Legacy kategoriyi Google Maps API type'ına çevir
 */
export function mapLegacyCategory(legacyCategory: string): string {
  return LEGACY_CATEGORY_MAPPING[legacyCategory] || legacyCategory
}



