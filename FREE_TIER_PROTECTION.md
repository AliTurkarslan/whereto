# Free Tier Koruması - Google Places API

## ✅ Uygulanan Güvenlik Önlemleri

### 1. Request Limitleri
- **Max 3 request per kategori** (Text Search + Nearby Search)
- **Max 50 mekan per kategori**
- **Toplam: 7 kategori × 6 request = 42 request**

### 2. Rate Limiting
- **500ms delay** her request arasında
- **2 saniye delay** kategori aralarında
- **429 (Rate Limit) kontrolü** - otomatik bekleme

### 3. Maliyet Kontrolü
- **Place Details API kullanılmıyor** ($17/1000 - çok pahalı)
- **Yorumlar scraping ile alınacak** (ücretsiz)
- **Sadece Text Search + Nearby Search** kullanılıyor

### 4. Tahmini Maliyet

**Kadıköy için 7 kategori:**
- Text Search: 7 kategori × 3 request = 21 request = **$0.67**
- Nearby Search: 7 kategori × 3 request = 21 request = **$0.67**
- **Toplam: ~$1.34**

**Free Tier: $200/ay**
- **Kalan: $198.66** ✅
- **Güvenli marj: %99.3**

## 📊 API Kullanımı

### Kullanılan Endpoints

1. **Text Search (New)** - $32/1000
   - Query: "restaurant Kadıköy"
   - Max 20 results per request
   - Max 3 requests per kategori

2. **Nearby Search (New)** - $32/1000
   - Location: Kadıköy koordinatları
   - Radius: 5km
   - Max 20 results per request
   - Max 3 requests per kategori

### Kullanılmayan Endpoints (Pahalı)

❌ **Place Details (New)** - $17/1000
- Yorumlar için çok pahalı
- 350 mekan × $0.017 = $5.95
- Scraping ile alınacak

❌ **Place Photos (New)** - $7/1000
- Şimdilik gerekli değil

## 🔒 Güvenlik Özellikleri

### Otomatik Kontroller

1. **Rate Limit Detection**
   ```typescript
   if (response.status === 429) {
     console.warn('⚠️  Rate limit reached, waiting 1 second...')
     await new Promise(resolve => setTimeout(resolve, 1000))
     continue
   }
   ```

2. **Request Count Limiting**
   ```typescript
   const maxRequests = Math.min(Math.ceil(maxResults / 20), 3)
   ```

3. **Delay Between Requests**
   ```typescript
   await new Promise(resolve => setTimeout(resolve, 500))
   ```

## 📝 Kullanım

### Güvenli Sync

```bash
npm run sync:kadikoy:safe
```

Bu komut:
- ✅ Free tier limitlerini kontrol eder
- ✅ Rate limiting uygular
- ✅ Maliyet tahmini gösterir
- ✅ Hata durumunda durur

### Tek Kategori Test

```bash
npm run sync:places -- --query "restaurant" --lat 40.9833 --lng 29.0167 --category "food"
```

## ⚠️ Önemli Notlar

1. **API Key Güvenliği**
   - `.env.local` dosyasında saklanıyor
   - Git'e commit edilmiyor (`.gitignore`)

2. **Billing Alerts**
   - Google Cloud Console'da billing alerts ayarla
   - Günlük limit: $10 (önerilen)

3. **Quota Limits**
   - Günlük limit: 40,000 requests (free tier)
   - Bizim kullanım: ~42 requests
   - **Güvenli marj: %99.9**

4. **Monitoring**
   - Google Cloud Console'da API kullanımını kontrol et
   - https://console.cloud.google.com/apis/dashboard

## 🎯 Sonuç

✅ **Free tier limitleri aşılmayacak**
✅ **Güvenli rate limiting**
✅ **Maliyet kontrolü**
✅ **Otomatik hata yönetimi**

**Toplam maliyet: ~$1.34 (Free tier: $200/ay)**
**Güvenli marj: %99.3** 🎉


