/**
 * Input Sanitization
 * 
 * XSS ve SQL injection koruması için input sanitization
 */

import { USER_NEED_CATEGORIES } from '@/lib/config/user-needs-categories'
import { GOOGLE_MAPS_CATEGORY_GROUPS } from '@/lib/config/google-maps-category-groups'
import { GOOGLE_MAPS_CATEGORIES } from '@/lib/config/google-maps-categories'

/**
 * HTML tag'lerini temizle (XSS koruması)
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  // HTML tag'lerini kaldır
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * SQL injection koruması için string'i temizle
 * Not: Drizzle ORM zaten parametrized queries kullanıyor, ama ekstra güvenlik için
 */
export function sanitizeSql(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  // SQL injection karakterlerini temizle
  return input
    .replace(/['";\\]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
}

/**
 * Koordinat validasyonu
 */
export function validateCoordinates(lat: number, lng: number): {
  isValid: boolean
  error?: string
} {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return {
      isValid: false,
      error: 'Latitude and longitude must be numbers',
    }
  }

  if (isNaN(lat) || isNaN(lng)) {
    return {
      isValid: false,
      error: 'Latitude and longitude cannot be NaN',
    }
  }

  if (lat < -90 || lat > 90) {
    return {
      isValid: false,
      error: 'Latitude must be between -90 and 90',
    }
  }

  if (lng < -180 || lng > 180) {
    return {
      isValid: false,
      error: 'Longitude must be between -180 and 180',
    }
  }

  return {
    isValid: true,
  }
}

/**
 * Category validasyonu
 * 
 * Kabul edilen kategori tipleri:
 * 1. Kullanıcı ihtiyaç kategorileri (yemek, kahve, eglence, vb.)
 * 2. Google Maps ana kategori grupları (restaurants, hotels, things_to_do, vb.)
 * 3. Spesifik Google Maps place type'ları (restaurant, cafe, bar, vb.)
 */
export function validateCategory(category: string): {
  isValid: boolean
  error?: string
  categoryType?: 'user_need' | 'category_group' | 'place_type'
} {
  if (!category || typeof category !== 'string') {
    return {
      isValid: false,
      error: 'Category is required',
    }
  }

  const normalizedCategory = category.toLowerCase().trim()

  // 1. Kullanıcı ihtiyaç kategorileri kontrolü (yemek, kahve, vb.)
  if (USER_NEED_CATEGORIES[normalizedCategory]) {
    return {
      isValid: true,
      categoryType: 'user_need',
    }
  }

  // 2. Google Maps ana kategori grupları kontrolü (restaurants, hotels, vb.)
  const categoryGroups = Object.keys(GOOGLE_MAPS_CATEGORY_GROUPS)
  if (categoryGroups.includes(normalizedCategory)) {
    return {
      isValid: true,
      categoryType: 'category_group',
    }
  }

  // 3. Spesifik Google Maps place type kontrolü (restaurant, cafe, vb.)
  const placeTypes = Object.keys(GOOGLE_MAPS_CATEGORIES)
  if (placeTypes.includes(normalizedCategory)) {
    return {
      isValid: true,
      categoryType: 'place_type',
    }
  }

  // Geçersiz kategori - daha açıklayıcı hata mesajı
  const userNeedCategories = Object.keys(USER_NEED_CATEGORIES)
  const userNeedExamples = userNeedCategories.slice(0, 3).join(', ')
  const categoryGroupExamples = categoryGroups.slice(0, 3).join(', ')
  const placeTypeExamples = placeTypes.slice(0, 3).join(', ')

  return {
    isValid: false,
    error: `Invalid category. Must be one of:
- User need category: ${userNeedExamples}, ...
- Google Maps category group: ${categoryGroupExamples}, ...
- Google Maps place type: ${placeTypeExamples}, ...`,
  }
}

/**
 * Companion validasyonu
 */
export function validateCompanion(companion: string): {
  isValid: boolean
  error?: string
} {
  const validCompanions = [
    'alone',
    'partner',
    'friends',
    'family',
    'colleagues',
  ]

  if (!companion || typeof companion !== 'string') {
    return {
      isValid: false,
      error: 'Companion is required',
    }
  }

  if (!validCompanions.includes(companion.toLowerCase())) {
    return {
      isValid: false,
      error: `Invalid companion. Must be one of: ${validCompanions.join(', ')}`,
    }
  }

  return {
    isValid: true,
  }
}

/**
 * Genel input validasyonu
 */
export function validateRecommendationInput(data: {
  lat?: number
  lng?: number
  category?: string
  companion?: string
}): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Koordinat validasyonu
  if (data.lat !== undefined && data.lng !== undefined) {
    const coordValidation = validateCoordinates(data.lat, data.lng)
    if (!coordValidation.isValid) {
      errors.push(coordValidation.error || 'Invalid coordinates')
    }
  } else {
    errors.push('Latitude and longitude are required')
  }

  // Category validasyonu (sadece Google Maps kategorileri)
  if (data.category !== undefined) {
    const categoryValidation = validateCategory(data.category)
    if (!categoryValidation.isValid) {
      errors.push(categoryValidation.error || 'Invalid category')
    }
  } else {
    errors.push('Category is required')
  }

  // Companion validasyonu
  if (data.companion !== undefined) {
    const companionValidation = validateCompanion(data.companion)
    if (!companionValidation.isValid) {
      errors.push(companionValidation.error || 'Invalid companion')
    }
  } else {
    errors.push('Companion is required')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

