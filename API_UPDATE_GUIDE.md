# 🔑 API Key Güncelleme Rehberi

## 🎯 Gerekli API Key'ler

### 1. ✅ Google Places/Maps API Key - ZORUNLU
**Kullanım:**
- Places API (New) - Mekan arama ve detaylar
- Places Photo API - Fotoğraf gösterimi
- Street View API - Fallback fotoğraflar

**Durum:** ⚠️ Mevcut key limit dolmuş - YENİ KEY GEREKLİ

---

### 2. ✅ Google AI API Key (Gemini) - OPSİYONEL
**Kullanım:**
- AI analizleri
- Yorum skorlama

**Durum:** ✅ Mevcut (AIzaSyBT1wZoWf1R9En7K1QMF5XeHlaTCQzh3uE)

---

## 📋 API Key Alma Adımları

### Adım 1: Google Cloud Console
1. [Google Cloud Console](https://console.cloud.google.com/)'a git
2. Yeni proje oluştur veya mevcut projeyi seç
3. Billing hesabı ekle (ücretsiz tier için gerekli)

### Adım 2: API'leri Etkinleştir
1. [API Library](https://console.cloud.google.com/apis/library) sayfasına git
2. Şu API'leri etkinleştir:
   - ✅ **Places API (New)**
   - ✅ **Places Photo API**
   - ✅ **Street View Static API** (opsiyonel)

### Adım 3: API Key Oluştur
1. [Credentials](https://console.cloud.google.com/apis/credentials) sayfasına git
2. **Create Credentials > API Key** seç
3. API key'i kopyala

### Adım 4: API Key'i Kısıtla (Önerilen)
1. Oluşturulan API key'e tıkla
2. **Application restrictions:**
   - HTTP referrers (web sitesi için)
   - Veya IP addresses (server için)
3. **API restrictions:**
   - Sadece gerekli API'leri seç:
     - Places API (New)
     - Places Photo API
     - Street View Static API

---

## 🔧 .env.local Güncelleme

Yeni API key'i `.env.local` dosyasına ekle:

```bash
# Google Places/Maps API Key (YENİ)
GOOGLE_PLACES_API_KEY=YENİ_API_KEY_BURAYA
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YENİ_API_KEY_BURAYA

# Google AI API Key (Mevcut - değiştirme)
GOOGLE_AI_API_KEY=AIzaSyBT1wZoWf1R9En7K1QMF5XeHlaTCQzh3uE

# Database (Mevcut - değiştirme)
DATABASE_URL=postgresql://postgres.tdquwneanxuavsgxcwgo:At280994at..@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
```

---

## ✅ Test

API key'i ekledikten sonra:

```bash
# Sistem sağlık kontrolü
npx tsx scripts/system-health-check.ts

# Build test
npm run build

# Dev server başlat
npm run dev
```

---

## 💰 Maliyet

### Ücretsiz Tier (Aylık $200 Kredi)
- **Places API (New)**: $32 per 1,000 requests
- **Places Photo API**: $7 per 1,000 requests
- **Street View API**: $7 per 1,000 requests

**Tahmini Kullanım:**
- 1,000 mekan arama = ~$32
- 1,000 fotoğraf = ~$7
- **Toplam: ~$39 per 1,000 mekan**

**Aylık $200 ile:**
- ~5,000 mekan çekebilirsin
- Ankara için yeterli ✅

---

## ⚠️ ÖNEMLİ NOTLAR

1. **API Key Güvenliği:**
   - `.env.local` dosyasına ekle
   - **ASLA** Git'e commit etme
   - Production'da environment variable kullan

2. **API Limitleri:**
   - Google Maps Platform: Aylık $200 ücretsiz kredi
   - Limit dolduğunda otomatik durur
   - Billing hesabı gerekli (ama ücretsiz tier kullanılabilir)

3. **API Key Kısıtlamaları:**
   - HTTP referrers ile kısıtla (production için)
   - Sadece gerekli API'leri etkinleştir
   - IP kısıtlaması ekle (opsiyonel)

---

**Tarih:** 10 Ocak 2026
