# Redis Cache Setup Guide

## Production'da Redis Kullanımı

### 1. Redis Kurulumu

```bash
# Docker ile Redis
docker run -d -p 6379:6379 redis:7-alpine

# Veya Redis Cloud / Upstash gibi managed service
```

### 2. Environment Variables

```env
REDIS_URL=redis://localhost:6379
# veya
REDIS_URL=rediss://your-redis-instance.com:6380
REDIS_PASSWORD=your-password
```

### 3. Package Installation

```bash
npm install ioredis
npm install --save-dev @types/ioredis
```

### 4. Redis Adapter Implementation

`lib/cache/cache-interface.ts` dosyasındaki `RedisCacheAdapter` class'ını implement et:

```typescript
import Redis from 'ioredis'

class RedisCacheAdapter implements CacheAdapter {
  private redis: Redis

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
    })
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key)
    if (!value) return null
    return JSON.parse(value) as T
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value)
    if (ttl) {
      await this.redis.setex(key, ttl, serialized)
    } else {
      await this.redis.set(key, serialized)
    }
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key)
  }

  async clear(): Promise<void> {
    await this.redis.flushdb()
  }

  async has(key: string): Promise<boolean> {
    const exists = await this.redis.exists(key)
    return exists === 1
  }
}
```

### 5. Cache Key Patterns

```
analysis:{placeName}:{lat}:{lng}:{category}:{companion}
places:{query}:{lat}:{lng}
reviews:{placeId}
```

### 6. TTL (Time To Live) Stratejisi

- **Analysis Cache:** 24 saat (AI analiz sonuçları)
- **Places Cache:** 1 saat (mekan listesi)
- **Reviews Cache:** 6 saat (yorumlar)

### 7. Cache Invalidation

- Place güncellendiğinde ilgili cache'leri temizle
- Analysis güncellendiğinde ilgili cache'leri temizle



