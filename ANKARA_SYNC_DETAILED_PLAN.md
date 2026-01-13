# 🏙️ Ankara Sync - Detaylı Plan ve Kontrol Listesi

## 📋 Genel Bakış

Ankara'nın tamamı için kapsamlı bir sync işlemi yapılacak. Bu işlem uzun süreceği için her adımın doğru tanımlanması ve alt yapıda sorun olmaması kritik.

---

## 🎯 1. KAPSAM VE KATEGORİLER

### 1.1 Ankara Bölgeleri (Güncellenmiş)

**Mevcut:** 6 bölge
**Önerilen:** Tüm önemli bölgeler

```typescript
const ANKARA_REGIONS = [
  // Merkez Bölgeler
  { name: 'Çankaya', lat: 39.9179, lng: 32.8543 },
  { name: 'Kızılay', lat: 39.9208, lng: 32.8541 },
  { name: 'Ulus', lat: 39.9426, lng: 32.8597 },
  
  // Kuzey Bölgeler
  { name: 'Keçiören', lat: 40.0214, lng: 32.8636 },
  { name: 'Yenimahalle', lat: 39.9667, lng: 32.8167 },
  { name: 'Mamak', lat: 39.9500, lng: 32.9167 },
  
  // Batı Bölgeler
  { name: 'Etimesgut', lat: 39.9567, lng: 32.6378 },
  { name: 'Sincan', lat: 39.9667, lng: 32.5667 },
  { name: 'Beypazarı', lat: 40.1667, lng: 31.9167 },
  
  // Doğu Bölgeler
  { name: 'Gölbaşı', lat: 39.7833, lng: 32.8167 },
  { name: 'Polatlı', lat: 39.5833, lng: 32.1333 },
  
  // Güney Bölgeler
  { name: 'Yenikent', lat: 39.8833, lng: 32.6833 },
  { name: 'Batıkent', lat: 39.9667, lng: 32.7333 },
  
  // Popüler Mahalleler
  { name: 'Bahçelievler', lat: 39.9167, lng: 32.8667 },
  { name: 'Çukurambar', lat: 39.9000, lng: 32.8500 },
  { name: 'Oran', lat: 39.9000, lng: 32.8167 },
  { name: 'Çayyolu', lat: 39.8833, lng: 32.8000 },
  { name: 'Ümitköy', lat: 39.8833, lng: 32.8167 },
]
```

### 1.2 Kategoriler (Kullanıcı İhtiyaçlarına Göre)

**Mevcut:** 7 kategori (sınırlı)
**Önerilen:** Tüm kullanıcı ihtiyaç kategorileri

```typescript
// USER_NEED_CATEGORIES'den tüm kategoriler
const ANKARA_CATEGORIES = [
  // Yemek & İçecek
  'restaurant',      // Restoran
  'cafe',            // Kafe
  'bar',             // Bar
  'bakery',          // Fırın
  'meal_takeaway',   // Paket servis
  'meal_delivery',   // Yemek servisi
  
  // Güzellik & Bakım
  'hair_salon',      // Kuaför
  'beauty_salon',    // Güzellik salonu
  'spa',             // Spa
  'gym',             // Spor salonu
  'fitness_center',  // Fitness merkezi
  'nail_salon',      // Tırnak salonu
  
  // Eğlence
  'movie_theater',   // Sinema
  'night_club',      // Gece kulübü
  'amusement_center', // Eğlence merkezi
  'bowling_alley',   // Bowling
  'stadium',         // Stadyum
  
  // Alışveriş
  'shopping_mall',   // Alışveriş merkezi
  'clothing_store',  // Giyim mağazası
  'shoe_store',      // Ayakkabı mağazası
  'supermarket',     // Süpermarket
  'convenience_store', // Market
  
  // Kültür & Sanat
  'museum',          // Müze
  'art_gallery',     // Sanat galerisi
  'library',         // Kütüphane
  'park',            // Park
  
  // Konaklama
  'lodging',         // Konaklama
  'hotel',           // Otel
  
  // Sağlık
  'hospital',        // Hastane
  'pharmacy',        // Eczane
  'dentist',         // Diş hekimi
  'doctor',          // Doktor
  
  // Ulaşım
  'gas_station',     // Benzin istasyonu
  'parking',         // Park yeri
  'transit_station', // Toplu taşıma
]
```

**Toplam:** ~40 kategori × ~15 bölge = ~600 kombinasyon

---

## 🔄 2. SYNC SÜRECİ - ADIM ADIM

### 2.1 Mekan Bulma (Place Search)

**Fonksiyon:** `searchPlacesComprehensive`
**API:** Google Places API - Text Search + Nearby Search
**Limit:** Her kategori için 100 mekan
**Rate Limit:** 10 req/s

**Akış:**
1. Text Search ile kategori bazlı arama
2. Nearby Search ile yakın mekanlar
3. Sonuçları birleştir ve duplicate'leri temizle
4. Rating ve review count'a göre filtrele (min 3.0 rating, min 5 review)

**İyileştirme:**
- ✅ Duplicate kontrolü (placeId bazlı)
- ✅ Rating filtreleme (min 3.5 rating önerilir)
- ✅ Review count filtreleme (min 10 review önerilir)
- ✅ Popülerlik sıralaması (review count'a göre)

### 2.2 Place Details Çekme

**Fonksiyon:** `getPlaceDetails`
**API:** Google Places API - Place Details
**Rate Limit:** 10 req/s
**Field Mask:** Tüm alanlar (comprehensive)

**Çekilen Veriler:**
- ✅ Temel bilgiler (name, address, lat, lng, rating, reviewCount)
- ✅ İletişim (phone, website)
- ✅ Açılış saatleri (openingHours)
- ✅ Fotoğraflar (photos)
- ✅ Fiyat seviyesi (priceLevel)
- ✅ İş durumu (businessStatus)
- ✅ **Yorumlar (reviews)** - EN ÖNEMLİ
- ✅ Kapsamlı alanlar (accessibility, amenities, vb.)

**Rate Limiting:**
- Her request arası 200ms bekleme
- Batch processing: 10 mekan → 2 saniye bekleme
- Error durumunda exponential backoff

### 2.3 Yorum İşleme

**Kaynak:** Place Details API - `reviews` field
**Format:** Array of Review objects
**Limit:** API'den gelen tüm yorumlar (genellikle 5-10 yorum)

**İşlem:**
1. Yorumları database'e kaydet
2. Duplicate kontrolü (text bazlı)
3. Yorum sayısını güncelle (place.reviewCount)

**Sorun:** Place Details API sadece 5-10 yorum döndürüyor
**Çözüm:** 
- ✅ Mevcut yorumları kullan (5-10 yorum yeterli analiz için)
- ⚠️ Daha fazla yorum için scraping gerekebilir (opsiyonel)

### 2.4 Yorum Örnekleme (Sampling)

**Fonksiyon:** `sampleReviews`
**Amaç:** Çok fazla yorum varsa optimal sayıya indir

**Strateji:**
- 0-50 yorum: Tümünü kullan
- 50-200 yorum: Dinamik örnekleme (50-200 arası)
- 200+ yorum: 200 yorum (max)

**Örnekleme Yöntemi:**
- ✅ Uzun yorumları önceliklendir
- ✅ Son yorumları önceliklendir
- ✅ Çeşitlilik (farklı rating'lerden)

### 2.5 AI Analizi

**Fonksiyon:** `scorePlaces`
**Model:** Gemini 2.5 Flash
**Input:** Place + Reviews + Category + Companion
**Output:** Score (0-100) + Why + Risks + ReviewCategories

**Her Companion İçin:**
- alone
- partner
- friends
- family
- colleagues

**Toplam Analiz:** 1 mekan × 5 companion = 5 analiz

**Rate Limiting:**
- Gemini API: 15 req/min (free tier)
- Batch processing: 5 mekan → 1 dakika bekleme
- Error handling: Retry with exponential backoff

**Cache:**
- ✅ Analiz sonuçları cache'leniyor
- ✅ Aynı place + category + companion için tekrar analiz yapılmıyor

### 2.6 Database Kayıt

**Tablo:** `places`, `reviews`, `analyses`

**İşlem:**
1. Place kaydı (insert veya update)
2. Reviews kaydı (bulk insert)
3. Analyses kaydı (her companion için)

**Optimizasyon:**
- ✅ Bulk insert kullan (reviews için)
- ✅ Transaction kullan (atomicity için)
- ✅ Duplicate kontrolü (googleMapsId bazlı)

---

## ⚠️ 3. SORUNLAR VE ÇÖZÜMLER

### 3.1 Rate Limiting

**Sorun:** Google Places API rate limit (10 req/s)
**Çözüm:**
- ✅ Her request arası 200ms bekleme
- ✅ Batch processing
- ✅ Exponential backoff on error

**Sorun:** Gemini API rate limit (15 req/min)
**Çözüm:**
- ✅ Batch processing: 5 mekan → 1 dakika bekleme
- ✅ Queue sistemi (opsiyonel)

### 3.2 Yorum Sayısı

**Sorun:** Place Details API sadece 5-10 yorum döndürüyor
**Çözüm:**
- ✅ Mevcut yorumları kullan (5-10 yorum yeterli)
- ⚠️ Daha fazla yorum için scraping (uzun sürer, opsiyonel)

### 3.3 Hata Yönetimi

**Sorun:** Bir mekan başarısız olursa tüm sync durur
**Çözüm:**
- ✅ Try-catch ile her mekan ayrı işleniyor
- ✅ Error logging
- ✅ Continue on error

### 3.4 Süre Tahmini

**Hesaplama:**
- 600 kombinasyon (40 kategori × 15 bölge)
- Her kombinasyon: ~50 mekan
- Toplam: ~30,000 mekan

**Süre:**
- Place Search: 1 saniye/kombinasyon = 600 saniye (10 dakika)
- Place Details: 200ms/mekan × 30,000 = 6,000 saniye (100 dakika)
- AI Analiz: 4 saniye/mekan × 30,000 = 120,000 saniye (2,000 dakika = 33 saat)

**Toplam:** ~34 saat (tek API key ile)

**Optimizasyon:**
- ✅ Batch processing
- ✅ Parallel processing (opsiyonel)
- ✅ Multiple API keys (opsiyonel)

---

## 📊 4. VERİ KALİTESİ KONTROLÜ

### 4.1 Minimum Gereksinimler

**Place:**
- ✅ Name, address, lat, lng olmalı
- ✅ Rating ≥ 3.5 (opsiyonel)
- ✅ Review count ≥ 10 (opsiyonel)

**Reviews:**
- ✅ En az 3 yorum (analiz için)
- ✅ Yorum uzunluğu ≥ 20 karakter

**Analysis:**
- ✅ Her companion için analiz
- ✅ Score 0-100 arası
- ✅ Why ve risks dolu

### 4.2 Veri Doğrulama

**Kontrol:**
- ✅ Duplicate place kontrolü
- ✅ Geçerli koordinat kontrolü
- ✅ Geçerli rating kontrolü (1-5)
- ✅ Geçerli review count kontrolü (≥ 0)

---

## 🚀 5. İYİLEŞTİRME ÖNERİLERİ

### 5.1 Kategori Kapsamı

**Mevcut:** 7 kategori
**Önerilen:** Tüm USER_NEED_CATEGORIES (10 kategori)

**Fayda:**
- ✅ Daha kapsamlı arama
- ✅ Kullanıcı ihtiyaçlarına daha iyi cevap

### 5.2 Bölge Kapsamı

**Mevcut:** 6 bölge
**Önerilen:** 15+ bölge (tüm önemli bölgeler)

**Fayda:**
- ✅ Ankara'nın tamamını kapsar
- ✅ Popüler mahalleler dahil

### 5.3 Mekan Sayısı

**Mevcut:** 50 mekan/kategori (test için)
**Önerilen:** 100 mekan/kategori (production)

**Fayda:**
- ✅ Daha fazla seçenek
- ✅ Popüler yerler dahil

### 5.4 Yorum Kalitesi

**Mevcut:** Place Details API (5-10 yorum)
**Önerilen:** 
- ✅ Mevcut yorumları kullan (yeterli)
- ⚠️ Daha fazla yorum için scraping (opsiyonel, uzun sürer)

### 5.5 Error Handling

**Mevcut:** Try-catch ile continue
**Önerilen:**
- ✅ Detaylı error logging
- ✅ Retry mekanizması
- ✅ Progress tracking

### 5.6 Progress Tracking

**Mevcut:** Console log
**Önerilen:**
- ✅ Database'de progress kaydı
- ✅ Resume capability (kaldığı yerden devam)
- ✅ Statistics tracking

---

## ✅ 6. KONTROL LİSTESİ

### 6.1 Ön Hazırlık

- [ ] Environment variables kontrolü (DATABASE_URL, GOOGLE_PLACES_API_KEY, GOOGLE_AI_API_KEY)
- [ ] Database bağlantısı testi
- [ ] API key'lerin çalıştığı testi
- [ ] Rate limit kontrolü
- [ ] Disk space kontrolü (30,000 mekan için ~500MB)

### 6.2 Script Hazırlığı

- [ ] Bölge listesi güncellendi
- [ ] Kategori listesi güncellendi
- [ ] Rate limiting ayarlandı
- [ ] Error handling iyileştirildi
- [ ] Progress tracking eklendi
- [ ] Resume capability eklendi (opsiyonel)

### 6.3 Test

- [ ] Küçük test (1 bölge, 1 kategori)
- [ ] Orta test (1 bölge, tüm kategoriler)
- [ ] Büyük test (tüm bölgeler, 1 kategori)
- [ ] Veri kalitesi kontrolü
- [ ] Performance testi

### 6.4 Production

- [ ] Backup alındı
- [ ] Monitoring kuruldu
- [ ] Alert sistemi kuruldu (opsiyonel)
- [ ] Script çalıştırıldı
- [ ] Progress takibi yapıldı

---

## 📝 7. SONUÇ

Ankara'nın tamamı için sync işlemi:
- **Kapsam:** 15+ bölge × 40 kategori = ~600 kombinasyon
- **Mekan:** ~30,000 mekan
- **Süre:** ~34 saat (tek API key ile)
- **Veri:** ~150,000 yorum, ~150,000 analiz

**Kritik Noktalar:**
1. ✅ Rate limiting (API limitlerine dikkat)
2. ✅ Error handling (bir hata tüm sync'i durdurmamalı)
3. ✅ Progress tracking (ilerlemeyi takip et)
4. ✅ Veri kalitesi (minimum gereksinimler)
5. ✅ Resume capability (kaldığı yerden devam edebilmeli)

**Öneriler:**
1. Küçük testlerle başla
2. Progress tracking ekle
3. Error handling'i iyileştir
4. Resume capability ekle (uzun süreceği için)
5. Monitoring kur (süreç takibi için)



