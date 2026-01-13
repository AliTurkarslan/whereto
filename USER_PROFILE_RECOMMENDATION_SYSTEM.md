# 🎯 Kullanıcı Profili ve Öneri Motoru Sistemi - Kapsamlı Plan

## 📋 Genel Bakış

Kullanıcıların tercihlerini anlayan, makine öğrenmesi destekli bir öneri sistemi geliştiriyoruz. Sistem, kullanıcı profili oluşturup yorumları analiz ederek kişiselleştirilmiş öneriler sunacak.

---

## 🎨 1. KULLANICI PROFİLİ SİSTEMİ

### 1.1 Profil Faktörleri

**Temel Faktörler (Mevcut):**
- ✅ Konum (lat, lng, address)
- ✅ Kategori (yemek, kahve, vb.)
- ✅ Companion (alone, partner, friends, family, colleagues)

**Yeni Faktörler (Eklenecek):**

#### 1.1.1 Bütçe Tercihi
```typescript
type BudgetPreference = 'budget' | 'moderate' | 'premium' | 'any'
```
- **budget**: Ekonomik (0-1 price level)
- **moderate**: Orta seviye (2 price level)
- **premium**: Lüks (3-4 price level)
- **any**: Fark etmez

#### 1.1.2 Ortam Tercihi
```typescript
type AtmospherePreference = 'quiet' | 'lively' | 'romantic' | 'casual' | 'formal' | 'any'
```
- **quiet**: Sessiz, huzurlu
- **lively**: Neşeli, canlı
- **romantic**: Romantik
- **casual**: Gündelik, rahat
- **formal**: Resmi
- **any**: Fark etmez

#### 1.1.3 Zaman Tercihi
```typescript
type MealTypePreference = 'breakfast' | 'lunch' | 'dinner' | 'brunch' | 'late-night' | 'any'
```
- **breakfast**: Kahvaltı
- **lunch**: Öğle yemeği
- **dinner**: Akşam yemeği
- **brunch**: Brunch
- **late-night**: Gece
- **any**: Fark etmez

#### 1.1.4 Özel İhtiyaçlar
```typescript
interface SpecialNeeds {
  wheelchair?: boolean      // Tekerlekli sandalye erişimi
  petFriendly?: boolean    // Evcil hayvan dostu
  kidFriendly?: boolean     // Çocuk dostu
  parking?: boolean        // Park yeri
  wifi?: boolean           // WiFi
  vegetarian?: boolean     // Vejetaryen seçenekler
  vegan?: boolean          // Vegan seçenekler
}
```

### 1.2 Profil Veri Yapısı

```typescript
interface UserProfile {
  // Temel bilgiler
  location: {
    lat: number
    lng: number
    address: string
  }
  category: string
  
  // Companion
  companion: 'alone' | 'partner' | 'friends' | 'family' | 'colleagues'
  
  // Yeni faktörler
  budget?: BudgetPreference
  atmosphere?: AtmospherePreference
  mealType?: MealTypePreference
  specialNeeds?: SpecialNeeds
  
  // ML için
  preferences?: {
    // Geçmiş tercihler (gelecekte kullanılacak)
    favoriteCuisines?: string[]
    favoritePriceLevels?: number[]
    favoriteAtmospheres?: string[]
  }
}
```

---

## 🧠 2. MAKİNE ÖĞRENMESİ YAKLAŞIMI

### 2.1 Hybrid Recommendation System

**İçerik Tabanlı Filtreleme (Content-Based):**
- Kullanıcı profili ile mekan özelliklerini eşleştir
- Faktör bazlı skorlama
- Özellik vektörleri oluştur

**İşbirlikçi Filtreleme (Collaborative):**
- Benzer kullanıcıların tercihlerini analiz et
- Gelecekte: Kullanıcı geçmişi ile

**Hibrit Yaklaşım:**
- İçerik tabanlı + İşbirlikçi
- Ağırlıklandırma: %70 içerik, %30 işbirlikçi (başlangıç)

### 2.2 Özellik Vektörleri

**Mekan Özellikleri:**
```typescript
interface PlaceFeatures {
  // Temel
  priceLevel: 0 | 1 | 2 | 3 | 4
  rating: number
  reviewCount: number
  distance: number
  
  // Kültür
  cuisineType?: string
  
  // Ortam (yorumlardan çıkarılacak)
  atmosphere?: 'quiet' | 'lively' | 'romantic' | 'casual' | 'formal'
  
  // Özel özellikler
  wheelchairAccessible?: boolean
  petFriendly?: boolean
  kidFriendly?: boolean
  parking?: boolean
  wifi?: boolean
  vegetarian?: boolean
  vegan?: boolean
  
  // Zaman
  servesBreakfast?: boolean
  servesLunch?: boolean
  servesDinner?: boolean
  servesBrunch?: boolean
  
  // Yorum analizi
  reviewScores: {
    service: number
    price: number
    quality: number
    atmosphere: number
    location: number
    cleanliness: number
    speed: number
  }
}
```

**Kullanıcı Profil Vektörü:**
```typescript
interface UserProfileVector {
  budget: number              // 0-4 (price level)
  atmosphere: number          // 0-4 (quiet=0, lively=1, romantic=2, casual=3, formal=4)
  mealType: number           // 0-4 (breakfast=0, lunch=1, dinner=2, brunch=3, late-night=4)
  specialNeeds: number[]     // Binary array [wheelchair, pet, kid, parking, wifi, veg, vegan]
  companion: number          // 0-4 (alone=0, partner=1, friends=2, family=3, colleagues=4)
}
```

### 2.3 Skorlama Algoritması

**Temel Skor:**
```typescript
function calculateMatchScore(
  place: PlaceFeatures,
  profile: UserProfileVector
): number {
  let score = 0
  let weight = 0
  
  // 1. Bütçe uyumu (0-100)
  const budgetScore = calculateBudgetMatch(place.priceLevel, profile.budget)
  score += budgetScore * 0.20  // %20 ağırlık
  weight += 0.20
  
  // 2. Ortam uyumu (0-100)
  const atmosphereScore = calculateAtmosphereMatch(place.atmosphere, profile.atmosphere)
  score += atmosphereScore * 0.25  // %25 ağırlık
  weight += 0.25
  
  // 3. Özel ihtiyaçlar uyumu (0-100)
  const specialNeedsScore = calculateSpecialNeedsMatch(place, profile.specialNeeds)
  score += specialNeedsScore * 0.20  // %20 ağırlık
  weight += 0.20
  
  // 4. Zaman uyumu (0-100)
  const mealTypeScore = calculateMealTypeMatch(place, profile.mealType)
  score += mealTypeScore * 0.15  // %15 ağırlık
  weight += 0.15
  
  // 5. Yorum analizi skoru (0-100)
  const reviewScore = calculateReviewScore(place.reviewScores, profile)
  score += reviewScore * 0.20  // %20 ağırlık
  weight += 0.20
  
  // Normalize
  return score / weight
}
```

**Faktör Bazlı Skorlama:**
```typescript
function calculateBudgetMatch(placePriceLevel: number, userBudget: number): number {
  if (userBudget === -1) return 100  // "any"
  
  const diff = Math.abs(placePriceLevel - userBudget)
  return Math.max(0, 100 - (diff * 25))  // Her fark -25 puan
}

function calculateAtmosphereMatch(placeAtmosphere: string, userAtmosphere: number): number {
  // Yorumlardan çıkarılan ortam ile kullanıcı tercihini eşleştir
  // ...
}

function calculateSpecialNeedsMatch(place: PlaceFeatures, needs: number[]): number {
  let matchCount = 0
  let totalNeeds = 0
  
  if (needs[0] && place.wheelchairAccessible) matchCount++
  if (needs[1] && place.petFriendly) matchCount++
  if (needs[2] && place.kidFriendly) matchCount++
  if (needs[3] && place.parking) matchCount++
  if (needs[4] && place.wifi) matchCount++
  
  totalNeeds = needs.filter(n => n === 1).length
  if (totalNeeds === 0) return 100
  
  return (matchCount / totalNeeds) * 100
}
```

---

## 📝 3. YORUM ANALİZİ GELİŞTİRMESİ

### 3.1 Ortam Tespiti (Yorumlardan)

**AI Prompt Güncellemesi:**
- Yorumlardan ortam bilgisi çıkar
- "sessiz", "gürültülü", "romantik", "canlı" gibi ifadeleri tespit et

**Basit Analiz (Regex + Keyword):**
```typescript
function detectAtmosphereFromReviews(reviews: string[]): 'quiet' | 'lively' | 'romantic' | 'casual' | 'formal' | undefined {
  const keywords = {
    quiet: ['sessiz', 'huzurlu', 'sakin', 'rahatlatıcı', 'quiet', 'peaceful'],
    lively: ['canlı', 'neşeli', 'eğlenceli', 'gürültülü', 'lively', 'energetic'],
    romantic: ['romantik', 'aşk', 'sevgili', 'romantic', 'intimate'],
    casual: ['gündelik', 'rahat', 'casual', 'relaxed'],
    formal: ['resmi', 'şık', 'formal', 'elegant', 'sophisticated'],
  }
  
  // Yorumlarda keyword sayısını say
  // En çok geçen ortam tipini döndür
}
```

### 3.2 Özel İhtiyaçlar Tespiti

**Yorumlardan:**
- "tekerlekli sandalye", "wheelchair" → wheelchairAccessible
- "köpek", "pet", "evcil hayvan" → petFriendly
- "çocuk", "kid", "aile" → kidFriendly
- "park", "otopark" → parking
- "wifi", "internet" → wifi
- "vejetaryen", "vegan" → vegetarian/vegan

**Google Places API'den:**
- `accessibilityOptions` → wheelchairAccessible
- `goodForChildren` → kidFriendly
- `parkingOptions` → parking

### 3.3 Zaman Uyumu

**Mekan Özellikleri:**
- `servesBreakfast` → breakfast uygun
- `servesLunch` → lunch uygun
- `servesDinner` → dinner uygun
- `servesBrunch` → brunch uygun
- `currentOpeningHours` → late-night kontrolü

---

## 🎨 4. UI/UX GELİŞTİRMESİ

### 4.1 Wizard Genişletmesi

**Mevcut:**
1. Location Step
2. Category Step
3. Companion Step

**Yeni:**
4. Budget Step (opsiyonel)
5. Atmosphere Step (opsiyonel)
6. Meal Type Step (opsiyonel)
7. Special Needs Step (opsiyonel)

**Yaklaşım:**
- **Seçenek 1**: Tüm adımları göster (7 adım)
- **Seçenek 2**: "Hızlı" ve "Detaylı" mod
  - Hızlı: Sadece temel (location, category, companion)
  - Detaylı: Tüm faktörler

**Önerilen: Seçenek 2 (Hızlı/Detaylı Mod)**

### 4.2 Yeni Step Component'leri

**BudgetStep.tsx:**
```typescript
- Radio buttons: Budget, Moderate, Premium, Any
- Görsel: $, $$, $$$, $$$$
```

**AtmosphereStep.tsx:**
```typescript
- Card selection: Quiet, Lively, Romantic, Casual, Formal, Any
- İkonlar ile
```

**MealTypeStep.tsx:**
```typescript
- Card selection: Breakfast, Lunch, Dinner, Brunch, Late-night, Any
- Zaman ikonları ile
```

**SpecialNeedsStep.tsx:**
```typescript
- Checkbox list:
  - ♿ Tekerlekli sandalye erişimi
  - 🐾 Evcil hayvan dostu
  - 👶 Çocuk dostu
  - 🅿️ Park yeri
  - 📶 WiFi
  - 🌱 Vejetaryen seçenekler
  - 🌿 Vegan seçenekler
```

### 4.3 Progress Stepper Güncellemesi

- Dinamik step sayısı
- Opsiyonel adımları göster/gizle

---

## 🔧 5. ÖNERİ MOTORU İMPLEMENTASYONU

### 5.1 Recommendation Engine

**Dosya:** `lib/recommendation/engine.ts`

```typescript
export class RecommendationEngine {
  /**
   * Ana öneri fonksiyonu
   */
  async recommend(
    places: PlaceFeatures[],
    profile: UserProfile
  ): Promise<ScoredPlace[]> {
    // 1. Filtreleme
    const filtered = this.filterPlaces(places, profile)
    
    // 2. Skorlama
    const scored = this.scorePlaces(filtered, profile)
    
    // 3. Sıralama
    const sorted = this.sortPlaces(scored)
    
    // 4. Top N
    return sorted.slice(0, profile.limit || 10)
  }
  
  /**
   * Filtreleme: Temel kriterlere uymayanları çıkar
   */
  private filterPlaces(places: PlaceFeatures[], profile: UserProfile): PlaceFeatures[] {
    return places.filter(place => {
      // Bütçe filtresi
      if (profile.budget && profile.budget !== 'any') {
        const budgetMap = { budget: [0, 1], moderate: [2], premium: [3, 4] }
        if (!budgetMap[profile.budget].includes(place.priceLevel)) {
          return false
        }
      }
      
      // Özel ihtiyaçlar filtresi
      if (profile.specialNeeds) {
        if (profile.specialNeeds.wheelchair && !place.wheelchairAccessible) return false
        if (profile.specialNeeds.petFriendly && !place.petFriendly) return false
        if (profile.specialNeeds.kidFriendly && !place.kidFriendly) return false
        if (profile.specialNeeds.parking && !place.parking) return false
        if (profile.specialNeeds.wifi && !place.wifi) return false
      }
      
      // Zaman filtresi
      if (profile.mealType && profile.mealType !== 'any') {
        const mealMap = {
          breakfast: place.servesBreakfast,
          lunch: place.servesLunch,
          dinner: place.servesDinner,
          brunch: place.servesBrunch,
          'late-night': this.isOpenLate(place),
        }
        if (!mealMap[profile.mealType]) return false
      }
      
      return true
    })
  }
  
  /**
   * Skorlama: Her mekan için uygunluk skoru hesapla
   */
  private scorePlaces(places: PlaceFeatures[], profile: UserProfile): ScoredPlace[] {
    return places.map(place => ({
      ...place,
      score: calculateMatchScore(place, this.profileToVector(profile)),
    }))
  }
  
  /**
   * Sıralama: Skora göre sırala
   */
  private sortPlaces(places: ScoredPlace[]): ScoredPlace[] {
    return places.sort((a, b) => b.score - a.score)
  }
  
  /**
   * Profil vektörüne dönüştür
   */
  private profileToVector(profile: UserProfile): UserProfileVector {
    // ...
  }
}
```

### 5.2 API Route Güncellemesi

**`app/api/recommend/route.ts`:**

```typescript
export async function POST(request: Request) {
  const body = await request.json()
  const {
    lat, lng, address, category, companion,
    budget, atmosphere, mealType, specialNeeds, // Yeni parametreler
  } = body
  
  // User profile oluştur
  const profile: UserProfile = {
    location: { lat, lng, address },
    category,
    companion,
    budget,
    atmosphere,
    mealType,
    specialNeeds,
  }
  
  // Mekanları çek
  const places = await getPlacesWithAnalyses(lat, lng, category, companion)
  
  // Öneri motoru
  const engine = new RecommendationEngine()
  const recommendations = await engine.recommend(places, profile)
  
  return Response.json({ recommendations })
}
```

---

## 📊 6. DATABASE SCHEMA GÜNCELLEMELERİ

### 6.1 Places Table

**Yeni Kolonlar:**
```sql
-- Ortam bilgisi (yorumlardan çıkarılacak)
atmosphere text, -- 'quiet', 'lively', 'romantic', 'casual', 'formal'

-- Özel özellikler (Google Places API'den + yorumlardan)
wheelchair_accessible boolean,
pet_friendly boolean,
kid_friendly boolean, -- goodForChildren zaten var, ama yorumlardan da çıkarılabilir
parking boolean,
wifi boolean,
vegetarian boolean,
vegan boolean,
```

### 6.2 User Profiles Table (Gelecek)

```sql
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  session_id TEXT UNIQUE, -- Geçici kullanıcılar için
  user_id INTEGER, -- Gelecekte kullanıcı sistemi için
  
  -- Tercihler
  preferred_budget TEXT,
  preferred_atmosphere TEXT,
  preferred_meal_type TEXT,
  special_needs JSONB,
  
  -- Geçmiş
  favorite_cuisines TEXT[],
  favorite_price_levels INTEGER[],
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 7. IMPLEMENTATION PLAN

### Phase 1: Temel Altyapı (1-2 gün)
1. ✅ UserProfile interface tanımla
2. ✅ RecommendationEngine class oluştur
3. ✅ Temel skorlama fonksiyonları
4. ✅ Database schema güncellemeleri

### Phase 2: UI Geliştirme (2-3 gün)
1. ✅ Wizard'a yeni step'ler ekle
2. ✅ BudgetStep component
3. ✅ AtmosphereStep component
4. ✅ MealTypeStep component
5. ✅ SpecialNeedsStep component
6. ✅ Progress stepper güncelle

### Phase 3: Yorum Analizi (2-3 gün)
1. ✅ Ortam tespiti (yorumlardan)
2. ✅ Özel ihtiyaçlar tespiti (yorumlardan)
3. ✅ AI prompt güncellemeleri
4. ✅ Database'e kaydetme

### Phase 4: Öneri Motoru (2-3 gün)
1. ✅ Filtreleme mantığı
2. ✅ Skorlama algoritması
3. ✅ Sıralama ve top N
4. ✅ API route güncellemesi

### Phase 5: Test ve İyileştirme (1-2 gün)
1. ✅ Test senaryoları
2. ✅ Performans optimizasyonu
3. ✅ UI/UX iyileştirmeleri

**Toplam Süre: 8-13 gün**

---

## 📈 8. GELECEKTEKİ İYİLEŞTİRMELER

### 8.1 Machine Learning Model
- TensorFlow.js veya Python backend
- Neural network ile öğrenme
- Kullanıcı geri bildirimlerinden öğrenme

### 8.2 Collaborative Filtering
- Benzer kullanıcıların tercihleri
- Kullanıcı geçmişi analizi
- Trend analizi

### 8.3 Real-time Learning
- Kullanıcı etkileşimlerinden öğrenme
- A/B testing
- Dinamik ağırlıklandırma

---

## ✅ SONUÇ

Bu plan ile:
- ✅ Kullanıcı profili sistemi
- ✅ Makine öğrenmesi yaklaşımı
- ✅ Gelişmiş yorum analizi
- ✅ Profesyonel öneri motoru
- ✅ Kişiselleştirilmiş öneriler

Sistem, kullanıcıların ihtiyaçlarına daha iyi cevap verecek ve daha doğru öneriler sunacak.



