import { ScoredPlace } from '@/lib/types/place'
import { promises as fs } from 'fs'
import path from 'path'
import { logger } from '../logging/logger'

const CACHE_DIR = path.join(process.cwd(), '.cache')
const ANALYSIS_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 saat

interface CachedAnalysis {
  data: ScoredPlace
  timestamp: number
  category: string
  companion: string
}

// Memory cache (hızlı erişim için)
const memoryCache = new Map<string, CachedAnalysis>()

// Cache key oluştur
function getCacheKey(
  placeName: string,
  placeLat: number,
  placeLng: number,
  category: string,
  companion: string
): string {
  // Normalize place name (küçük harf, özel karakterleri temizle)
  const normalizedName = placeName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .substring(0, 50)
  
  // Lat/lng'i yuvarla (yakın mekanlar için aynı cache)
  const roundedLat = Math.round(placeLat * 100) / 100
  const roundedLng = Math.round(placeLng * 100) / 100
  
  return `${normalizedName}-${roundedLat}-${roundedLng}-${category}-${companion}`
}

// Cache dosyası yolu
function getCacheFilePath(key: string): string {
  // Güvenli dosya adı
  const safeKey = key.replace(/[^a-z0-9-]/g, '-')
  return path.join(CACHE_DIR, `${safeKey}.json`)
}

// Cache dizinini oluştur
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
  } catch (error) {
    logger.error('Error creating cache directory', error instanceof Error ? error : new Error(String(error)), {})
  }
}

// Cache'den oku
export async function getCachedAnalysis(
  placeName: string,
  placeLat: number,
  placeLng: number,
  category: string,
  companion: string
): Promise<ScoredPlace | null> {
  const key = getCacheKey(placeName, placeLat, placeLng, category, companion)
  
  // Memory cache kontrolü
  const memoryCached = memoryCache.get(key)
  if (memoryCached && Date.now() - memoryCached.timestamp < ANALYSIS_CACHE_TTL) {
    return memoryCached.data
  }
  
  // File cache kontrolü
  try {
    await ensureCacheDir()
    const filePath = getCacheFilePath(key)
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const cached: CachedAnalysis = JSON.parse(fileContent)
    
    if (Date.now() - cached.timestamp < ANALYSIS_CACHE_TTL) {
      // Memory cache'e ekle
      memoryCache.set(key, cached)
      return cached.data
    } else {
      // Expired cache'i sil
      await fs.unlink(filePath).catch(() => {})
    }
  } catch (error) {
    // Dosya yok veya okunamıyor, devam et
  }
  
  return null
}

// Cache'e yaz
export async function setCachedAnalysis(
  placeName: string,
  placeLat: number,
  placeLng: number,
  category: string,
  companion: string,
  data: ScoredPlace
): Promise<void> {
  const key = getCacheKey(placeName, placeLat, placeLng, category, companion)
  
  const cached: CachedAnalysis = {
    data,
    timestamp: Date.now(),
    category,
    companion,
  }
  
  // Memory cache'e ekle
  memoryCache.set(key, cached)
  
  // File cache'e yaz
  try {
    await ensureCacheDir()
    const filePath = getCacheFilePath(key)
    await fs.writeFile(filePath, JSON.stringify(cached, null, 2), 'utf-8')
  } catch (error) {
    logger.error('Error writing cache file', error instanceof Error ? error : new Error(String(error)), { key })
    // Memory cache'de kaldı, devam et
  }
}

// Tüm cache'i temizle (opsiyonel)
export async function clearCache(): Promise<void> {
  memoryCache.clear()
  try {
    await ensureCacheDir()
    const files = await fs.readdir(CACHE_DIR)
    await Promise.all(
      files.map((file) => fs.unlink(path.join(CACHE_DIR, file)).catch(() => {}))
    )
  } catch (error) {
    logger.error('Error clearing cache', error instanceof Error ? error : new Error(String(error)), {})
  }
}

// Eski cache'leri temizle (24 saatten eski)
export async function cleanExpiredCache(): Promise<void> {
  try {
    await ensureCacheDir()
    const files = await fs.readdir(CACHE_DIR)
    const now = Date.now()
    
    await Promise.all(
      files.map(async (file) => {
        try {
          const filePath = path.join(CACHE_DIR, file)
          const content = await fs.readFile(filePath, 'utf-8')
          const cached: CachedAnalysis = JSON.parse(content)
          
          if (now - cached.timestamp > ANALYSIS_CACHE_TTL) {
            await fs.unlink(filePath)
            // Memory cache'den de sil
            const key = getCacheKey(
              cached.data.name,
              cached.data.lat || 0,
              cached.data.lng || 0,
              cached.category,
              cached.companion
            )
            memoryCache.delete(key)
          }
        } catch (error) {
          // Hatalı dosya, sil
          await fs.unlink(path.join(CACHE_DIR, file)).catch(() => {})
        }
      })
    )
  } catch (error) {
    logger.error('Error cleaning expired cache', error instanceof Error ? error : new Error(String(error)), {})
  }
}

