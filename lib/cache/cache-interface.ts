/**
 * Cache Interface
 * 
 * Abstract cache interface for Redis and in-memory cache
 * Production'da Redis kullanılacak, development'ta in-memory
 */

export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  has(key: string): Promise<boolean>
}

/**
 * In-memory cache adapter (development için)
 */
class MemoryCacheAdapter implements CacheAdapter {
  private cache: Map<string, { value: any; expires?: number }> = new Map()

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key)
    if (!item) return null

    // TTL kontrolü
    if (item.expires && item.expires < Date.now()) {
      this.cache.delete(key)
      return null
    }

    return item.value as T
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const expires = ttl ? Date.now() + ttl * 1000 : undefined
    this.cache.set(key, { value, expires })
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }

  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key)
    if (!item) return false

    // TTL kontrolü
    if (item.expires && item.expires < Date.now()) {
      this.cache.delete(key)
      return false
    }

    return true
  }
}

/**
 * Redis cache adapter (production için)
 * Şimdilik placeholder - production'da implement edilecek
 */
class RedisCacheAdapter implements CacheAdapter {
  // TODO: Redis client implementation
  // import Redis from 'ioredis'
  // private redis: Redis

  async get<T>(key: string): Promise<T | null> {
    // TODO: Redis GET implementation
    throw new Error('Redis adapter not implemented yet')
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // TODO: Redis SET with TTL implementation
    throw new Error('Redis adapter not implemented yet')
  }

  async delete(key: string): Promise<void> {
    // TODO: Redis DEL implementation
    throw new Error('Redis adapter not implemented yet')
  }

  async clear(): Promise<void> {
    // TODO: Redis FLUSHDB implementation
    throw new Error('Redis adapter not implemented yet')
  }

  async has(key: string): Promise<boolean> {
    // TODO: Redis EXISTS implementation
    throw new Error('Redis adapter not implemented yet')
  }
}

/**
 * Cache factory - environment'a göre adapter seçer
 */
export function createCacheAdapter(): CacheAdapter {
  const useRedis = process.env.REDIS_URL && process.env.NODE_ENV === 'production'
  
  if (useRedis) {
    // Production'da Redis kullan
    // return new RedisCacheAdapter()
    // Şimdilik memory cache kullan (Redis implementasyonu sonra)
    return new MemoryCacheAdapter()
  }

  // Development'ta memory cache
  return new MemoryCacheAdapter()
}

// Singleton cache instance
let cacheInstance: CacheAdapter | null = null

export function getCache(): CacheAdapter {
  if (!cacheInstance) {
    cacheInstance = createCacheAdapter()
  }
  return cacheInstance
}



