/**
 * Öneri Motoru
 * 
 * Kullanıcı profili ile mekan özelliklerini eşleştirerek
 * kişiselleştirilmiş öneriler sunan motor
 */

import { UserProfile, UserProfileVector, profileToVector } from '@/lib/types/user-profile'
import { PlaceFeatures, ScoredPlace } from '@/lib/types/place-features'
import { isPlaceOpen, isOpenLate, isOpeningSoon } from '@/lib/utils/opening-hours'
import { getCurrentContext, adjustRecommendationsByContext, Context } from '@/lib/context/context-aware'
import { addDiversityBonus, DiversityOptions, addSerendipityBonus } from '@/lib/recommendation/diversity'

export class RecommendationEngine {
  /**
   * Ana öneri fonksiyonu
   */
  async recommend(
    places: PlaceFeatures[],
    profile: UserProfile,
    context?: Context,
    diversityOptions?: DiversityOptions
  ): Promise<ScoredPlace[]> {
    // 1. Filtreleme: Temel kriterlere uymayanları çıkar
    const filtered = this.filterPlaces(places, profile)
    
    // 2. Skorlama: Her mekan için uygunluk skoru hesapla
    const profileVector = profileToVector(profile)
    const scored = this.scorePlaces(filtered, profileVector)
    
    // 3. Context awareness: Zaman, hava durumu, etkinlik bağlamına göre ayarla
    const currentContext = context || getCurrentContext({
      city: profile.location.address?.split(',')[0], // Basit parsing
      district: profile.location.address?.split(',')[1],
    })
    const contextAdjusted = adjustRecommendationsByContext(scored, currentContext)
    
    // 4. Diversity ve Novelty: Çeşitlilik bonusu ekle
    const diversityAdjusted = addDiversityBonus(contextAdjusted, diversityOptions || {})
    
    // 5. Serendipity: Beklenmedik ama uygun öneriler için bonus
    const serendipityAdjusted = addSerendipityBonus(
      diversityAdjusted,
      diversityOptions?.userHistory || []
    )
    
    // 6. Sıralama: Skora göre sırala
    const sorted = this.sortPlaces(serendipityAdjusted)
    
    // 7. Top N: En iyi N öneri
    const limit = profile.limit || 10
    return sorted.slice(0, limit)
  }
  
  /**
   * Filtreleme: Temel kriterlere uymayanları çıkar
   */
  private filterPlaces(places: PlaceFeatures[], profile: UserProfile): PlaceFeatures[] {
    return places.filter(place => {
      // Opening hours kontrolü - Kapalı mekanları filtrele
      if (!isPlaceOpen(place)) {
        return false
      }
      
      // Bütçe filtresi
      if (profile.budget && profile.budget !== 'any') {
        const budgetMap: Record<Exclude<UserProfile['budget'], undefined | 'any'>, number[]> = {
          budget: [0, 1],      // FREE, INEXPENSIVE
          moderate: [2],       // MODERATE
          premium: [3, 4],     // EXPENSIVE, VERY_EXPENSIVE
        }
        const allowedLevels = budgetMap[profile.budget]
        if (!allowedLevels.includes(place.priceLevel)) {
          return false
        }
      }
      
      // Özel ihtiyaçlar filtresi (zorunlu olanlar)
      if (profile.specialNeeds) {
        if (profile.specialNeeds.wheelchair && !place.wheelchairAccessible) {
          return false
        }
        if (profile.specialNeeds.petFriendly && !place.petFriendly) {
          return false
        }
        if (profile.specialNeeds.kidFriendly && !place.kidFriendly) {
          return false
        }
        if (profile.specialNeeds.parking && !place.parking) {
          return false
        }
        if (profile.specialNeeds.wifi && !place.wifi) {
          return false
        }
        if (profile.specialNeeds.vegetarian && !place.vegetarian) {
          return false
        }
        if (profile.specialNeeds.vegan && !place.vegan) {
          return false
        }
      }
      
      // Zaman filtresi
      if (profile.mealType && profile.mealType !== 'any') {
        const mealMap: Record<Exclude<UserProfile['mealType'], undefined | 'any'>, boolean | undefined> = {
          breakfast: place.servesBreakfast,
          lunch: place.servesLunch,
          dinner: place.servesDinner,
          brunch: place.servesBrunch,
          'late-night': this.isOpenLate(place),
        }
        const isAvailable = mealMap[profile.mealType]
        if (!isAvailable) {
          return false
        }
      }
      
      return true
    })
  }
  
  /**
   * Skorlama: Her mekan için uygunluk skoru hesapla
   */
  private scorePlaces(places: PlaceFeatures[], profileVector: UserProfileVector): ScoredPlace[] {
    return places.map(place => {
      const matchDetails = {
        budgetMatch: this.calculateBudgetMatch(place.priceLevel, profileVector.budget),
        atmosphereMatch: this.calculateAtmosphereMatch(place.atmosphere, profileVector.atmosphere),
        specialNeedsMatch: this.calculateSpecialNeedsMatch(place, profileVector.specialNeeds),
        mealTypeMatch: this.calculateMealTypeMatch(place, profileVector.mealType),
        reviewMatch: this.calculateReviewMatch(place.reviewScores, profileVector),
      }
      
      // Ağırlıklandırılmış skor
      const matchScore = this.calculateWeightedScore(matchDetails)
      
      // Final skor: Match score + AI score kombinasyonu
      const aiScore = place.score || 50 // AI skoru yoksa varsayılan 50
      
      // Distance weighting - Yakın mekanlara bonus
      const distanceBonus = this.calculateDistanceBonus(place.distance)
      
      // Opening soon bonus - Yakında açılacak mekanlara bonus
      const openingSoonBonus = isOpeningSoon(place, 30) ? 3 : 0
      
      // Base score
      const baseScore = (matchScore * 0.6) + (aiScore * 0.4) // %60 match, %40 AI
      
      // Final score with bonuses
      const finalScore = Math.min(100, baseScore + distanceBonus + openingSoonBonus)
      
      return {
        ...place,
        matchScore: Math.round(matchScore),
        finalScore: Math.round(finalScore),
        matchDetails,
      }
    })
  }
  
  /**
   * Sıralama: Skora göre sırala
   */
  private sortPlaces(places: ScoredPlace[]): ScoredPlace[] {
    return places.sort((a, b) => {
      // Önce final score'a göre
      if (b.finalScore !== a.finalScore) {
        return b.finalScore - a.finalScore
      }
      // Sonra match score'a göre
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore
      }
      // Son olarak distance'a göre (yakın olan önce)
      return a.distance - b.distance
    })
  }
  
  /**
   * Bütçe uyumu hesapla (0-100)
   */
  private calculateBudgetMatch(placePriceLevel: number, userBudget: number): number {
    if (userBudget === -1) return 100 // "any" seçilmişse tam uyum
    
    const diff = Math.abs(placePriceLevel - userBudget)
    
    // Her fark -25 puan (0 fark = 100, 1 fark = 75, 2 fark = 50, vb.)
    return Math.max(0, 100 - (diff * 25))
  }
  
  /**
   * Ortam uyumu hesapla (0-100)
   */
  private calculateAtmosphereMatch(placeAtmosphere: string | undefined, userAtmosphere: number): number {
    if (userAtmosphere === -1) return 100 // "any" seçilmişse tam uyum
    if (!placeAtmosphere) return 50 // Ortam bilgisi yoksa orta skor
    
    const atmosphereMap: Record<string, number> = {
      quiet: 0,
      lively: 1,
      romantic: 2,
      casual: 3,
      formal: 4,
    }
    
    const placeAtmosphereNum = atmosphereMap[placeAtmosphere.toLowerCase()] ?? -1
    if (placeAtmosphereNum === -1) return 50 // Bilinmeyen ortam tipi
    
    const diff = Math.abs(placeAtmosphereNum - userAtmosphere)
    return Math.max(0, 100 - (diff * 25))
  }
  
  /**
   * Özel ihtiyaçlar uyumu hesapla (0-100)
   */
  private calculateSpecialNeedsMatch(place: PlaceFeatures, needs: number[]): number {
    const totalNeeds = needs.filter(n => n === 1).length
    if (totalNeeds === 0) return 100 // Özel ihtiyaç yoksa tam uyum
    
    let matchCount = 0
    
    if (needs[0] === 1 && place.wheelchairAccessible) matchCount++
    if (needs[1] === 1 && place.petFriendly) matchCount++
    if (needs[2] === 1 && place.kidFriendly) matchCount++
    if (needs[3] === 1 && place.parking) matchCount++
    if (needs[4] === 1 && place.wifi) matchCount++
    if (needs[5] === 1 && place.vegetarian) matchCount++
    if (needs[6] === 1 && place.vegan) matchCount++
    
    return (matchCount / totalNeeds) * 100
  }
  
  /**
   * Zaman uyumu hesapla (0-100)
   */
  private calculateMealTypeMatch(place: PlaceFeatures, userMealType: number): number {
    if (userMealType === -1) return 100 // "any" seçilmişse tam uyum
    
    const mealTypeMap: Record<number, boolean | undefined> = {
      0: place.servesBreakfast,  // breakfast
      1: place.servesLunch,      // lunch
      2: place.servesDinner,     // dinner
      3: place.servesBrunch,     // brunch
      4: this.isOpenLate(place), // late-night
    }
    
    const isAvailable = mealTypeMap[userMealType]
    return isAvailable ? 100 : 0
  }
  
  /**
   * Yorum analizi uyumu hesapla (0-100)
   */
  private calculateReviewMatch(reviewScores: PlaceFeatures['reviewScores'], profileVector: UserProfileVector): number {
    if (!reviewScores) return 50 // Yorum skoru yoksa orta skor
    
    // Companion'a göre ağırlıklandırma
    const companionWeights: Record<number, { [key: string]: number }> = {
      0: { quality: 0.3, price: 0.3, atmosphere: 0.2, service: 0.2 }, // alone
      1: { quality: 0.25, atmosphere: 0.3, service: 0.25, price: 0.2 }, // partner
      2: { atmosphere: 0.3, quality: 0.25, service: 0.25, price: 0.2 }, // friends
      3: { cleanliness: 0.3, quality: 0.25, service: 0.25, location: 0.2 }, // family
      4: { service: 0.3, quality: 0.25, location: 0.25, price: 0.2 }, // colleagues
    }
    
    const weights = companionWeights[profileVector.companion] || companionWeights[0]
    
    let weightedScore = 0
    let totalWeight = 0
    
    for (const [category, weight] of Object.entries(weights)) {
      const score = reviewScores[category as keyof typeof reviewScores]
      if (score !== undefined) {
        weightedScore += score * weight
        totalWeight += weight
      }
    }
    
    return totalWeight > 0 ? weightedScore / totalWeight : 50
  }
  
  /**
   * Ağırlıklandırılmış skor hesapla
   */
  private calculateWeightedScore(matchDetails: ScoredPlace['matchDetails']): number {
    if (!matchDetails) return 50
    
    // Ağırlıklar
    const weights = {
      budgetMatch: 0.20,        // %20
      atmosphereMatch: 0.25,    // %25
      specialNeedsMatch: 0.20,  // %20
      mealTypeMatch: 0.15,      // %15
      reviewMatch: 0.20,        // %20
    }
    
    return (
      matchDetails.budgetMatch * weights.budgetMatch +
      matchDetails.atmosphereMatch * weights.atmosphereMatch +
      matchDetails.specialNeedsMatch * weights.specialNeedsMatch +
      matchDetails.mealTypeMatch * weights.mealTypeMatch +
      matchDetails.reviewMatch * weights.reviewMatch
    )
  }
  
  /**
   * Gece geç saatlerde açık mı kontrol et
   */
  private isOpenLate(place: PlaceFeatures): boolean {
    return isOpenLate(place)
  }
  
  /**
   * Distance bonus hesapla - Yakın mekanlara bonus ver
   * 
   * Distance decay function:
   * - 0-1 km: +10 puan
   * - 1-2 km: +7 puan
   * - 2-3 km: +5 puan
   * - 3-5 km: +3 puan
   * - 5+ km: 0 puan
   */
  private calculateDistanceBonus(distance: number): number {
    if (distance <= 1) return 10
    if (distance <= 2) return 7
    if (distance <= 3) return 5
    if (distance <= 5) return 3
    return 0
  }
}

