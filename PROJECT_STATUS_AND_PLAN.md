# 📋 WhereTo Projesi - Durum Raporu ve İyileştirme Planı

**Tarih:** 2024
**Durum:** Aktif Geliştirme
**Son Güncelleme:** UX/UI İyileştirmeleri Planlandı

---

## 🎯 Proje Özeti

**WhereTo** - Yanlış yer seçme korkusunu ortadan kaldıran, AI destekli mekan öneri uygulaması.

### Temel Özellikler
- ✅ 3 adımlı wizard (Konum, Kategori, Companion)
- ✅ Google Places API entegrasyonu
- ✅ AI destekli yorum analizi (Gemini Pro/Flash)
- ✅ Skorlama sistemi (0-100)
- ✅ Harita görünümü (Leaflet)
- ✅ Database entegrasyonu (SQLite + Drizzle ORM)
- ✅ Multi-language support (TR/EN)
- ✅ Review kategorizasyonu (Servis, Fiyat, Kalite, Ortam, Lokasyon, Temizlik, Hız)

---

## 🏗️ Teknik Mimari

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Maps:** Leaflet + OpenStreetMap
- **i18n:** Custom i18n system

### Backend
- **API:** Next.js API Routes
- **Database:** SQLite (production'da PostgreSQL'e geçilecek)
- **ORM:** Drizzle ORM
- **AI:** Google Gemini 2.5 Flash
- **APIs:** Google Places API (New), Geocoding, Directions, Street View, Maps Embed

### Data Flow
1. Kullanıcı wizard'ı tamamlar
2. API `/api/recommend` çağrılır
3. Database'den mekanlar çekilir (`getPlacesWithAnalyses`)
4. Eğer analiz yoksa, basit skorlama yapılır (`analyzeReviewsSimple`)
5. Sonuçlar kullanıcıya gösterilir

---

## 📁 Proje Yapısı

```
/Users/mac_ali/WhereTo/
├── app/
│   ├── [locale]/
│   │   └── result/
│   │       └── page.tsx          # Sonuçlar sayfası
│   ├── api/
│   │   └── recommend/
│   │       └── route.ts         # Öneri API endpoint
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global stiller
├── components/
│   ├── Wizard.tsx                # 3 adımlı wizard
│   ├── LocationStep.tsx          # Konum adımı
│   ├── CategoryStep.tsx          # Kategori adımı
│   ├── CompanionStep.tsx        # Companion adımı
│   ├── ResultCard.tsx            # Mekan kartı
│   ├── MapView.tsx               # Harita görünümü
│   ├── ReviewAnalysis.tsx        # Yorum analizi gösterimi
│   ├── DirectionsButton.tsx      # Yol tarifi butonu
│   ├── PlacePhoto.tsx            # Street View fotoğrafı
│   └── ui/                       # shadcn/ui bileşenleri
├── lib/
│   ├── ai/
│   │   └── gemini.ts             # AI skorlama
│   ├── analysis/
│   │   └── simple-scoring.ts     # Basit skorlama (fallback)
│   ├── scrapers/
│   │   ├── google-maps.ts        # Web scraping (fallback)
│   │   └── google-places-api.ts  # Places API
│   ├── db/
│   │   ├── schema.ts             # Database şeması
│   │   └── index.ts              # DB helper functions
│   ├── google-apis/              # Google API entegrasyonları
│   ├── cache/
│   │   └── analysis-cache.ts    # AI analiz cache
│   ├── types/
│   │   ├── place.ts              # Place types
│   │   └── review.ts              # Review types
│   └── i18n.ts                   # i18n helper
├── scripts/
│   ├── sync-master.ts            # Master sync script
│   ├── sync-kadikoy-food.ts     # Kadıköy yemek sync
│   ├── sync-places.ts            # Genel sync script
│   └── check-database.ts        # DB kontrol script
├── locales/
│   ├── tr.json                   # Türkçe çeviriler
│   └── en.json                   # İngilizce çeviriler
└── database.sqlite                # SQLite database

```

---

## 🗄️ Database Şeması

### Tables
1. **places** - Mekanlar
   - id, name, address, lat, lng, rating, reviewCount, category, googleMapsId, lastScrapedAt

2. **reviews** - Yorumlar
   - id, placeId, text, rating, author, date

3. **analyses** - AI Analiz Sonuçları
   - id, placeId, category, companion, score, why, risks, reviewCategories (JSON)

4. **categories** - Kategoriler (gelecek)

### İlişkiler
- places → reviews (1:N)
- places → analyses (1:N)
- Her mekan için 5 companion × N kategori = N×5 analiz

---

## 🔄 Sync Sistemi

### Master Sync (`sync-master.ts`)
- Tüm kategorileri otomatik sync eder
- Place Details API kullanarak yorumları çeker
- Her companion için AI analiz yapar
- Progress tracking ve error recovery

### Kullanım
```bash
npm run sync:master
```

### Kategoriler
- food (restaurant)
- coffee (cafe)
- bar
- haircut (beauty_salon)
- spa
- shopping (shopping_mall)
- entertainment (amusement_center)

### Companion'lar
- alone
- partner
- friends
- family
- colleagues

---

## 🎨 Mevcut UI/UX Özellikleri

### Wizard
- ✅ 3 adımlı progress stepper
- ✅ Smooth animations
- ✅ Form validation
- ✅ Geri dönüş desteği

### Sonuçlar Sayfası
- ✅ Liste görünümü
- ✅ Harita görünümü
- ✅ Skor badge'leri
- ✅ Yorum analizi accordion
- ✅ Street View fotoğrafları
- ✅ Yol tarifi butonu
- ✅ Loading states (skeleton)
- ✅ Error handling

### Harita
- ✅ Skor bazlı renkli marker'lar
- ✅ Kullanıcı konumu gösterimi
- ✅ Marker popup'ları
- ✅ Marker tıklama → card scroll

---

## 🚀 Planlanan İyileştirmeler

### Faz 1: Temel İyileştirmeler (Yüksek Öncelik)

#### 1. Filtreleme ve Sıralama
- [ ] Skor aralığı filtresi (örn: 80-100)
- [ ] Mesafe filtresi (örn: 5km içinde)
- [ ] Rating filtresi (örn: 4+ yıldız)
- [ ] Sıralama seçenekleri:
  - [ ] Skora göre (varsayılan)
  - [ ] Mesafeye göre
  - [ ] Rating'e göre
  - [ ] Alfabetik
- [ ] Arama çubuğu (mekan adına göre)

#### 2. Görünüm Seçenekleri
- [ ] Liste görünümü (mevcut)
- [ ] Grid görünümü (kartlar yan yana)
- [ ] Sadece harita görünümü
- [ ] Split görünümü (liste + harita yan yana)
- [ ] Görünüm tercihi localStorage'da saklama

#### 3. ResultCard İyileştirmeleri
- [ ] Çalışma saatleri (varsa)
- [ ] Telefon numarası (varsa)
- [ ] Website linki (varsa)
- [ ] Fiyat seviyesi ($$$)
- [ ] "Kaydet/Favorilere ekle" butonu
- [ ] "Paylaş" butonu (link, sosyal medya)
- [ ] "Ara" butonu (telefon)
- [ ] Daha fazla fotoğraf (carousel)
- [ ] "Rezervasyon yap" linki (varsa)
- [ ] "Yorum yaz" linki (Google Maps)

#### 4. Harita İyileştirmeleri
- [ ] Marker hover efektleri
- [ ] "Tümünü göster" butonu
- [ ] "Konumuma dön" butonu
- [ ] Harita tipi değiştirme (normal, uydu, terrain)
- [ ] Fullscreen mod
- [ ] "Sadece yüksek skorlu mekanlar" toggle
- [ ] Rota gösterimi (kullanıcı → mekan)
- [ ] Marker cluster'ları (çok marker varsa)

#### 5. Mobil Optimizasyonu
- [ ] Touch-friendly butonlar
- [ ] Swipe gestures (kartlar arasında geçiş)
- [ ] Bottom sheet (mobil için)
- [ ] Fullscreen harita
- [ ] Optimized marker popup'ları

### Faz 2: Gelişmiş Özellikler (Orta Öncelik)

#### 6. Onboarding
- [ ] Hoş geldin ekranı (ilk kullanımda)
- [ ] Kısa tutorial (opsiyonel)
- [ ] "Nasıl çalışır?" butonu
- [ ] Örnek kullanım gösterimi

#### 7. Favoriler Sistemi
- [ ] "Kalp" ikonu (her kartta)
- [ ] Favoriler sayfası
- [ ] Favorilerden hızlı arama
- [ ] localStorage ile saklama

#### 8. Karşılaştırma Özelliği
- [ ] "Karşılaştır" butonu
- [ ] Side-by-side görünüm
- [ ] Farkları vurgulama
- [ ] Max 2-3 mekan karşılaştırma

#### 9. Paylaşım Özellikleri
- [ ] Sosyal medya paylaşımı (Twitter, Facebook, WhatsApp)
- [ ] Özel link oluşturma
- [ ] QR kod
- [ ] PDF/CSV dışa aktarma

#### 10. Gelişmiş Yorum Analizi
- [ ] Kategori bazlı grafikler
- [ ] Zaman bazlı analiz (son 6 ay, 1 yıl)
- [ ] Trend analizi (iyileşiyor mu, kötüleşiyor mu)
- [ ] Yorum filtreleme (pozitif/negatif)
- [ ] Daha fazla örnek yorum

### Faz 3: Polish (Düşük Öncelik)

#### 11. Dark Mode
- [ ] Tema değiştirme
- [ ] Sistem tercihini algılama
- [ ] localStorage'da saklama

#### 12. Kişiselleştirme
- [ ] Kullanıcı tercihleri öğrenme
- [ ] Benzer mekanlar önerisi
- [ ] "Beğenebileceğin mekanlar"

#### 13. Bildirimler
- [ ] Yeni mekan bildirimleri
- [ ] Favori kategoriler için bildirimler
- [ ] Yüksek skorlu yeni mekanlar

#### 14. Dışa Aktarma
- [ ] PDF olarak indirme
- [ ] CSV olarak indirme
- [ ] Print-friendly görünüm

---

## 📊 İyileştirme Sıralaması

### Öncelik 1: Temel İyileştirmeler (1-2 gün)
1. Filtreleme ve sıralama
2. Görünüm seçenekleri
3. ResultCard iyileştirmeleri
4. Harita interaktivitesi
5. Mobil optimizasyonu

### Öncelik 2: Gelişmiş Özellikler (2-3 gün)
6. Onboarding ekranı
7. Favoriler sistemi
8. Karşılaştırma özelliği
9. Paylaşım özellikleri
10. Gelişmiş yorum analizi

### Öncelik 3: Polish (1-2 gün)
11. Dark mode
12. Kişiselleştirme
13. Bildirimler
14. Dışa aktarma

---

## 🔧 Teknik Detaylar

### Environment Variables
```env
GOOGLE_AI_API_KEY=...
GOOGLE_PLACES_API_KEY=...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

### API Rate Limits
- Places API (New): 10 req/s
- Place Details API: 10 req/s ($17/1000)
- Geocoding API: Free tier yeterli
- Directions API: Free tier yeterli
- Street View Static API: Free tier yeterli

### Database
- SQLite (development)
- PostgreSQL (production - gelecek)
- WAL mode aktif

### Caching
- AI analiz cache (24 saat TTL)
- File-based cache (`.cache/` dizini)

---

## 📝 Notlar

### Mevcut Sorunlar
- ✅ Çözüldü: Hydration error (layout.tsx düzeltildi)
- ✅ Çözüldü: Circular dependency (types ayrıldı)
- ✅ Çözüldü: ESLint errors (config güncellendi)

### Gelecek İyileştirmeler
- PostgreSQL migration
- Redis cache (production)
- Background job queue (Bull/BullMQ)
- Real-time updates (WebSocket)
- User accounts (gelecek)

---

## 🎯 Başarı Metrikleri

- **Kullanılabilirlik:** Kullanıcılar 30 saniyede arama yapabiliyor mu?
- **Memnuniyet:** Kullanıcılar sonuçlardan memnun mu?
- **Dönüş Oranı:** Kullanıcılar tekrar kullanıyor mu?
- **Tamamlama Oranı:** Kullanıcılar aramayı tamamlıyor mu?

---

## 📚 Referanslar

- [UX_IMPROVEMENTS_PLAN.md](./UX_IMPROVEMENTS_PLAN.md) - Detaylı UX planı
- [GOOGLE_PLACES_API_SETUP.md](./GOOGLE_PLACES_API_SETUP.md) - API setup
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database setup
- [KADIKOY_SETUP.md](./KADIKOY_SETUP.md) - Kadıköy sync setup

---

**Son Güncelleme:** UX/UI iyileştirmeleri planlandı, uygulama aşamasına geçiliyor.


