/**
 * Query Result Cache
 * Aynı (lat, lng, category, companion, budget, atmosphere, mealType, specialNeeds) kombinasyonları için sonuçları cache'ler
 */

import { ScoredPlace } from '@/lib/types/place'
import { logger } from '@/lib/logging/logger'
import type { BudgetPreference, AtmospherePreference, MealTypePreference, SpecialNeeds } from '@/lib/types/user-profile'

export interface CacheKey {
  lat: number
  lng: number
  category: string
  companion: string
  budget?: BudgetPreference
  atmosphere?: AtmospherePreference
  mealType?: MealTypePreference
  specialNeeds?: SpecialNeeds
}

interface CacheEntry {
  places: ScoredPlace[]
  timestamp: number
  expiresAt: number
  lastAccessed: number // LRU için
}

// In-memory cache (production'da Redis kullanılmalı)
const cache = new Map<string, CacheEntry>()

// Cache TTL: 5 dakika (300000 ms)
const CACHE_TTL = 5 * 60 * 1000

// Maximum cache entries (memory leak önleme)
const MAX_CACHE_ENTRIES = 1000

// Cache key oluştur
function getCacheKey(key: CacheKey): string {
  // Yuvarlanmış koordinatlar (100m hassasiyet)
  const roundedLat = Math.round(key.lat * 1000) / 1000
  const roundedLng = Math.round(key.lng * 1000) / 1000
  
  // Tüm faktörleri cache key'e dahil et
  const parts = [
    `${roundedLat},${roundedLng}`,
    key.category,
    key.companion,
    key.budget || 'any',
    key.atmosphere || 'any',
    key.mealType || 'any',
    key.specialNeeds ? JSON.stringify(key.specialNeeds) : '{}',
  ]
  
  return parts.join(':')
}

/**
 * Cache'den sonuçları getir
 */
export function getCachedQuery(key: CacheKey): ScoredPlace[] | null {
  const cacheKey = getCacheKey(key)
  const entry = cache.get(cacheKey)

  if (!entry) {
    return null
  }

  // Expire kontrolü
  if (Date.now() > entry.expiresAt) {
    cache.delete(cacheKey)
    logger.debug('Cache entry expired', { cacheKey })
    return null
  }

  // LRU: Last accessed time'ı güncelle
  entry.lastAccessed = Date.now()

  logger.debug('Cache hit', { cacheKey })
  return entry.places
}

/**
 * Sonuçları cache'e kaydet
 */
export function setCachedQuery(key: CacheKey, places: ScoredPlace[]): void {
  const cacheKey = getCacheKey(key)
  const now = Date.now()

  // Memory limit kontrolü: Eğer cache doluysa, en eski (LRU) entry'leri sil
  if (cache.size >= MAX_CACHE_ENTRIES) {
    evictOldestEntries(Math.floor(MAX_CACHE_ENTRIES * 0.1)) // %10'unu temizle
  }

  cache.set(cacheKey, {
    places,
    timestamp: now,
    expiresAt: now + CACHE_TTL,
    lastAccessed: now,
  })

  logger.debug('Cache entry created', { cacheKey, count: places.length, cacheSize: cache.size })
}

/**
 * En eski (LRU) entry'leri temizle
 */
function evictOldestEntries(count: number): void {
  const entries = Array.from(cache.entries())
    .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed) // En eski önce
  
  let evicted = 0
  for (const [key] of entries.slice(0, count)) {
    cache.delete(key)
    evicted++
  }
  
  if (evicted > 0) {
    logger.debug(`Evicted ${evicted} oldest cache entries`, { evicted, remaining: cache.size })
  }
}

/**
 * Cache'i temizle
 */
export function clearQueryCache(): void {
  cache.clear()
  logger.info('Query cache cleared')
}

/**
 * Expired cache entries'i temizle
 */
export function cleanExpiredCache(): void {
  const now = Date.now()
  let cleaned = 0

  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key)
      cleaned++
    }
  }

  if (cleaned > 0) {
    logger.debug(`Cleaned ${cleaned} expired cache entries`)
  }
}

/**
 * Cache istatistikleri
 */
export function getCacheStats() {
  const now = Date.now()
  let active = 0
  let expired = 0

  for (const entry of cache.values()) {
    if (now > entry.expiresAt) {
      expired++
    } else {
      active++
    }
  }

  return {
    total: cache.size,
    active,
    expired,
  }
}

// Her 10 dakikada bir expired entries'i temizle
if (typeof setInterval !== 'undefined') {
  setInterval(cleanExpiredCache, 10 * 60 * 1000)
}

