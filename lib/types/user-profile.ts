/**
 * Kullanıcı Profili Tipleri
 * 
 * Kullanıcı tercihlerini ve ihtiyaçlarını tanımlayan tip tanımlamaları
 */

/**
 * Bütçe tercihi
 */
export type BudgetPreference = 'budget' | 'moderate' | 'premium' | 'any'

/**
 * Ortam tercihi
 */
export type AtmospherePreference = 'quiet' | 'lively' | 'romantic' | 'casual' | 'formal' | 'any'

/**
 * Zaman tercihi
 */
export type MealTypePreference = 'breakfast' | 'lunch' | 'dinner' | 'brunch' | 'late-night' | 'any'

/**
 * Özel ihtiyaçlar
 */
export interface SpecialNeeds {
  wheelchair?: boolean      // Tekerlekli sandalye erişimi
  petFriendly?: boolean    // Evcil hayvan dostu
  kidFriendly?: boolean     // Çocuk dostu
  parking?: boolean        // Park yeri
  wifi?: boolean           // WiFi
  vegetarian?: boolean     // Vejetaryen seçenekler
  vegan?: boolean          // Vegan seçenekler
}

/**
 * Kullanıcı profili
 */
export interface UserProfile {
  // Temel bilgiler
  location: {
    lat: number
    lng: number
    address: string
  }
  category: string
  
  // Companion
  companion: 'alone' | 'partner' | 'friends' | 'family' | 'colleagues'
  
  // Yeni faktörler
  budget?: BudgetPreference
  atmosphere?: AtmospherePreference
  mealType?: MealTypePreference
  specialNeeds?: SpecialNeeds
  
  // Limit (kaç öneri gösterilecek)
  limit?: number
  
  // ML için (gelecekte kullanılacak)
  preferences?: {
    favoriteCuisines?: string[]
    favoritePriceLevels?: number[]
    favoriteAtmospheres?: string[]
  }
}

/**
 * Kullanıcı profil vektörü (ML için)
 */
export interface UserProfileVector {
  budget: number              // 0-4 (price level) veya -1 (any)
  atmosphere: number          // 0-4 (quiet=0, lively=1, romantic=2, casual=3, formal=4) veya -1 (any)
  mealType: number           // 0-4 (breakfast=0, lunch=1, dinner=2, brunch=3, late-night=4) veya -1 (any)
  specialNeeds: number[]     // Binary array [wheelchair, pet, kid, parking, wifi, veg, vegan]
  companion: number          // 0-4 (alone=0, partner=1, friends=2, family=3, colleagues=4)
}

/**
 * Profil vektörüne dönüştürme helper fonksiyonları
 */
export function profileToVector(profile: UserProfile): UserProfileVector {
  // Bütçe mapping
  const budgetMap: Record<BudgetPreference, number> = {
    budget: 1,      // 0-1 price level
    moderate: 2,    // 2 price level
    premium: 3,     // 3-4 price level (ortalaması 3.5, yuvarlanmış 3)
    any: -1,
  }
  
  // Ortam mapping
  const atmosphereMap: Record<AtmospherePreference, number> = {
    quiet: 0,
    lively: 1,
    romantic: 2,
    casual: 3,
    formal: 4,
    any: -1,
  }
  
  // Zaman mapping
  const mealTypeMap: Record<MealTypePreference, number> = {
    breakfast: 0,
    lunch: 1,
    dinner: 2,
    brunch: 3,
    'late-night': 4,
    any: -1,
  }
  
  // Companion mapping
  const companionMap: Record<UserProfile['companion'], number> = {
    alone: 0,
    partner: 1,
    friends: 2,
    family: 3,
    colleagues: 4,
  }
  
  // Özel ihtiyaçlar binary array
  const specialNeedsArray: number[] = [
    profile.specialNeeds?.wheelchair ? 1 : 0,
    profile.specialNeeds?.petFriendly ? 1 : 0,
    profile.specialNeeds?.kidFriendly ? 1 : 0,
    profile.specialNeeds?.parking ? 1 : 0,
    profile.specialNeeds?.wifi ? 1 : 0,
    profile.specialNeeds?.vegetarian ? 1 : 0,
    profile.specialNeeds?.vegan ? 1 : 0,
  ]
  
  return {
    budget: profile.budget ? budgetMap[profile.budget] : -1,
    atmosphere: profile.atmosphere ? atmosphereMap[profile.atmosphere] : -1,
    mealType: profile.mealType ? mealTypeMap[profile.mealType] : -1,
    specialNeeds: specialNeedsArray,
    companion: companionMap[profile.companion],
  }
}



