# Google Places API Kurulum Rehberi

## 🎯 Neden Google Places API?

Web scraping yerine resmi Google Places API kullanmanın avantajları:

1. **Güvenilirlik** - Resmi API, DOM değişikliklerinden etkilenmez
2. **Daha Fazla Veri** - Yorumlar, rating, detaylar, fotoğraflar
3. **Hız** - API çağrıları scraping'den çok daha hızlı
4. **Rate Limiting** - Google tarafından yönetilir
5. **Ücretsiz Tier** - Aylık $200 kredi (yaklaşık 40,000+ request)

## 📋 Kurulum Adımları

### 1. Google Cloud Console'da Proje Oluştur

1. [Google Cloud Console](https://console.cloud.google.com/)'a git
2. Yeni proje oluştur veya mevcut projeyi seç
3. Billing hesabı ekle (ücretsiz tier için gerekli)

### 2. Places API'yi Etkinleştir

1. [API Library](https://console.cloud.google.com/apis/library) sayfasına git
2. "Places API (New)" araması yap
3. "Enable" butonuna tıkla

### 3. API Key Oluştur

1. [Credentials](https://console.cloud.google.com/apis/credentials) sayfasına git
2. "Create Credentials" > "API Key" seç
3. API key'i kopyala
4. (Opsiyonel) API key'i kısıtla:
   - Application restrictions: HTTP referrers
   - API restrictions: Places API (New) seç

### 4. Environment Variable Ekle

`.env.local` dosyasına ekle:

```bash
GOOGLE_PLACES_API_KEY=your_api_key_here
```

veya mevcut Google Maps API key'in varsa:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

## 💰 Fiyatlandırma

### Ücretsiz Tier (Aylık $200 Kredi)

- **Text Search (New)**: $32 per 1,000 requests
- **Nearby Search (New)**: $32 per 1,000 requests
- **Place Details (New)**: $17 per 1,000 requests
- **Place Photos (New)**: $7 per 1,000 requests

**Hesaplama:**
- 1,000 Text Search = $32
- 1,000 Nearby Search = $32
- 1,000 Place Details = $17
- **Toplam: ~$81 per 1,000 mekan**

**Aylık $200 ile:**
- ~2,500 mekan çekebilirsin (tüm detaylarla)
- Kadıköy için 400-500 mekan = ~$16-20

## 🚀 Kullanım

### Otomatik Kullanım

API key eklendikten sonra, sync script'i otomatik olarak Places API kullanır:

```bash
npm run sync:kadikoy
```

### Manuel Test

```bash
npm run sync:places -- --query "restaurant" --lat 40.9833 --lng 29.0167 --category "food"
```

## 📊 API Endpoints Kullanılan

### 1. Text Search (New)
- Query: "restaurant Kadıköy"
- Max results: 20 per request
- Pagination: nextPageToken ile

### 2. Nearby Search (New)
- Location: Kadıköy koordinatları
- Radius: 5km
- Type: restaurant, cafe, bar, etc.
- Max results: 20 per request

### 3. Place Details (New) - Gelecekte
- Place ID ile detaylı bilgi
- Yorumlar, fotoğraflar, çalışma saatleri

## ⚙️ Rate Limiting

- **Queries per second**: 10 QPS
- **Queries per day**: 40,000 (ücretsiz tier)
- Script'te otomatik rate limiting var (200ms delay)

## 🔍 Veri Kalitesi

Places API ile alınan veriler:
- ✅ Mekan isimleri
- ✅ Adresler
- ✅ Koordinatlar (lat/lng)
- ✅ Rating (0-5)
- ✅ Review count
- ✅ Place types
- ✅ Price level ($-$$$$)
- ⚠️ Yorumlar (Place Details ile - ekstra maliyet)

## 🎯 Kadıköy için Tahmini

**7 kategori × 50 mekan = 350 mekan**

- Text Search: 350 requests × $0.032 = $11.20
- Nearby Search: 350 requests × $0.032 = $11.20
- Place Details (opsiyonel): 350 × $0.017 = $5.95
- **Toplam: ~$28-30**

**Aylık $200 kredi ile rahatlıkla yeterli!**

## ⚠️ Önemli Notlar

1. **API Key Güvenliği**: API key'i asla public repository'ye commit etme
2. **Rate Limiting**: Script'te otomatik delay var, ama dikkatli ol
3. **Billing Alerts**: Google Cloud Console'da billing alerts ayarla
4. **Quota Limits**: Günlük limit'leri kontrol et

## 🔄 Fallback Mekanizması

Eğer API key yoksa veya API başarısız olursa:
- Otomatik olarak web scraping'e geçer
- Sistem kesintisiz çalışmaya devam eder

## 📝 Sonraki Adımlar

1. ✅ API key ekle
2. ✅ Sync script'i test et
3. ✅ Kadıköy için tüm kategorileri sync et
4. ✅ Database'i kontrol et
5. ✅ Uygulamayı test et


