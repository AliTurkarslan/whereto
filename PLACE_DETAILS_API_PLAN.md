# 📋 Place Details API Entegrasyon Planı

## 🎯 Amaç

1. **Place Details API** kullanarak mekan detaylarını ve yorumları çekmek
2. Verileri **database'de saklamak** (bir kere çek, sürekli kullan)
3. **Her aramada API çağrısı yapmamak** (database'den oku)
4. **İstenildiğinde güncelleme** yapabilmek (ayda bir, haftada bir, vs.)
5. **Kadıköy yemek yerleri** ile başlamak
6. **Yorumları analiz ettirmek** (AI ile)

## 📊 Mevcut Durum

### ✅ Var Olanlar
- `getPlaceDetails()` fonksiyonu mevcut
- Database schema hazır (places, reviews, analyses)
- Sync script'leri var
- AI analiz sistemi var

### ❌ Eksikler
- Place Details API kullanılmıyor (scraping kullanılıyor)
- Place ID'ler database'de saklanmıyor
- Sync script Place Details API kullanmıyor

## 🔄 Yeni Sistem Akışı

### 1. İlk Sync (Bir Kere)
```
Google Places API (Text/Nearby Search)
    ↓
Place ID'leri al
    ↓
Place Details API (her mekan için)
    ↓
Mekan detayları + Yorumlar
    ↓
Database'e kaydet
    ↓
AI Analiz (yorumlar için)
    ↓
Analiz sonuçlarını kaydet
```

### 2. Güncelleme (İstenildiğinde)
```
Database'den Place ID'leri al
    ↓
Place Details API (güncel veriler için)
    ↓
Yeni yorumları kontrol et
    ↓
Yeni yorumlar varsa ekle
    ↓
AI Analiz güncelle
```

### 3. Kullanıcı Araması (Her Zaman)
```
Kullanıcı arama yapar
    ↓
Database'den mekanları çek (API çağrısı YOK)
    ↓
Yorumlar database'den
    ↓
Analiz sonuçları database'den
    ↓
Sonuçları göster
```

## 💰 Maliyet Analizi

### Place Details API Fiyatlandırması
- **Basic Data**: $17 / 1000 request
- **Contact Data**: +$3 / 1000 request
- **Atmosphere Data**: +$5 / 1000 request
- **Reviews**: Ücretsiz (Basic Data içinde)

### Free Tier
- **$200 kredi / ay** (Google Maps Platform)
- **~11,764 request / ay** (Basic Data için)

### Kadıköy Yemek Yerleri Senaryosu
- **Tahmini mekan sayısı**: 200-300
- **İlk sync**: 300 request (Place Details)
- **Aylık güncelleme**: 300 request
- **Toplam aylık**: ~600 request
- **Maliyet**: $10.20 / ay (Free tier içinde ✅)

## 📝 Adım Adım Plan

### Adım 1: Place ID'yi Database'e Ekle
- Schema'ya `googlePlaceId` field'ı ekle (zaten var mı kontrol et)
- Place ID'yi kaydet

### Adım 2: Sync Script'i Güncelle
- Text/Nearby Search ile mekanları bul
- Place ID'leri al
- Place Details API ile detayları çek
- Yorumları çek
- Database'e kaydet

### Adım 3: Kadıköy Yemek Yerleri Sync Script'i
- Sadece restaurant/food kategorisi
- Kadıköy koordinatları
- Place Details API kullan
- Yorumları kaydet

### Adım 4: AI Analiz Entegrasyonu
- Yorumları database'den al
- AI analiz yap
- Sonuçları kaydet

### Adım 5: Güncelleme Script'i
- Database'den Place ID'leri al
- Place Details API ile güncelle
- Yeni yorumları ekle
- Analizleri güncelle

## 🔧 Teknik Detaylar

### Place Details API Kullanımı

```typescript
// 1. Place ID'yi al (Text/Nearby Search'ten)
const placeId = place.id // "ChIJ..."

// 2. Place Details API çağrısı
const details = await getPlaceDetails(placeId, apiKey)

// 3. Yorumları çek
const reviews = details.reviews || []

// 4. Database'e kaydet
await db.insert(places).values({
  name: details.displayName,
  googlePlaceId: placeId, // ÖNEMLİ!
  // ...
})

await db.insert(reviews).values(
  reviews.map(review => ({
    placeId: place.id,
    text: review.text,
    rating: review.rating,
    // ...
  }))
)
```

### Field Mask (Hangi Verileri İstiyoruz)

```typescript
const fieldMask = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'rating',
  'userRatingCount',
  'reviews', // YORUMLAR
  'priceLevel',
  'types',
  'websiteUri',
  'phoneNumber',
]
```

## ⚠️ Önemli Notlar

1. **Rate Limiting**: 10 request/saniye (Google limit)
2. **Free Tier**: $200/ay (yeterli)
3. **Place ID**: Her mekan için unique, değişmez
4. **Yorumlar**: Place Details API'den gelir (ücretsiz)
5. **Güncelleme**: İstenildiğinde yapılabilir

## 🎯 Sonuç

- ✅ Güvenilir (API kullanımı)
- ✅ Hızlı (database'den okuma)
- ✅ Ücretsiz (free tier içinde)
- ✅ Güncel (istenildiğinde güncelleme)
- ✅ Ölçeklenebilir (tüm Kadıköy için)


