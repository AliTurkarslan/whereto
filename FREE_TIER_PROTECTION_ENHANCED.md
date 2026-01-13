# 🛡️ Free Tier Koruması - Geliştirilmiş

## 🎯 Amaç

Google Maps Platform free tier ($200/ay) limitlerini aşmamak için otomatik koruma mekanizması.

---

## ✅ Uygulanan Korumalar

### 1. Günlük Limit Kontrolü
- **Günlük limit:** ~$6.67 ($200/30 gün)
- **Otomatik reset:** Her gün gece yarısı
- **Kontrol:** Her API çağrısından önce

### 2. Request Limiting
- **Text Search:** Max 5 request per sync (free tier korumalı)
- **Nearby Search:** Max 5 request per sync (free tier korumalı)
- **Place Details:** Pahalı API, kullanımı sınırlı
- **Photo API:** Client-side'da track edilemez (server-side'da track edilmeli)

### 3. Otomatik Durdurma
- Günlük limit aşıldığında sync otomatik durur
- Warning log'ları gösterilir
- Sistem çalışmaya devam eder (sadece yeni sync yapılamaz)

---

## 📊 API Fiyatlandırması

| API | Fiyat (per 1,000) | Free Tier Limit |
|-----|------------------|-----------------|
| Places Text Search | $32 | ~6,250 request |
| Places Nearby Search | $32 | ~6,250 request |
| Place Details | $17 | ~11,765 request |
| Places Photo | $7 | ~28,571 request |
| Street View | $7 | ~28,571 request |

---

## 🔧 Yapılan Değişiklikler

### 1. Free Tier Protection Module
**Dosya:** `lib/utils/free-tier-protection.ts`

**Özellikler:**
- Günlük kullanım takibi
- Otomatik günlük reset
- API bazlı limit kontrolü
- Güvenli request limiti hesaplama

### 2. Places API Entegrasyonu
**Dosya:** `lib/scrapers/google-places-api.ts`

**Değişiklikler:**
- `searchPlaces`: Free tier koruması eklendi
- `searchNearby`: Free tier koruması eklendi
- `getPlaceDetails`: Free tier koruması eklendi
- Otomatik durdurma mekanizması

---

## 📋 Kullanım

### Günlük Kullanım Özeti
```typescript
import { getDailyUsageSummary } from '@/lib/utils/free-tier-protection'

const summary = getDailyUsageSummary()
console.log(`Günlük maliyet: $${summary.cost.toFixed(2)}`)
console.log(`Kalan: $${summary.remaining.toFixed(2)}`)
console.log(`Kullanım: %${summary.percentage.toFixed(1)}`)
```

### API Kullanımını Kaydet
```typescript
import { trackApiUsage } from '@/lib/utils/free-tier-protection'

const result = trackApiUsage('placesTextSearch', 1)
if (!result.allowed) {
  // Limit aşıldı, işlemi durdur
}
```

### Güvenli Request Limiti
```typescript
import { getSafeRequestLimit } from '@/lib/utils/free-tier-protection'

const safeLimit = getSafeRequestLimit('placesTextSearch', 10)
// Free tier limitine göre otomatik azaltılır
```

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. Client-Side API'ler
- **Places Photo API:** Client-side'da track edilemez
- **Street View API:** Client-side'da track edilemez
- **Çözüm:** Server-side'da track edilmeli veya rate limiting uygulanmalı

### 2. Günlük Reset
- Her gün gece yarısı otomatik reset
- In-memory storage (production'da database'e taşınmalı)
- Server restart'ta sıfırlanır

### 3. Billing Alerts
- Google Cloud Console'da billing alerts ayarla
- Günlük limit: $10 (önerilen)
- Aylık limit: $200 (free tier)

---

## 🚀 Sonraki Adımlar

### Production İyileştirmeleri
1. **Database Storage:** Günlük kullanımı database'de sakla
2. **Redis Cache:** Kullanım takibi için Redis kullan
3. **Monitoring:** API kullanımını dashboard'da göster
4. **Alerts:** Limit yaklaştığında email/SMS gönder

---

## 📊 Test

### Free Tier Koruması Testi
```bash
# Günlük kullanım özeti
npx tsx scripts/check-daily-usage.ts

# API kullanım testi
npx tsx scripts/test-api-usage.ts
```

---

**Tarih:** 10 Ocak 2026  
**Durum:** ✅ Free tier koruması aktif
