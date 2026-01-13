# Scraping İyileştirmeleri

## 🔍 Sorun

"Yorum bulunamadı" hatası alınıyor. Google Maps scraping başarısız oluyor.

## 🔧 Yapılan İyileştirmeler

### 1. Daha Uzun Bekleme Süreleri
- Sayfa yükleme: 3s → 5s
- Scroll sonrası: 2s → 4s
- Toplam: ~10 saniye bekleme

### 2. Yorum Butonuna Tıklama
- "Yorumlar" veya "Reviews" butonunu bulup tıklıyor
- Yorumların açılmasını sağlıyor

### 3. Daha Agresif Scroll
- 3 kez → 10 kez scroll
- Farklı container'ları deniyor
- Ana sayfayı da scroll ediyor

### 4. Daha Fazla Selector
- 4 selector → 13 selector
- Yeni Google Maps yapısına uygun
- Fallback mekanizması güçlendirildi

### 5. Daha İyi Filtreleme
- Sadece büyük harf metinleri filtrele
- Daha uzun unique key (50 → 100 karakter)
- Daha iyi text validation

## 📊 Yeni Selector'lar

```javascript
'.MyEned',                    // Eski
'.wiI7pd',                    // Yorum text
'[data-review-id] .wiI7pd',   // Data attribute
'[jsaction*="review"] .wiI7pd', // JS action
'.jftiEf .wiI7pd',            // Yeni yapı
'.MyEned span',               // Nested
'[data-review-id] span',      // Span içinde
'.review-text',               // Generic
'[aria-label*="review"] span', // Aria label
'.fontBodyMedium',            // Yeni font class
'.m6QErb .wiI7pd',            // Container içinde
'div[role="listitem"] .wiI7pd', // Role-based
'.jftiEf .fontBodyMedium',    // Kombinasyon
```

## 🎯 Test Etme

Bir mekan için test:
```bash
npm run sync:reviews
```

Veya tek bir mekan için:
```typescript
import { fetchReviews } from './lib/scrapers/reviews-fetcher'

const reviews = await fetchReviews({
  name: 'Hane Kadıköy',
  lat: 40.9896756,
  lng: 29.018023
})
console.log('Found reviews:', reviews.length)
```

## ⚠️ Notlar

1. **Google Maps DOM Değişiklikleri**: Google Maps sık sık DOM yapısını değiştirir
2. **Bot Detection**: Google bot detection yapabilir, bu yüzden rate limiting önemli
3. **Yavaşlık**: Her mekan için ~10-15 saniye sürebilir
4. **Başarı Oranı**: %30-50 arası beklenebilir (Google Maps'in değişken yapısı nedeniyle)

## 🔄 Alternatif Çözümler

### 1. Google Places API (Önerilen)
- Place Details API kullan (yorumlar dahil)
- Daha güvenilir ama ücretli ($17/1000 request)
- Free tier: $200/ay

### 2. Hybrid Yaklaşım
- Önce API dene (ücretsiz limit içinde)
- Başarısız olursa scraping kullan

### 3. Manuel Yorum Ekleme
- Test için birkaç mekana manuel yorum ekle
- Production'da API kullan


