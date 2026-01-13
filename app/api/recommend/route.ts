import { NextRequest, NextResponse } from 'next/server'
import { getPlacesWithAnalyses } from '@/lib/db'
import { ScoredPlace } from '@/lib/types/place'
import { validateRecommendationInput } from '@/lib/security/input-sanitization'
import { withRateLimit } from '@/lib/security/rate-limiting'
import { logger } from '@/lib/logging/logger'
import { handleError, CustomError } from '@/lib/utils/error-handler'
import { getCachedQuery, setCachedQuery } from '@/lib/cache/query-cache'
import { USER_NEED_CATEGORIES, getGoogleMapsTypesForUserNeed } from '@/lib/config/user-needs-categories'
import { GOOGLE_MAPS_CATEGORY_GROUPS, getPlaceTypesForCategoryGroup } from '@/lib/config/google-maps-category-groups'
import { RecommendationEngine } from '@/lib/recommendation/engine'
import { convertPlaceToFeatures } from '@/lib/utils/place-converter'
import type { UserProfile } from '@/lib/types/user-profile'

async function handleRecommend(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      lat, 
      lng, 
      address, 
      category, 
      companion,
      budget,
      atmosphere,
      mealType,
      specialNeeds, // Comma-separated string veya array
    } = body

    // Güvenli input validasyonu
    const validation = validateRecommendationInput({ lat, lng, category, companion })
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validation.errors.join(', ') 
        },
        { status: 400 }
      )
    }

    // Category artık kullanıcı ihtiyaç kategorisi olabilir (yemek, kahve, vb.)
    // Veya eski sistem için Google Maps kategori grubu (restaurants, hotels, vb.)
    // Veya spesifik Google Maps place type (restaurant, cafe, vb.)
    const categoryInput = category.toLowerCase().trim()
    
    // Kategori tipine göre Google Maps kategorilerini belirle
    let googleMapsTypes: string[] = []
    let categoryForLogging = categoryInput
    
    if (USER_NEED_CATEGORIES[categoryInput]) {
      // Kullanıcı ihtiyaç kategorisi - Google Maps kategorilerine map et
      googleMapsTypes = getGoogleMapsTypesForUserNeed(categoryInput)
      categoryForLogging = `${categoryInput} (user need) → [${googleMapsTypes.join(', ')}]`
      logger.info('User need category detected', { userNeed: categoryInput, googleMapsTypes })
    } else if (GOOGLE_MAPS_CATEGORY_GROUPS[categoryInput]) {
      // Google Maps kategori grubu
      googleMapsTypes = getPlaceTypesForCategoryGroup(categoryInput)
      categoryForLogging = `${categoryInput} (category group) → [${googleMapsTypes.join(', ')}]`
      logger.info('Category group detected', { categoryGroup: categoryInput, googleMapsTypes })
    } else {
      // Spesifik Google Maps place type (backward compatibility)
      googleMapsTypes = [categoryInput]
      categoryForLogging = `${categoryInput} (place type)`
      logger.info('Place type detected', { placeType: categoryInput })
    }

    // Special needs'i parse et
    let parsedSpecialNeeds: UserProfile['specialNeeds'] | undefined = undefined
    if (specialNeeds) {
      const needsArray = Array.isArray(specialNeeds) 
        ? specialNeeds 
        : typeof specialNeeds === 'string' 
          ? specialNeeds.split(',')
          : []
      
      parsedSpecialNeeds = {
        wheelchair: needsArray.includes('wheelchair'),
        petFriendly: needsArray.includes('petFriendly'),
        kidFriendly: needsArray.includes('kidFriendly'),
        parking: needsArray.includes('parking'),
        wifi: needsArray.includes('wifi'),
        vegetarian: needsArray.includes('vegetarian'),
        vegan: needsArray.includes('vegan'),
      }
    }

    logger.info('Starting recommendation process', { 
      lat, 
      lng, 
      category: categoryForLogging, 
      companion, 
      googleMapsTypes,
      budget,
      atmosphere,
      mealType,
      specialNeeds: parsedSpecialNeeds,
    })

    // Cache kontrolü (tüm faktörlerle)
    const cacheKey = { 
      lat, 
      lng, 
      category: categoryInput, 
      companion,
      budget,
      atmosphere,
      mealType,
      specialNeeds: parsedSpecialNeeds,
    }
    const cachedResult = getCachedQuery(cacheKey)
    
    if (cachedResult) {
      logger.info('Returning cached results', { count: cachedResult.length })
      return NextResponse.json({
        places: cachedResult,
        cached: true,
      })
    }

    // Database'den mekanları ve analizleri çek
    // getPlacesWithAnalyses artık kullanıcı ihtiyaç kategorisini veya Google Maps kategorilerini kabul ediyor
    try {
      // Kullanıcı ihtiyaç kategorisi için özel bir ID oluştur (tüm Google Maps kategorilerini içeren)
      // Veya direkt googleMapsTypes array'ini kullan
      const categoryForQuery = USER_NEED_CATEGORIES[categoryInput] 
        ? `user_need:${categoryInput}` // Özel prefix ile kullanıcı ihtiyaç kategorisi
        : categoryInput // Eski sistem için direkt kullan
      
      const places = await getPlacesWithAnalyses(lat, lng, categoryForQuery, companion, 50, googleMapsTypes) // Daha fazla mekan çek (öneri motoru ile filtreleriz)
      
      logger.info(`Found ${places.length} places from database`, { category: categoryForLogging, companion, count: places.length })

      if (places.length === 0) {
        return NextResponse.json({
          places: [],
          message: 'No places found in this area. Try a different location or category.',
        })
      }

      // Kullanıcı profili oluştur
      const userProfile: UserProfile = {
        location: { lat, lng, address: address || '' },
        category: categoryInput,
        companion: companion as UserProfile['companion'],
        budget: budget as UserProfile['budget'] | undefined,
        atmosphere: atmosphere as UserProfile['atmosphere'] | undefined,
        mealType: mealType as UserProfile['mealType'] | undefined,
        specialNeeds: parsedSpecialNeeds,
        limit: 10,
      }

      // PlaceFeatures formatına dönüştür
      const placeFeatures = places.map(convertPlaceToFeatures)

        // Öneri motoru ile önerileri hesapla
        const engine = new RecommendationEngine()
        
        // Diversity options (şimdilik boş, gelecekte kullanıcı geçmişi eklenebilir)
        const diversityOptions = {
          userHistory: [], // TODO: Kullanıcı geçmişi ekle
          userLikes: [],   // TODO: Kullanıcı beğenileri ekle
          userDislikes: [], // TODO: Kullanıcı beğenmeme ekle
        }
        
        const recommendations = await engine.recommend(placeFeatures, userProfile, undefined, diversityOptions)
      
      logger.info(`Recommendation engine processed ${recommendations.length} places`, {
        inputCount: places.length,
        outputCount: recommendations.length,
        profile: userProfile,
      })

      // ScoredPlace formatına geri dönüştür (frontend için)
      // Database'den gelen place'leri recommendation'larla eşleştir
      const scoredPlaces: ScoredPlace[] = recommendations.map(rec => {
        const originalPlace = places.find(
          p => p.name === rec.name && 
          Math.abs((p.lat || 0) - rec.lat) < 0.0001 && 
          Math.abs((p.lng || 0) - rec.lng) < 0.0001
        )
        
        if (!originalPlace) {
          // Eğer eşleşme bulunamazsa, rec'den oluştur
          return {
            name: rec.name,
            address: rec.address,
            score: rec.finalScore,
            why: rec.why || 'Kullanıcı profilinize uygun',
            risks: rec.risks,
            distance: rec.distance,
            rating: rec.rating,
            lat: rec.lat,
            lng: rec.lng,
            reviewCategories: rec.reviewScores ? Object.entries(rec.reviewScores).map(([name, score]) => ({
              name,
              score,
              positiveRatio: score / 100,
              positiveExamples: [],
              negativeExamples: [],
            })) : undefined,
            analyzedReviewCount: rec.reviewCount,
            totalReviewCount: rec.reviewCount,
            googleMapsId: undefined,
            placeId: undefined,
            priceLevel: rec.priceLevel === 0 ? 'FREE' :
                       rec.priceLevel === 1 ? 'INEXPENSIVE' :
                       rec.priceLevel === 2 ? 'MODERATE' :
                       rec.priceLevel === 3 ? 'EXPENSIVE' :
                       rec.priceLevel === 4 ? 'VERY_EXPENSIVE' : undefined,
            goodForChildren: rec.kidFriendly,
            servesBreakfast: rec.servesBreakfast,
            servesLunch: rec.servesLunch,
            servesDinner: rec.servesDinner,
            servesBrunch: rec.servesBrunch,
            servesVegetarianFood: rec.vegetarian,
          } as ScoredPlace
        }

        // Original place'i kullan, sadece score'u güncelle
        return {
          ...originalPlace,
          score: rec.finalScore, // Final score kullan
        } as ScoredPlace
      })

      // ESKİ KOD - Artık kullanılmıyor, öneri motoru kullanılıyor
      // Aşağıdaki kod backup için tutuluyor (comment out edildi)
      /*
      const scoredPlacesOld: ScoredPlace[] = places.map((place: any) => ({
        name: place.name,
        address: place.address,
        score: place.score,
        why: place.why,
        risks: place.risks || undefined,
        distance: place.distance,
        rating: place.rating || undefined,
        lat: place.lat,
        lng: place.lng,
        reviewCategories: place.reviewCategories,
        analyzedReviewCount: place.analyzedReviewCount ?? undefined,
        totalReviewCount: place.totalReviewCount ?? undefined,
        googleMapsId: place.googleMapsId || undefined,
        placeId: place.googleMapsId || undefined, // placeId için de googleMapsId kullan
        // Temel iletişim bilgileri - null'ları undefined'a çevir
        phone: place.phone || undefined,
        website: place.website || undefined,
        openingHours: (typeof place.openingHours === 'object' && place.openingHours !== null && !Array.isArray(place.openingHours))
          ? place.openingHours as ScoredPlace['openingHours']
          : undefined,
        photos: (Array.isArray(place.photos))
          ? place.photos as ScoredPlace['photos']
          : undefined,
        editorialSummary: place.editorialSummary || undefined,
        businessStatus: place.businessStatus || undefined,
        plusCode: place.plusCode || undefined,
        priceLevel: place.priceLevel || undefined,
        // Kapsamlı alanlar - null'ları undefined'a çevir
        shortFormattedAddress: place.shortFormattedAddress || undefined,
        addressComponents: place.addressComponents,
        viewport: place.viewport,
        primaryType: place.primaryType || undefined,
        primaryTypeDisplayName: place.primaryTypeDisplayName || undefined,
        accessibilityOptions: place.accessibilityOptions,
        evChargingOptions: place.evChargingOptions,
        fuelOptions: place.fuelOptions,
        goodForChildren: typeof place.goodForChildren === 'boolean' ? place.goodForChildren : (place.goodForChildren != null && place.goodForChildren === 1 ? true : (place.goodForChildren != null && place.goodForChildren === 0 ? false : undefined)),
        goodForGroups: typeof place.goodForGroups === 'boolean' ? place.goodForGroups : (place.goodForGroups != null && place.goodForGroups === 1 ? true : (place.goodForGroups != null && place.goodForGroups === 0 ? false : undefined)),
        goodForWatchingSports: typeof place.goodForWatchingSports === 'boolean' ? place.goodForWatchingSports : (place.goodForWatchingSports != null && place.goodForWatchingSports === 1 ? true : (place.goodForWatchingSports != null && place.goodForWatchingSports === 0 ? false : undefined)),
        indoorOptions: place.indoorOptions,
        liveMusic: typeof place.liveMusic === 'boolean' ? place.liveMusic : (place.liveMusic != null && place.liveMusic === 1 ? true : (place.liveMusic != null && place.liveMusic === 0 ? false : undefined)),
        menuForChildren: typeof place.menuForChildren === 'boolean' ? place.menuForChildren : (place.menuForChildren != null && place.menuForChildren === 1 ? true : (place.menuForChildren != null && place.menuForChildren === 0 ? false : undefined)),
        outdoorSeating: typeof place.outdoorSeating === 'boolean' ? place.outdoorSeating : (place.outdoorSeating != null && place.outdoorSeating === 1 ? true : (place.outdoorSeating != null && place.outdoorSeating === 0 ? false : undefined)),
        parkingOptions: place.parkingOptions,
        paymentOptions: place.paymentOptions,
        reservable: typeof place.reservable === 'boolean' ? place.reservable : (place.reservable != null && place.reservable === 1 ? true : (place.reservable != null && place.reservable === 0 ? false : undefined)),
        restroom: typeof place.restroom === 'boolean' ? place.restroom : (place.restroom != null && place.restroom === 1 ? true : (place.restroom != null && place.restroom === 0 ? false : undefined)),
        servesBreakfast: typeof place.servesBreakfast === 'boolean' ? place.servesBreakfast : (place.servesBreakfast != null && place.servesBreakfast === 1 ? true : (place.servesBreakfast != null && place.servesBreakfast === 0 ? false : undefined)),
        servesBrunch: typeof place.servesBrunch === 'boolean' ? place.servesBrunch : (place.servesBrunch != null && place.servesBrunch === 1 ? true : (place.servesBrunch != null && place.servesBrunch === 0 ? false : undefined)),
        servesDinner: typeof place.servesDinner === 'boolean' ? place.servesDinner : (place.servesDinner != null && place.servesDinner === 1 ? true : (place.servesDinner != null && place.servesDinner === 0 ? false : undefined)),
        servesLunch: typeof place.servesLunch === 'boolean' ? place.servesLunch : (place.servesLunch != null && place.servesLunch === 1 ? true : (place.servesLunch != null && place.servesLunch === 0 ? false : undefined)),
        servesBeer: typeof place.servesBeer === 'boolean' ? place.servesBeer : (place.servesBeer != null && place.servesBeer === 1 ? true : (place.servesBeer != null && place.servesBeer === 0 ? false : undefined)),
        servesWine: typeof place.servesWine === 'boolean' ? place.servesWine : (place.servesWine != null && place.servesWine === 1 ? true : (place.servesWine != null && place.servesWine === 0 ? false : undefined)),
        servesCocktails: typeof place.servesCocktails === 'boolean' ? place.servesCocktails : (place.servesCocktails != null && place.servesCocktails === 1 ? true : (place.servesCocktails != null && place.servesCocktails === 0 ? false : undefined)),
        servesVegetarianFood: typeof place.servesVegetarianFood === 'boolean' ? place.servesVegetarianFood : (place.servesVegetarianFood != null && place.servesVegetarianFood === 1 ? true : (place.servesVegetarianFood != null && place.servesVegetarianFood === 0 ? false : undefined)),
        takeout: typeof place.takeout === 'boolean' ? place.takeout : (place.takeout != null && place.takeout === 1 ? true : (place.takeout != null && place.takeout === 0 ? false : undefined)),
        delivery: typeof place.delivery === 'boolean' ? place.delivery : (place.delivery != null && place.delivery === 1 ? true : (place.delivery != null && place.delivery === 0 ? false : undefined)),
        dineIn: typeof place.dineIn === 'boolean' ? place.dineIn : (place.dineIn != null && place.dineIn === 1 ? true : (place.dineIn != null && place.dineIn === 0 ? false : undefined)),
        subDestinations: place.subDestinations,
        currentSecondaryOpeningHours: place.currentSecondaryOpeningHours,
      }))
      */

      // Sonuçları cache'e kaydet
      setCachedQuery(cacheKey, scoredPlaces)

      return NextResponse.json({
        places: scoredPlaces,
        cached: false,
      })
    } catch (dbError) {
      logger.error('Database query failed', dbError instanceof Error ? dbError : undefined, { lat, lng, category, companion })
      const appError = handleError(dbError, { lat, lng, category, companion })
      return NextResponse.json(
        { 
          error: appError.code,
          message: appError.userMessage,
          details: process.env.NODE_ENV === 'development' ? appError.message : undefined
        },
        { status: appError.statusCode }
      )
    }
  } catch (error) {
    logger.error('Recommend error', error instanceof Error ? error : undefined, { 
      message: error instanceof Error ? error.message : 'Unknown error' 
    })
    const appError = handleError(error, {})
    return NextResponse.json(
      { 
        error: appError.code,
        message: appError.userMessage,
        details: process.env.NODE_ENV === 'development' ? appError.message : undefined
      },
      { status: appError.statusCode }
    )
  }
}

// Rate limiting ile wrap et
export const POST = withRateLimit(handleRecommend, {
  maxRequests: 100, // 100 requests per minute
  windowMs: 60 * 1000,
})

