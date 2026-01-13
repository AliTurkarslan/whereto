import { GoogleGenerativeAI } from '@google/generative-ai'
import { PlaceData } from '@/lib/scrapers/google-maps'
import { getCachedAnalysis, setCachedAnalysis } from '@/lib/cache/analysis-cache'
import { ScoredPlace } from '@/lib/types/place'
import { ReviewCategory } from '@/lib/types/review'
import { analyzeReviewsSimple } from '@/lib/analysis/simple-scoring'
import { sampleReviews, Review as ReviewSample } from '@/lib/utils/review-sampling'
import { logger } from '@/lib/logging/logger'

export type { ScoredPlace, ReviewCategory }

interface ScoreOptions {
  category: string
  companion: string
  userLocation: { lat: number; lng: number }
}

export async function scorePlaces(
  places: PlaceData[],
  options: ScoreOptions
): Promise<ScoredPlace[]> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  
  // API key yoksa basit skorlama yap
  if (!apiKey || apiKey.trim() === '') {
    logger.warn('GOOGLE_AI_API_KEY not set, using simple scoring', { placesCount: places.length })
    return places.map((place) => {
      const distance = place.lat && place.lng
        ? calculateDistance(
            options.userLocation.lat,
            options.userLocation.lng,
            place.lat,
            place.lng
          )
        : undefined

      // Yorumlar varsa basit analiz yap
      if (place.reviews && place.reviews.length > 0) {
        const simpleAnalysis = analyzeReviewsSimple(
          place.reviews.map(text => ({ text })),
          options.category,
          options.companion
        )

        return {
          name: place.name,
          address: place.address,
          score: simpleAnalysis.score,
          why: simpleAnalysis.why,
          risks: simpleAnalysis.risks,
          lat: place.lat,
          lng: place.lng,
          rating: place.rating,
          distance,
          reviewCategories: simpleAnalysis.reviewCategories,
        }
      }

      // Yorum yoksa rating'e göre
      return {
        name: place.name,
        address: place.address,
        score: place.rating ? Math.round(place.rating * 20) : 50,
        why: 'Yorum verisi yetersiz',
        lat: place.lat,
        lng: place.lng,
        rating: place.rating,
        distance,
      }
    })
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  // Önce cache'den kontrol et
  const placesToAnalyze: PlaceData[] = []
  const cachedPlaces: ScoredPlace[] = []

  for (const place of places) {
    if (place.lat && place.lng) {
      const cached = await getCachedAnalysis(
        place.name,
        place.lat,
        place.lng,
        options.category,
        options.companion
      )
      
      if (cached) {
        // Mesafe hesapla ve ekle
        const distance = calculateDistance(
          options.userLocation.lat,
          options.userLocation.lng,
          place.lat,
          place.lng
        )
        cachedPlaces.push({ ...cached, distance })
      } else if (place.reviews && place.reviews.length > 0) {
        // Cache'de yok, analiz edilecek listeye ekle
        placesToAnalyze.push(place)
      }
    }
  }

  // Yorumları birleştir (cache'de olmayanlar)
  const placesWithReviews = placesToAnalyze.slice(0, 10) // İlk 10 mekanı analiz et

  if (placesWithReviews.length === 0) {
    // Yorum yoksa basit skorlama (rating'e göre)
    return places.map((place) => {
      const distance = place.lat && place.lng
        ? calculateDistance(
            options.userLocation.lat,
            options.userLocation.lng,
            place.lat,
            place.lng
          )
        : undefined

      return {
        name: place.name,
        address: place.address,
        score: place.rating ? Math.round(place.rating * 20) : 50,
        why: 'Yorum verisi yetersiz',
        lat: place.lat,
        lng: place.lng,
        rating: place.rating,
        distance,
      }
    })
  }

  // AI'ya gönderilecek prompt - Gelişmiş analiz ile
  const { buildEnhancedPrompt } = await import('./enhanced-prompt')
  
  // Gelişmiş faktörler (şimdilik sadece companion, sonra genişletilebilir)
  const analysisFactors = {
    companion: options.companion as 'alone' | 'partner' | 'friends' | 'family' | 'colleagues',
    priceLevel: placesWithReviews[0]?.priceLevel 
      ? (placesWithReviews[0].priceLevel === 'FREE' ? 0 as const :
         placesWithReviews[0].priceLevel === 'INEXPENSIVE' ? 1 as const :
         placesWithReviews[0].priceLevel === 'MODERATE' ? 2 as const :
         placesWithReviews[0].priceLevel === 'EXPENSIVE' ? 3 as const : 4 as const)
      : undefined,
  }

  const prompt = buildEnhancedPrompt(
    placesWithReviews.map(place => ({
      name: place.name,
      address: place.address,
      rating: place.rating,
      reviewCount: place.reviews?.length || 0,
      reviews: place.reviews || [],
      priceLevel: analysisFactors.priceLevel,
      cuisineType: undefined, // TODO: Database'den çek
    })),
    options.category,
    analysisFactors
  )

  // Retry mekanizması - 503 hatası için exponential backoff
  const maxRetries = 3
  let lastError: any = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from AI')
      }

      // JSON'u parse et
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('AI response does not contain valid JSON')
      }

      const parsed = JSON.parse(jsonMatch[0])
      const scoredPlaces: ScoredPlace[] = []

      // AI'dan gelen skorları mekanlarla eşleştir
      // Error handling: Bir mekan hata verirse diğerlerini etkilemesin
      const analyzedPlacesResults = await Promise.allSettled(
        placesWithReviews.map(async (place, idx) => {
          const aiResult = parsed.places?.[idx]
          if (aiResult) {
            const distance = place.lat && place.lng
              ? calculateDistance(
                  options.userLocation.lat,
                  options.userLocation.lng,
                  place.lat,
                  place.lng
                )
              : undefined

            const scoredPlace: ScoredPlace = {
              name: place.name,
              address: place.address,
              score: aiResult.score || 50,
              why: aiResult.why || 'Değerlendirme yapılamadı',
              risks: aiResult.risks || undefined,
              distance,
              rating: place.rating,
              lat: place.lat,
              lng: place.lng,
              reviewCategories: aiResult.reviewCategories || undefined,
            }

            // Cache'e kaydet
            if (place.lat && place.lng) {
              await setCachedAnalysis(
                place.name,
                place.lat,
                place.lng,
                options.category,
                options.companion,
                scoredPlace
              )
            }

            return scoredPlace
          } else {
            // AI sonuç bulamadıysa varsayılan skor
            return {
              name: place.name,
              address: place.address,
              score: place.rating ? Math.round(place.rating * 20) : 50,
              why: 'Yorum analizi yapılamadı',
              lat: place.lat,
              lng: place.lng,
              rating: place.rating,
            }
          }
        })
      )

      // Promise.allSettled sonuçlarını işle - başarılı olanları al, hatalı olanları logla
      const analyzedPlaces = analyzedPlacesResults
        .map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value
          } else {
            // Hata durumunda logla ama devam et
            const place = placesWithReviews[index]
            logger.warn(
              `Failed to analyze place: ${place?.name || 'unknown'}`,
              {
                placeName: place?.name,
                category: options.category,
                companion: options.companion,
                error: result.reason instanceof Error ? result.reason.message : String(result.reason),
              }
            )
            // Fallback: Basit skorlama
            return {
              name: place?.name || 'Unknown',
              address: place?.address || '',
              score: place?.rating ? Math.round(place.rating * 20) : 50,
              why: 'AI analizi başarısız, rating bazlı skorlama',
              lat: place?.lat,
              lng: place?.lng,
              rating: place?.rating,
            } as ScoredPlace
          }
        })
        .filter((place): place is ScoredPlace => place !== null)

      scoredPlaces.push(...analyzedPlaces)

      // Yorumu olmayan mekanları da ekle
      places
        .filter((p) => !p.reviews || p.reviews.length === 0)
        .forEach((place) => {
          const distance = place.lat && place.lng
            ? calculateDistance(
                options.userLocation.lat,
                options.userLocation.lng,
                place.lat,
                place.lng
              )
            : undefined

          scoredPlaces.push({
            name: place.name,
            address: place.address,
            score: place.rating ? Math.round(place.rating * 20) : 50,
            why: 'Yorum verisi yetersiz',
            lat: place.lat,
            lng: place.lng,
            rating: place.rating,
            distance,
          })
        })

      // Cache'den gelenleri de ekle
      scoredPlaces.push(...cachedPlaces)

      // Skora göre sırala (yüksekten düşüğe)
      return scoredPlaces.sort((a, b) => b.score - a.score)
    } catch (error: any) {
      lastError = error
      
      // 503 (Service Unavailable) veya 429 (Rate Limit) hatası ise retry yap
      const isRetryable = error?.status === 503 || error?.status === 429 || 
                         error?.message?.includes('overloaded') ||
                         error?.message?.includes('rate limit')
      
      if (isRetryable && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000 // Exponential backoff: 1s, 2s, 4s
        logger.warn(`⚠️  AI model overloaded (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay/1000}s...`, { attempt: attempt + 1, maxRetries, delay: delay/1000 })
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // Son deneme veya retry edilemeyen hata
      throw error
    }
  }
  
  // Tüm retry'lar başarısız oldu
  logger.error('AI scoring error (all retries failed)', lastError instanceof Error ? lastError : new Error(String(lastError)), { placesCount: places.length, category: options.category })
  
  // Hata durumunda basit skorlama
  return places.map((place) => {
    const distance = place.lat && place.lng
      ? calculateDistance(
          options.userLocation.lat,
          options.userLocation.lng,
          place.lat,
          place.lng
        )
      : undefined

    return {
      name: place.name,
      address: place.address,
      score: place.rating ? Math.round(place.rating * 20) : 50,
      why: 'AI analizi yapılamadı, puan bazlı skorlama',
      lat: place.lat,
      lng: place.lng,
      rating: place.rating,
      distance,
    }
  })
}

// Mesafe hesaplama helper
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Dünya yarıçapı (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

