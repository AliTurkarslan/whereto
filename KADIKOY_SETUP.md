# Kadıköy Database Kurulum Rehberi

## 🎯 Problem

Şu anda database'de sadece mock veriler var. Kadıköy'deki gerçek mekanları bulmak ve database'e yüklemek gerekiyor.

## ✅ Yapılan Düzeltmeler

1. **Category Matching Düzeltildi**
   - API'deki category (food, coffee, etc.) ile database'deki category (restaurant, cafe, etc.) eşleştirildi
   - Artık "food" arandığında "restaurant" kategorisindeki mekanlar bulunuyor

2. **Mock Data Temizlendi**
   - Database'deki 4 mock mekan silindi
   - Artık sadece gerçek veriler olacak

3. **İyileştirilmiş Scraper**
   - Kadıköy için özel scraper eklendi
   - Daha fazla mekan bulmak için scroll ve farklı selector'lar kullanıyor

4. **Database Query İyileştirildi**
   - Radius 10km'ye çıkarıldı (Kadıköy için daha geniş)
   - Category filtresi olmadan da arama yapılıyor

## 🚀 Kurulum Adımları

### 1. Mock Datayı Temizle (Yapıldı ✅)

```bash
npm run db:clear-mock
```

### 2. Database Durumunu Kontrol Et

```bash
npm run db:check
```

### 3. Kadıköy için Tüm Kategorileri Sync Et

```bash
npm run sync:kadikoy
```

Bu komut şunları yapacak:
- Restoranları scrape eder ve database'e kaydeder
- Kafeleri scrape eder ve database'e kaydeder
- Barları scrape eder ve database'e kaydeder
- Kuaförleri scrape eder ve database'e kaydeder
- Spa & Masaj yerlerini scrape eder ve database'e kaydeder
- Alışveriş yerlerini scrape eder ve database'e kaydeder
- Eğlence mekanlarını scrape eder ve database'e kaydeder

**Süre:** Her kategori için ~10-15 dakika (scraping + AI analiz)
**Toplam:** ~2-3 saat (tüm kategoriler için)

### 4. Tek Kategori Sync (Test için)

Sadece bir kategoriyi test etmek için:

```bash
npm run sync:places -- --query "restaurant" --lat 40.9833 --lng 29.0167 --category "food"
```

## 🔍 Sorun Giderme

### Scraping Başarısız Olursa

1. **Puppeteer hatası:** Chrome/Chromium yüklü mü kontrol et
2. **Network hatası:** İnternet bağlantısını kontrol et
3. **Timeout:** Scraping süresi uzun olabilir, bekleyin

### Database'de Mekan Yok

1. **Category matching:** `npm run db:check` ile kontrol et
2. **Location:** Kadıköy koordinatları doğru mu? (40.9833, 29.0167)
3. **Scraping:** Scraping başarılı oldu mu? Logları kontrol et

### API'de Sonuç Yok

1. **Database kontrol:** `npm run db:check` ile mekan sayısını kontrol et
2. **Category:** API'deki category ile database'deki category eşleşiyor mu?
3. **Location:** Kullanıcının konumu Kadıköy'e yakın mı? (10km radius)

## 📊 Beklenen Sonuçlar

Sync tamamlandıktan sonra:
- ✅ Database'de 200-500 mekan olmalı (kategori başına ~30-70)
- ✅ Her mekan için yorumlar olmalı
- ✅ Her mekan için 5 companion × kategori = analiz olmalı
- ✅ API anında yanıt vermeli

## 🎯 Sonraki Adımlar

1. Sync işlemini başlat: `npm run sync:kadikoy`
2. İşlem tamamlanana kadar bekleyin (2-3 saat)
3. Database'i kontrol edin: `npm run db:check`
4. Uygulamayı test edin


