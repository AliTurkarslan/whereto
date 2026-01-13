/**
 * Free Tier Protection
 * 
 * Google Maps Platform free tier ($200/ay) limitlerini aşmamak için koruma mekanizması
 */

import { logger } from '../logging/logger'

const FREE_TIER_MONTHLY_CREDIT = 200 // $200/ay
const FREE_TIER_DAILY_CREDIT = FREE_TIER_MONTHLY_CREDIT / 30 // ~$6.67/gün

// API fiyatlandırması (per 1,000 requests)
const API_PRICING = {
  placesTextSearch: 32, // $32 per 1,000
  placesNearbySearch: 32, // $32 per 1,000
  placesDetails: 17, // $17 per 1,000
  placesPhoto: 7, // $7 per 1,000
  streetView: 7, // $7 per 1,000
  geocoding: 5, // $5 per 1,000
  directions: 5, // $5 per 1,000
} as const

// Günlük kullanım takibi (in-memory, production'da database'e taşınmalı)
let dailyUsage = {
  cost: 0,
  requests: {
    placesTextSearch: 0,
    placesNearbySearch: 0,
    placesDetails: 0,
    placesPhoto: 0,
    streetView: 0,
    geocoding: 0,
    directions: 0,
  },
  lastReset: new Date(),
}

/**
 * Günlük kullanımı sıfırla (her gün gece yarısı)
 */
function resetDailyUsageIfNeeded() {
  const now = new Date()
  const lastReset = dailyUsage.lastReset
  
  // Farklı günse sıfırla
  if (
    now.getDate() !== lastReset.getDate() ||
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear()
  ) {
    logger.info('🔄 Günlük API kullanımı sıfırlanıyor...', {
      previousCost: dailyUsage.cost,
      previousDate: lastReset.toISOString(),
    })
    dailyUsage = {
      cost: 0,
      requests: {
        placesTextSearch: 0,
        placesNearbySearch: 0,
        placesDetails: 0,
        placesPhoto: 0,
        streetView: 0,
        geocoding: 0,
        directions: 0,
      },
      lastReset: now,
    }
  }
}

/**
 * API kullanımını kaydet ve free tier limitini kontrol et
 */
export function trackApiUsage(
  api: keyof typeof API_PRICING,
  requestCount: number = 1
): { allowed: boolean; remaining: number; cost: number } {
  resetDailyUsageIfNeeded()

  const price = API_PRICING[api]
  const cost = (requestCount * price) / 1000
  const newTotalCost = dailyUsage.cost + cost

  // Günlük limit kontrolü
  if (newTotalCost > FREE_TIER_DAILY_CREDIT) {
    logger.warn('⚠️  Günlük free tier limiti aşıldı!', {
      api,
      requestCount,
      cost,
      dailyCost: dailyUsage.cost,
      newTotalCost,
      dailyLimit: FREE_TIER_DAILY_CREDIT,
    })
    return {
      allowed: false,
      remaining: Math.max(0, FREE_TIER_DAILY_CREDIT - dailyUsage.cost),
      cost: 0,
    }
  }

  // Kullanımı kaydet
  dailyUsage.cost = newTotalCost
  dailyUsage.requests[api] += requestCount

  logger.debug('📊 API kullanımı kaydedildi', {
    api,
    requestCount,
    cost,
    dailyCost: dailyUsage.cost,
    remaining: FREE_TIER_DAILY_CREDIT - dailyUsage.cost,
  })

  return {
    allowed: true,
    remaining: FREE_TIER_DAILY_CREDIT - dailyUsage.cost,
    cost,
  }
}

/**
 * Günlük kullanım özeti
 */
export function getDailyUsageSummary(): {
  cost: number
  remaining: number
  percentage: number
  requests: typeof dailyUsage.requests
} {
  resetDailyUsageIfNeeded()

  const percentage = (dailyUsage.cost / FREE_TIER_DAILY_CREDIT) * 100

  return {
    cost: dailyUsage.cost,
    remaining: FREE_TIER_DAILY_CREDIT - dailyUsage.cost,
    percentage,
    requests: { ...dailyUsage.requests },
  }
}

/**
 * Belirli bir API için kalan request sayısını hesapla
 */
export function getRemainingRequests(api: keyof typeof API_PRICING): number {
  resetDailyUsageIfNeeded()

  const price = API_PRICING[api]
  const remainingCost = FREE_TIER_DAILY_CREDIT - dailyUsage.cost
  const remainingRequests = Math.floor((remainingCost / price) * 1000)

  return Math.max(0, remainingRequests)
}

/**
 * Sync işlemi için güvenli request limiti hesapla
 */
export function getSafeRequestLimit(
  api: keyof typeof API_PRICING,
  maxRequests: number
): number {
  const remaining = getRemainingRequests(api)
  const safeLimit = Math.min(maxRequests, remaining, 100) // Max 100 request per sync

  if (safeLimit < maxRequests) {
    logger.warn('⚠️  Request limiti free tier koruması için azaltıldı', {
      api,
      requested: maxRequests,
      safeLimit,
      remaining,
    })
  }

  return safeLimit
}
