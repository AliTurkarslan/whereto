# 🎯 Ankara Veri Hazırlık ve Arama Stratejisi Planı

## 📅 Tarih: Bugün

## 🎯 Amaç

Ankara için mükemmel veri toplama ve arama stratejisi oluşturmak. Kullanıcıların uygun mekan bulmasını kolaylaştırmak için:

1. **Kapsamlı veri toplama** - Tüm önemli field'lar
2. **Yüksek kaliteli veri** - Minimum kalite kriterleri
3. **Akıllı arama stratejisi** - Doğru sonuçlar için optimize edilmiş

---

## 📊 Mevcut Durum Analizi

### Veri Kalitesi Kontrolü

**Çalıştırılacak Script:**
```bash
npm run check:data-quality
```

**Kontrol Edilecekler:**
- ✅ Tüm field'ların varlığı
- ✅ Yorum sayısı ve kalitesi
- ✅ Analiz kapsamı
- ✅ Kategori dağılımı
- ✅ Eksik veriler

---

## 🔧 Google Maps API Field Mask Optimizasyonu

### Mevcut Durum

**Place Details Field Mask:**
```
id,displayName,formattedAddress,shortFormattedAddress,addressComponents,location,viewport,rating,userRatingCount,reviews,priceLevel,types,primaryType,primaryTypeDisplayName,internationalPhoneNumber,nationalPhoneNumber,websiteUri,currentOpeningHours,regularOpeningHours,editorialSummary,businessStatus,plusCode,photos,iconBackgroundColor,iconMaskBaseUri
```

### Optimize Edilmiş Field Mask

**Yeni Field Mask (Tüm Önemli Field'lar):**
```
id,displayName,formattedAddress,shortFormattedAddress,addressComponents,location,viewport,rating,userRatingCount,reviews,priceLevel,types,primaryType,primaryTypeDisplayName,internationalPhoneNumber,nationalPhoneNumber,websiteUri,currentOpeningHours,regularOpeningHours,editorialSummary,businessStatus,plusCode,photos,iconBackgroundColor,iconMaskBaseUri,accessibilityOptions,evChargingOptions,fuelOptions,goodForChildren,goodForGroups,goodForWatchingSports,indoorOptions,liveMusic,menuForChildren,outdoorSeating,parkingOptions,paymentOptions,reservable,restroom,servesBreakfast,servesBrunch,servesDinner,servesLunch,servesBeer,servesWine,servesCocktails,servesVegetarianFood,takeout,delivery,dineIn,subDestinations,currentSecondaryOpeningHours
```

**Eklenen Field'lar:**
- ✅ `accessibilityOptions` - Engelli erişimi
- ✅ `goodForChildren` - Çocuk dostu
- ✅ `goodForGroups` - Grup için uygun
- ✅ `outdoorSeating` - Dış mekan oturma
- ✅ `parkingOptions` - Park yeri
- ✅ `servesBreakfast/Lunch/Dinner` - Yemek saatleri
- ✅ `servesBeer/Wine/Cocktails` - İçecek seçenekleri
- ✅ `takeout/delivery/dineIn` - Hizmet seçenekleri
- ✅ `reservable` - Rezervasyon
- ✅ `restroom` - Tuvalet
- ✅ Ve daha fazlası...

**Avantajlar:**
- ✅ Öneri motoru için tüm gerekli bilgiler
- ✅ Daha iyi filtreleme
- ✅ Daha doğru skorlama
- ✅ Kullanıcı ihtiyaçlarına daha iyi uyum

---

## 📋 Veri Toplama Kriterleri

### Minimum Kalite Kriterleri

```typescript
const QUALITY_CRITERIA = {
  minReviewCount: 20,        // Minimum 20 yorum
  minRating: 3.5,           // Minimum 3.5 rating
  minReviewLength: 30,      // Minimum 30 karakter yorum
  requireValidCategory: true,
  requireValidLocation: true,
  requireValidName: true,
  requireValidAddress: true,
}
```

### Öncelikli Field'lar

**Kritik (Zorunlu):**
- ✅ name, address, lat, lng
- ✅ rating, reviewCount
- ✅ category, primaryType
- ✅ reviews (minimum 20)

**Önemli (Öneri Motoru İçin):**
- ✅ priceLevel
- ✅ openingHours
- ✅ goodForChildren, goodForGroups
- ✅ outdoorSeating, parkingOptions
- ✅ servesBreakfast/Lunch/Dinner
- ✅ takeout, delivery, dineIn
- ✅ accessibilityOptions

**İsteğe Bağlı (Nice-to-Have):**
- phone, website
- photos
- editorialSummary
- paymentOptions

---

## 🗺️ Ankara Arama Stratejisi

### Bölge Bazlı Arama

**Ankara Bölgeleri (Öncelik Sırasına Göre):**

1. **Merkez Bölgeler** (Yüksek Öncelik)
   - Çankaya (39.9179, 32.8543)
   - Kızılay (39.9208, 32.8541)
   - Ulus (39.9426, 32.8597)

2. **Popüler Mahalleler** (Orta Öncelik)
   - Bahçelievler (39.9167, 32.8667)
   - Çukurambar (39.9000, 32.8500)
   - Oran (39.9000, 32.8167)
   - Çayyolu (39.8833, 32.8000)
   - Ümitköy (39.8833, 32.8167)

3. **İlçe Merkezleri** (Düşük Öncelik)
   - Keçiören (40.0214, 32.8636)
   - Yenimahalle (39.9667, 32.8167)
   - Mamak (39.9500, 32.9167)
   - Etimesgut (39.9567, 32.6378)
   - Sincan (39.9667, 32.5667)

### Kategori Bazlı Arama

**Kullanıcı İhtiyaç Kategorileri:**

1. **Yemek & İçecek** (En Yüksek Öncelik)
   - restaurant
   - cafe
   - bar
   - bakery
   - meal_takeaway
   - meal_delivery

2. **Güzellik & Bakım**
   - hair_salon
   - beauty_salon
   - spa
   - gym
   - fitness_center
   - nail_salon

3. **Eğlence**
   - movie_theater
   - night_club
   - amusement_center
   - bowling_alley

4. **Diğer**
   - shopping_mall
   - park
   - museum
   - art_gallery

### Arama Parametreleri

**Her Bölge İçin:**
```typescript
{
  location: { lat, lng },
  radius: 5,              // 5km radius (merkez için)
  maxResults: 50,         // Her kategori için max 50
  minReviewCount: 20,      // Minimum 20 yorum
  minRating: 3.5,          // Minimum 3.5 rating
}
```

**Radius Stratejisi:**
- Merkez bölgeler: 5km
- Popüler mahalleler: 3km
- İlçe merkezleri: 10km

---

## 🔍 Arama Stratejisi Detayları

### 1. Text Search (Öncelikli)

**Kullanım:**
- Kategori + Bölge adı ile arama
- Örnek: "restaurant Çankaya", "cafe Kızılay"

**Avantajlar:**
- Daha doğru sonuçlar
- Popüler mekanları önceliklendirir
- Google'ın ranking algoritmasını kullanır

### 2. Nearby Search (Fallback)

**Kullanım:**
- Text search sonuç yoksa
- Location + radius ile arama

**Avantajlar:**
- Tüm yakın mekanları bulur
- Kategori bazlı filtreleme

### 3. Place Details (Detaylı Bilgi)

**Kullanım:**
- Her mekan için detaylı bilgi çek
- Tüm field'ları al
- Yorumları topla

**Önemli:**
- Rate limiting'e dikkat
- Batch processing kullan
- Cache mekanizması

---

## 📊 Veri Toplama Planı

### Faz 1: Merkez Bölgeler (Yüksek Öncelik)

**Hedef:**
- Çankaya, Kızılay, Ulus
- Tüm kategoriler
- Minimum 20 yorum
- Minimum 3.5 rating

**Beklenen Sonuç:**
- ~500-1000 mekan
- Yüksek kaliteli veri
- Kapsamlı analiz

### Faz 2: Popüler Mahalleler

**Hedef:**
- Bahçelievler, Çukurambar, Oran, Çayyolu, Ümitköy
- Öncelikli kategoriler (yemek, kahve, güzellik)
- Minimum 15 yorum

**Beklenen Sonuç:**
- ~300-500 mekan
- Orta-yüksek kalite

### Faz 3: İlçe Merkezleri

**Hedef:**
- Keçiören, Yenimahalle, Mamak, Etimesgut, Sincan
- Sadece popüler kategoriler
- Minimum 10 yorum

**Beklenen Sonuç:**
- ~200-300 mekan
- Orta kalite

---

## 🎯 Arama Optimizasyonu

### Öneri Motoru İçin Gerekli Veriler

**Minimum Gereksinimler:**
1. ✅ Temel bilgiler (name, address, location)
2. ✅ Rating ve yorum sayısı (minimum 20)
3. ✅ Kategori bilgisi
4. ✅ Fiyat seviyesi
5. ✅ Açılış saatleri
6. ✅ Özellikler (goodForChildren, parking, etc.)

**İdeal Gereksinimler:**
1. ✅ Tüm field'lar dolu
2. ✅ Minimum 50 yorum
3. ✅ Minimum 4.0 rating
4. ✅ Kapsamlı analiz (tüm kategoriler ve companion'lar için)

### Arama Sonuçlarını İyileştirme

**Filtreleme:**
1. Kalite kontrolü (minimum kriterler)
2. Kategori uyumu
3. Açılış saatleri kontrolü
4. Mesafe kontrolü (max 10km)

**Sıralama:**
1. Öneri motoru skoru (en yüksek)
2. Yorum sayısı (daha fazla = daha iyi)
3. Rating (daha yüksek = daha iyi)
4. Mesafe (daha yakın = daha iyi)

**Çeşitlilik:**
1. Farklı kategoriler
2. Farklı fiyat seviyeleri
3. Farklı bölgeler
4. Farklı özellikler

---

## ✅ Hazırlık Kontrol Listesi

### Ön Hazırlık

- [ ] Veri kalitesi kontrol scripti çalıştırıldı
- [ ] Google Maps API field mask'ları optimize edildi
- [ ] Database schema güncel (tüm field'lar mevcut)
- [ ] Sync script hazır ve test edildi
- [ ] Kalite kriterleri belirlendi

### Veri Toplama

- [ ] Merkez bölgeler sync edildi
- [ ] Popüler mahalleler sync edildi
- [ ] İlçe merkezleri sync edildi
- [ ] Tüm kategoriler için veri toplandı
- [ ] Minimum kalite kriterleri sağlandı

### Analiz

- [ ] Tüm mekanlar analiz edildi
- [ ] Tüm kategoriler için analiz yapıldı
- [ ] Tüm companion'lar için analiz yapıldı
- [ ] Analiz kalitesi kontrol edildi

### Test

- [ ] Arama test edildi (farklı kategoriler)
- [ ] Öneri motoru test edildi
- [ ] Sonuç kalitesi kontrol edildi
- [ ] Performans test edildi

---

## 🚀 Sonraki Adımlar

1. **Veri Kalitesi Kontrolü:**
   ```bash
   npm run check:data-quality
   ```

2. **Field Mask Optimizasyonu:**
   - `lib/scrapers/google-places-api.ts` güncellendi ✅

3. **Ankara Sync:**
   ```bash
   npm run sync:ankara:comprehensive
   ```

4. **Analiz:**
   - Tüm mekanlar için analiz yapılacak
   - Tüm kategoriler ve companion'lar için

5. **Test:**
   - Arama testleri
   - Öneri motoru testleri
   - Sonuç kalitesi kontrolü

---

## 📝 Notlar

- **Rate Limiting:** Google Places API rate limit'lerine dikkat edilmeli
- **Cache:** Analiz sonuçları cache'lenmeli
- **Error Handling:** Hata durumlarında graceful degradation
- **Monitoring:** Veri toplama süreci monitor edilmeli

---

## 🎯 Başarı Kriterleri

1. ✅ Minimum 1000 yüksek kaliteli mekan
2. ✅ Tüm önemli field'lar dolu (%80+)
3. ✅ Minimum 20 yorumlu mekanlar (%70+)
4. ✅ Tüm kategoriler için analiz (%50+)
5. ✅ Arama sonuçları kaliteli ve alakalı

