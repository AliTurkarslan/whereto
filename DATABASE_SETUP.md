# Database Sistemi - Kurulum ve Kullanım

## 🎯 Sistem Mimarisi

Artık API her seferinde scraping/AI yapmıyor. Bunun yerine:

1. **Background Jobs** → Mekanları scrape eder, AI analiz yapar, database'e kaydeder
2. **Database** → Tüm mekanlar, yorumlar, analizler burada
3. **API** → Sadece database'den okur (çok hızlı)

## 📦 Database Schema

### `places` - Mekanlar
- id, name, address, lat, lng
- rating, reviewCount
- category, googleMapsId
- lastScrapedAt, createdAt, updatedAt

### `reviews` - Yorumlar
- id, placeId, text, rating
- author, date

### `analyses` - AI Analiz Sonuçları
- id, placeId, category, companion
- score, why, risks
- reviewCategories (JSON)

## 🚀 Kurulum

### 1. Database'i Oluştur
```bash
npm run db:push
```

### 2. İlk Verileri Yükle
```bash
# İstanbul için restaurant'ları sync et
npm run sync:places -- --query "restaurant" --lat 41.0082 --lng 28.9784 --category "food"

# İstanbul için cafe'leri sync et
npm run sync:places -- --query "cafe" --lat 41.0082 --lng 28.9784 --category "coffee"
```

## 📝 Background Job Kullanımı

### Manuel Sync
```bash
npm run sync:places -- --query "restaurant" --lat 41.0082 --lng 28.9784 --category "food"
```

### Otomatik Sync (Cron Job)
```bash
# Her gün saat 02:00'de çalıştır
0 2 * * * cd /path/to/WhereTo && npm run sync:places -- --query "restaurant" --lat 41.0082 --lng 28.9784 --category "food"
```

## 🔄 API Kullanımı

API artık database'den okuyor:

```typescript
POST /api/recommend
{
  lat: 41.0082,
  lng: 28.9784,
  category: "food",
  companion: "alone"
}
```

**Response:** Database'den anında döner (scraping/AI yok)

## 📊 Database Yönetimi

### Drizzle Studio (GUI)
```bash
npm run db:studio
```
Tarayıcıda database'i görüntüle ve düzenle

### Migration'lar
```bash
npm run db:generate  # Migration dosyası oluştur
npm run db:push      # Database'e uygula
```

## ⚙️ Sistem Akışı

### İlk Kurulum
1. Database oluştur: `npm run db:push`
2. İlk verileri yükle: `npm run sync:places`
3. API kullanmaya başla

### Günlük Kullanım
1. Background job periyodik çalışır (cron)
2. Yeni mekanlar database'e eklenir
3. Eski mekanlar güncellenir
4. API her zaman database'den okur

## 🎯 Avantajlar

- ⚡ **Hız:** API anında yanıt verir
- 💰 **Maliyet:** AI sadece background job'da çalışır
- 📊 **Veri:** Tüm mekanlar database'de
- 🔄 **Güncellik:** Periyodik güncelleme
- 📈 **Ölçeklenebilirlik:** Binlerce mekan

## 📝 Notlar

- Database dosyası: `database.sqlite`
- İlk sync uzun sürebilir (AI analiz zaman alır)
- Her mekan için 5 companion × kategori = çok analiz
- Production'da PostgreSQL kullanılmalı


