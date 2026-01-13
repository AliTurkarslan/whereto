/**
 * Rate Limiting
 * 
 * Server-side rate limiting için basit bir implementasyon
 * Production'da Redis veya benzeri bir sistem kullanılmalı
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory rate limit store (production'da Redis kullanılmalı)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

/**
 * Rate limit kontrolü
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 100, windowMs: 60 * 1000 } // 100 requests per minute
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || now > entry.resetTime) {
    // Yeni entry veya expired entry
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    }
    rateLimitStore.set(identifier, newEntry)
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    }
  }

  // Entry mevcut ve valid
  if (entry.count >= config.maxRequests) {
    // Rate limit aşıldı
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    }
  }

  // Count artır
  entry.count++
  rateLimitStore.set(identifier, entry)

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * IP adresinden rate limit identifier oluştur
 * NextRequest veya Request ile çalışır
 */
export function getRateLimitIdentifier(request: Request | { headers: Headers }): string {
  // X-Forwarded-For header'ından IP al (proxy/load balancer arkasında)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  // X-Real-IP header'ından IP al
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // NextRequest'ten IP al (eğer varsa)
  if ('ip' in request && request.ip && typeof request.ip === 'string') {
    return request.ip
  }

  // Fallback: random identifier (development için)
  return 'unknown'
}

/**
 * API endpoint için rate limit middleware
 * Next.js NextRequest ile uyumlu
 */
export function withRateLimit<T extends Request | { headers: Headers }>(
  handler: (request: T) => Promise<Response>,
  config?: RateLimitConfig
) {
  return async (request: T): Promise<Response> => {
    const identifier = getRateLimitIdentifier(request)
    const rateLimitResult = checkRateLimit(identifier, config)

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(config?.maxRequests || 100),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.resetTime),
            'Retry-After': String(rateLimitResult.retryAfter || 60),
          },
        }
      )
    }

    // Rate limit headers ekle
    const response = await handler(request)
    response.headers.set('X-RateLimit-Limit', String(config?.maxRequests || 100))
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining))
    response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetTime))

    return response
  }
}

