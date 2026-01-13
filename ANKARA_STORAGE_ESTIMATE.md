# 📊 Ankara İçin Storage Tahmini

## 🎯 Senaryo

**Ankara için sync yapılacak:**
- Tüm kategoriler
- Tüm bölgeler (Ankara'nın tüm ilçeleri)
- Her mekan için tüm companion'lar için analiz

---

## 📋 Varsayımlar

### 1. Kategoriler
Ankara için sync edilecek kategoriler:
- `restaurant` (Yemek yerleri)
- `cafe` (Kafeler)
- `bar` (Barlar)
- `hair_salon` (Kuaförler)
- `spa` (Spa & Masaj)
- `clothing_store` (Alışveriş)
- `amusement_center` (Eğlence)

**Toplam: 7 kategori**

### 2. Mekan Sayısı (Her Kategori İçin)

**Tahmin:**
- Her kategori için ortalama **200-500 mekan** (Ankara geneli)
- Toplam: **7 kategori × 300 mekan (ortalama) = 2,100 mekan**

**Gerçekçi tahmin:**
- Restaurant: ~500 mekan
- Cafe: ~400 mekan
- Bar: ~200 mekan
- Hair Salon: ~300 mekan
- Spa: ~100 mekan
- Clothing Store: ~300 mekan
- Amusement Center: ~100 mekan

**Toplam: ~1,900 mekan**

### 3. Yorum Sayısı (Her Mekan İçin)

**Tahmin:**
- Ortalama mekan: **50-200 yorum**
- Ortalama: **100 yorum/mekan**
- Toplam yorum: **1,900 mekan × 100 yorum = 190,000 yorum**

**Gerçekçi tahmin:**
- Ortalama yorum uzunluğu: **200 karakter** (Türkçe yorumlar genelde daha uzun)
- Her yorum: **~200 bytes** (text + metadata)

### 4. Analiz Sayısı (Her Mekan İçin)

**Companion'lar:**
- `alone` (Yalnız)
- `partner` (Sevgili)
- `friends` (Arkadaşlar)
- `family` (Aile)
- `colleagues` (İş arkadaşları)

**Toplam: 5 companion**

**Her mekan için:**
- 5 companion × 1 analiz = **5 analiz/mekan**
- Toplam analiz: **1,900 mekan × 5 = 9,500 analiz**

---

## 💾 Storage Hesaplaması

### 1. Places Tablosu

**Her mekan için ortalama veri:**
```
name: 50 bytes
address: 100 bytes
lat/lng: 16 bytes (2 × real)
rating: 4 bytes (real)
reviewCount: 4 bytes (integer)
category: 20 bytes (text)
googleMapsId: 50 bytes (text)
phone: 20 bytes (text, nullable)
website: 50 bytes (text, nullable)
openingHours: 500 bytes (JSON string, nullable)
photos: 200 bytes (JSON string, nullable)
editorialSummary: 300 bytes (text, nullable)
businessStatus: 20 bytes (text, nullable)
plusCode: 20 bytes (text, nullable)
priceLevel: 10 bytes (text, nullable)
shortFormattedAddress: 100 bytes (text, nullable)
addressComponents: 200 bytes (JSON string, nullable)
viewport: 100 bytes (JSON string, nullable)
primaryType: 30 bytes (text, nullable)
primaryTypeDisplayName: 50 bytes (text, nullable)
iconBackgroundColor: 10 bytes (text, nullable)
iconMaskBaseUri: 50 bytes (text, nullable)
utcOffset: 10 bytes (text, nullable)
accessibilityOptions: 100 bytes (JSON string, nullable)
evChargingOptions: 50 bytes (JSON string, nullable)
fuelOptions: 50 bytes (JSON string, nullable)
goodForChildren: 1 byte (boolean)
goodForGroups: 1 byte (boolean)
goodForWatchingSports: 1 byte (boolean)
indoorOptions: 50 bytes (JSON string, nullable)
liveMusic: 1 byte (boolean)
menuForChildren: 1 byte (boolean)
outdoorSeating: 1 byte (boolean)
parkingOptions: 100 bytes (JSON string, nullable)
paymentOptions: 100 bytes (JSON string, nullable)
reservable: 1 byte (boolean)
restroom: 1 byte (boolean)
servesBreakfast: 1 byte (boolean)
servesBrunch: 1 byte (boolean)
servesDinner: 1 byte (boolean)
servesLunch: 1 byte (boolean)
servesBeer: 1 byte (boolean)
servesWine: 1 byte (boolean)
servesCocktails: 1 byte (boolean)
servesVegetarianFood: 1 byte (boolean)
takeout: 1 byte (boolean)
delivery: 1 byte (boolean)
dineIn: 1 byte (boolean)
subDestinations: 100 bytes (JSON string, nullable)
currentSecondaryOpeningHours: 200 bytes (JSON string, nullable)
lastScrapedAt: 8 bytes (timestamp)
createdAt: 8 bytes (timestamp)
updatedAt: 8 bytes (timestamp)
score: 4 bytes (integer, nullable)

Toplam: ~2,500 bytes/mekan (ortalama)
```

**1,900 mekan için:**
- **1,900 × 2,500 bytes = 4,750,000 bytes = ~4.5 MB**

### 2. Reviews Tablosu

**Her yorum için:**
```
id: 4 bytes (integer)
placeId: 4 bytes (integer, foreign key)
text: 200 bytes (text, ortalama)
rating: 4 bytes (integer, nullable)
author: 30 bytes (text, nullable)
date: 8 bytes (timestamp, nullable)
createdAt: 8 bytes (timestamp)

Toplam: ~258 bytes/yorum
```

**190,000 yorum için:**
- **190,000 × 258 bytes = 49,020,000 bytes = ~47 MB**

### 3. Analyses Tablosu

**Her analiz için:**
```
id: 4 bytes (integer)
placeId: 4 bytes (integer, foreign key)
category: 20 bytes (text)
companion: 15 bytes (text)
score: 4 bytes (integer)
why: 500 bytes (text, AI analiz açıklaması)
risks: 300 bytes (text, nullable)
reviewCategories: 1,000 bytes (JSON string, nullable)
createdAt: 8 bytes (timestamp)
updatedAt: 8 bytes (timestamp)

Toplam: ~1,863 bytes/analiz
```

**9,500 analiz için:**
- **9,500 × 1,863 bytes = 17,698,500 bytes = ~17 MB**

### 4. Feedback Tablosu

**Tahmin:**
- İlk aşamada az kullanıcı geri bildirimi olacak
- **~1 MB** (tahmin)

---

## 📊 Toplam Storage Tahmini

| Tablo | Kayıt Sayısı | Ortalama Boyut | Toplam |
|-------|--------------|----------------|--------|
| **Places** | 1,900 | 2,500 bytes | **~4.5 MB** |
| **Reviews** | 190,000 | 258 bytes | **~47 MB** |
| **Analyses** | 9,500 | 1,863 bytes | **~17 MB** |
| **Feedback** | ~1,000 | 1,000 bytes | **~1 MB** |
| **Indexes** | - | - | **~5 MB** |
| **Overhead** | - | - | **~5 MB** |
| **TOPLAM** | - | - | **~80 MB** |

---

## 🎯 Gerçekçi Tahmin

### Minimum Senaryo (Konservatif)
- 1,000 mekan
- 50 yorum/mekan
- **Toplam: ~40 MB**

### Ortalama Senaryo (Gerçekçi)
- 1,900 mekan
- 100 yorum/mekan
- **Toplam: ~80 MB**

### Maksimum Senaryo (Tüm Ankara)
- 3,000 mekan
- 200 yorum/mekan
- **Toplam: ~150 MB**

---

## 💡 Supabase Free Tier

**Supabase Free Tier:**
- ✅ **500 MB storage** (yeterli!)
- ✅ Ankara için **~80 MB** kullanılacak
- ✅ **~420 MB** boş alan kalacak
- ✅ **5-6 şehir daha** sync edilebilir

---

## 📈 Büyüme Tahmini

### 1 Şehir (Ankara)
- **~80 MB**

### 5 Şehir (Ankara + İstanbul + İzmir + Bursa + Antalya)
- **~400 MB** (Supabase free tier içinde)

### 10 Şehir
- **~800 MB** (Supabase free tier'ı aşar, Pro tier gerekir)

---

## ⚠️ Optimizasyon Önerileri

### 1. Yorum Sayısını Sınırla
- Her mekan için maksimum **100 yorum** sakla
- En yeni ve en önemli yorumları sakla
- **Tasarruf: ~50%** (47 MB → 23 MB)

### 2. Analiz Verilerini Optimize Et
- `reviewCategories` JSON'u sıkıştır
- Eski analizleri arşivle
- **Tasarruf: ~30%** (17 MB → 12 MB)

### 3. Photos JSON'u Optimize Et
- Sadece photo reference'ları sakla (URL değil)
- **Tasarruf: ~20%** (places tablosunda)

### 4. Indexes Optimize Et
- Sadece gerekli indexleri oluştur
- **Tasarruf: ~2 MB**

---

## ✅ Sonuç

**Ankara için tahmini storage:**
- **Minimum: ~40 MB**
- **Ortalama: ~80 MB**
- **Maksimum: ~150 MB**

**Supabase Free Tier (500 MB):**
- ✅ **Yeterli!** (5-6 şehir için)
- ✅ Ankara için rahatlıkla yeter
- ✅ Büyüme için Pro tier gerekebilir

**Öneri:**
1. Ankara ile başla (~80 MB)
2. Supabase free tier kullan (500 MB)
3. 5-6 şehir daha sync edebilirsin
4. Büyüme olursa Pro tier'a geç ($25/ay, 8 GB)

---

## 📝 Notlar

1. **Gerçek veriler farklı olabilir:**
   - Yorum uzunlukları değişebilir
   - Mekan sayıları değişebilir
   - JSON verileri daha büyük olabilir

2. **Database overhead:**
   - SQLite/PostgreSQL internal structures
   - Indexes
   - WAL files (SQLite)
   - Connection overhead

3. **Backup:**
   - Supabase otomatik backup yapar
   - Ekstra storage gerektirmez (backup ayrı)

4. **Monitoring:**
   - Supabase dashboard'da storage kullanımını takip et
   - Limit yaklaşırsa optimizasyon yap



