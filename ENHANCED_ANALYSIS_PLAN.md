# 🚀 Gelişmiş Analiz ve Veri Zenginleştirme Planı

## 📋 Genel Bakış

Sistemin daha profesyonel ve kapsamlı çalışması için yapılacak iyileştirmeler:
1. Fiyat bilgisi ve ortalama harcama analizi
2. Yemek kültürü/kategori tespiti
3. Gelişmiş yorum analizi (sadece companion değil, daha fazla faktör)

---

## 💰 1. FİYAT BİLGİSİ VE ORTALAMA HARCAMA

### 1.1 Mevcut Durum

**✅ Zaten Çekiliyor:**
- `priceLevel`: FREE, INEXPENSIVE, MODERATE, EXPENSIVE, VERY_EXPENSIVE
- Database'de `price_level` kolonu var
- UI'da gösteriliyor ($ işaretleri ile)

**❌ Eksik:**
- Ortalama harcama bilgisi yok
- "Bir çay kaç para?" gibi spesifik sorulara cevap veremiyoruz
- Fiyat-performans analizi yok

### 1.2 Google Places API'den Alınabilecekler

**Mevcut:**
- `priceLevel`: 0-4 arası (FREE, INEXPENSIVE, MODERATE, EXPENSIVE, VERY_EXPENSIVE)
- Bu bilgi zaten çekiliyor ✅

**Ek Bilgiler (Yorumlardan Çıkarılabilir):**
- Yorumlarda fiyat bilgisi geçiyor mu?
- "Çay 15 TL", "Dürüm 80 TL" gibi bilgiler
- AI ile yorumlardan fiyat bilgisi çıkarılabilir

### 1.3 Çözüm Önerileri

#### Seçenek 1: Yorumlardan Fiyat Çıkarma (AI ile)

**Yaklaşım:**
- Yorumları analiz ederken fiyat bilgisi de çıkar
- "Çay 15 TL", "Dürüm 80 TL" gibi ifadeleri tespit et
- Ortalama fiyatları hesapla

**Avantajlar:**
- ✅ Spesifik fiyat bilgisi
- ✅ Güncel fiyatlar (yorumlar güncel)
- ✅ Kategori bazlı fiyatlar (çay, dürüm, vb.)

**Dezavantajlar:**
- ❌ Her yorumda fiyat geçmeyebilir
- ❌ AI maliyeti artar

#### Seçenek 2: Price Level + Kategori Bazlı Ortalama

**Yaklaşım:**
- Price level'a göre kategori bazlı ortalama fiyatlar
- Örnek: MODERATE kafe → Çay: 15-25 TL, Kahve: 25-40 TL
- Database'de kategori bazlı ortalama fiyat tablosu

**Avantajlar:**
- ✅ Hızlı ve basit
- ✅ Her zaman çalışır
- ✅ AI maliyeti yok

**Dezavantajlar:**
- ❌ Genel tahmin (spesifik değil)
- ❌ Güncel olmayabilir

#### Seçenek 3: Hybrid (Önerilen)

**Yaklaşım:**
1. Önce price level kullan (her zaman var)
2. Yorumlardan fiyat bilgisi çıkar (varsa)
3. İkisini birleştir

**Implementasyon:**
```typescript
interface PriceInfo {
  priceLevel: 0 | 1 | 2 | 3 | 4
  estimatedAverage?: {
    category: string // "çay", "dürüm", "kahve", vb.
    minPrice: number
    maxPrice: number
    currency: string
  }[]
  extractedFromReviews?: boolean
}
```

### 1.4 UI İyileştirmeleri

**Mevcut:**
- Price level gösteriliyor ($ işaretleri)

**Önerilen:**
- Price level + ortalama fiyat aralığı
- Örnek: "$$ (Çay: 15-25 TL, Kahve: 25-40 TL)"
- Filtreleme: Fiyat aralığına göre

---

## 🌍 2. YEMEK KÜLTÜRÜ/KATEGORİ TESPİTİ

### 2.1 Mevcut Durum

**✅ Zaten Var:**
- `types`: Google Maps place types array
- `primaryType`: Ana kategori
- `primaryTypeDisplayName`: Kategori adı

**❌ Eksik:**
- Yemek kültürü bilgisi yok (Türk, İtalyan, Çin, vb.)
- Sadece genel kategori var (restaurant, cafe, vb.)

### 2.2 Google Places API'den Alınabilecekler

**Mevcut:**
- `types`: Array of place types
- Örnek: `["restaurant", "food", "point_of_interest", "establishment"]`
- Ama spesifik kültür bilgisi yok

**Çözüm:**
1. **Yorumlardan Çıkarma (AI ile)**
   - Yorumlarda "Türk mutfağı", "İtalyan restoranı" gibi ifadeler
   - AI ile kültür tespiti

2. **İsim ve Açıklamadan Çıkarma**
   - Place name'de kültür ipuçları
   - Editorial summary'de kültür bilgisi

3. **Kategori Mapping**
   - Belirli isim pattern'leri → kültür
   - Örnek: "Pizzeria" → İtalyan, "Kebap" → Türk

### 2.3 Çözüm Önerileri

#### Seçenek 1: AI ile Yorum Analizi

**Yaklaşım:**
- Yorumları analiz ederken kültür bilgisi de çıkar
- "Türk mutfağı", "İtalyan restoranı" gibi ifadeleri tespit et

**Avantajlar:**
- ✅ Doğru tespit
- ✅ Yorumlardan gelen bilgi

**Dezavantajlar:**
- ❌ AI maliyeti
- ❌ Her yorumda geçmeyebilir

#### Seçenek 2: İsim ve Açıklama Analizi

**Yaklaşım:**
- Place name'de kültür ipuçları
- Editorial summary'de kültür bilgisi
- Keyword matching

**Avantajlar:**
- ✅ Hızlı
- ✅ AI maliyeti yok

**Dezavantajlar:**
- ❌ Her zaman doğru olmayabilir

#### Seçenek 3: Hybrid (Önerilen)

**Yaklaşım:**
1. Önce isim ve açıklamadan tespit et
2. Yorumlardan doğrula (AI ile)
3. Database'de sakla

**Implementasyon:**
```typescript
interface CuisineInfo {
  primaryCuisine?: string // "turkish", "italian", "chinese", vb.
  secondaryCuisines?: string[]
  confidence: number // 0-1
  source: 'name' | 'description' | 'reviews' | 'mixed'
}
```

### 2.4 Database Schema

**Yeni Kolon:**
```typescript
// places table
cuisineType?: string // "turkish", "italian", "chinese", vb.
cuisineTypes?: string[] // Multiple cuisines
```

---

## 🧠 3. GELİŞMİŞ YORUM ANALİZİ

### 3.1 Mevcut Durum

**✅ Var:**
- Companion bazlı analiz (alone, partner, friends, family, colleagues)
- 7 kategori analizi (servis, fiyat, kalite, ortam, lokasyon, temizlik, hız)
- AI analizi (Gemini)

**❌ Eksik:**
- Sadece companion'a göre değişiyor
- Daha fazla faktör yok
- Kullanıcı tercihleri yok

### 3.2 İyileştirme Önerileri

#### 3.2.1 Faktör Genişletme

**Mevcut Faktörler:**
- Companion (alone, partner, friends, family, colleagues)

**Eklenebilecek Faktörler:**
1. **Bütçe Tercihi**
   - Budget-friendly
   - Moderate
   - Premium
   - Price doesn't matter

2. **Ortam Tercihi**
   - Quiet/Peaceful
   - Lively/Noisy
   - Romantic
   - Casual
   - Formal

3. **Yemek Tercihi**
   - Fast food
   - Fine dining
   - Casual dining
   - Street food
   - Vegetarian/Vegan

4. **Zaman Tercihi**
   - Breakfast
   - Lunch
   - Dinner
   - Late night
   - Brunch

5. **Özel İhtiyaçlar**
   - Wheelchair accessible
   - Pet-friendly
   - Kid-friendly
   - Parking available
   - WiFi available

#### 3.2.2 Analiz Derinleştirme

**Mevcut:**
- 7 kategori analizi
- Companion bazlı ayarlama

**Önerilen:**
- Daha detaylı kategori analizi
- Faktör bazlı ağırlıklandırma
- Kullanıcı profil analizi

**Örnek:**
```typescript
interface AnalysisFactors {
  companion: 'alone' | 'partner' | 'friends' | 'family' | 'colleagues'
  budget?: 'budget' | 'moderate' | 'premium' | 'any'
  atmosphere?: 'quiet' | 'lively' | 'romantic' | 'casual' | 'formal'
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'brunch' | 'late-night'
  specialNeeds?: {
    wheelchair?: boolean
    petFriendly?: boolean
    kidFriendly?: boolean
    parking?: boolean
    wifi?: boolean
  }
}
```

#### 3.2.3 AI Prompt İyileştirme

**Mevcut Prompt:**
- Companion bilgisi var
- Kategori bilgisi var
- Genel analiz

**Önerilen Prompt:**
- Tüm faktörleri içer
- Daha detaylı analiz
- Faktör bazlı ağırlıklandırma

**Örnek:**
```
Kullanıcı bilgileri:
- Ne arıyor: ${category}
- Kiminle: ${companion}
- Bütçe: ${budget}
- Ortam tercihi: ${atmosphere}
- Özel ihtiyaçlar: ${specialNeeds}

Analiz yaparken:
1. Her faktörü dikkate al
2. Faktör bazlı ağırlıklandırma yap
3. Daha detaylı açıklama ver
```

---

## 📊 4. IMPLEMENTATION PLAN

### 4.1 Fiyat Bilgisi

**Adım 1: Database Schema**
```typescript
// places table - yeni kolonlar
averagePriceRange?: {
  category: string
  minPrice: number
  maxPrice: number
  currency: string
}[]
priceInfoExtracted?: boolean
```

**Adım 2: AI Prompt Güncelleme**
- Yorum analizi sırasında fiyat bilgisi çıkar
- Kategori bazlı fiyatlar

**Adım 3: UI Güncelleme**
- Fiyat bilgisi gösterimi
- Filtreleme

### 4.2 Yemek Kültürü

**Adım 1: Database Schema**
```typescript
// places table - yeni kolonlar
cuisineType?: string
cuisineTypes?: string[]
cuisineConfidence?: number
```

**Adım 2: Tespit Sistemi**
- İsim ve açıklama analizi
- AI ile yorum analizi
- Hybrid yaklaşım

**Adım 3: UI Güncelleme**
- Kültür bilgisi gösterimi
- Filtreleme

### 4.3 Gelişmiş Analiz

**Adım 1: Faktör Genişletme**
- Yeni faktörler ekle
- Database schema güncelle

**Adım 2: AI Prompt İyileştirme**
- Tüm faktörleri içer
- Daha detaylı analiz

**Adım 3: Skorlama İyileştirme**
- Faktör bazlı ağırlıklandırma
- Daha profesyonel skorlama

---

## 🎯 5. ÖNCELİK SIRASI

### Yüksek Öncelik
1. ✅ Fiyat bilgisi (yorumlardan çıkarma)
2. ✅ Yemek kültürü tespiti
3. ✅ Gelişmiş analiz faktörleri

### Orta Öncelik
1. UI iyileştirmeleri
2. Filtreleme özellikleri
3. Kullanıcı tercihleri

### Düşük Öncelik
1. Kullanıcı profil sistemi
2. Öneri motoru
3. Machine learning

---

## 📝 6. SONUÇ

Bu iyileştirmelerle sistem:
- ✅ Daha profesyonel çalışacak
- ✅ Daha fazla bilgi sağlayacak
- ✅ Daha iyi öneriler yapacak
- ✅ Kullanıcı ihtiyaçlarına daha iyi cevap verecek



