# 🔑 Gerekli API Key'ler

## 🎯 Kullanılan Google API'leri

### 1. ✅ Google Places API (New) - ZORUNLU
**Kullanım:**
- Mekan arama (Text Search, Nearby Search)
- Mekan detayları (Place Details)
- Yorumlar çekme
- Fotoğraf referansları

**API Key:**
- `GOOGLE_PLACES_API_KEY` veya
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

**Durum:** ⚠️ API limit dolmuş - YENİ KEY GEREKLİ

---

### 2. ✅ Google Places Photo API - ZORUNLU
**Kullanım:**
- Mekan fotoğraflarını gösterme
- Photo reference'den URL oluşturma

**API Key:**
- `GOOGLE_PLACES_API_KEY` veya
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- (Places API ile aynı key kullanılır)

**Durum:** ⚠️ API limit dolmuş - YENİ KEY GEREKLİ

---

### 3. ✅ Google Street View Static API - OPSİYONEL
**Kullanım:**
- Mekan fotoğrafları (fallback)
- Street View görüntüleri

**API Key:**
- `GOOGLE_PLACES_API_KEY` veya
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- (Places API ile aynı key kullanılır)

**Durum:** ⚠️ API limit dolmuş - YENİ KEY GEREKLİ

---

### 4. ✅ Google Generative AI (Gemini) - OPSİYONEL
**Kullanım:**
- Yorum analizi
- Mekan skorlama
- AI-powered öneriler

**API Key:**
- `GOOGLE_AI_API_KEY`

**Durum:** ✅ Mevcut (AIzaSyBT1wZoWf1R9En7K1QMF5XeHlaTCQzh3uE)

---

## 📋 Gerekli API Key'ler

### ZORUNLU (Sistem çalışması için)
1. **Google Places API Key** (veya Google Maps API Key)
   - Places API (New) için
   - Places Photo API için
   - Street View API için

### OPSİYONEL (Gelişmiş özellikler için)
2. **Google AI API Key** (Gemini)
   - AI analizleri için
   - ✅ Zaten mevcut

---

## 🔧 API Key Ekleme

### 1. Google Cloud Console'dan Yeni Key Al

1. [Google Cloud Console](https://console.cloud.google.com/)'a git
2. Yeni proje oluştur veya mevcut projeyi seç
3. **APIs & Services > Credentials** bölümüne git
4. **Create Credentials > API Key** seç
5. API key'i kopyala

### 2. Gerekli API'leri Etkinleştir

Yeni API key için şu API'leri etkinleştir:
- ✅ **Places API (New)**
- ✅ **Places Photo API**
- ✅ **Street View Static API** (opsiyonel)
- ✅ **Maps JavaScript API** (opsiyonel)

### 3. .env.local Dosyasına Ekle

```bash
# Google Places/Maps API Key (ZORUNLU)
GOOGLE_PLACES_API_KEY=YENİ_API_KEY_BURAYA
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YENİ_API_KEY_BURAYA

# Google AI API Key (OPSİYONEL - zaten mevcut)
GOOGLE_AI_API_KEY=AIzaSyBT1wZoWf1R9En7K1QMF5XeHlaTCQzh3uE
```

---

## ⚠️ ÖNEMLİ NOTLAR

1. **API Key Güvenliği:**
   - API key'i `.env.local` dosyasına ekle
   - **ASLA** Git'e commit etme
   - Production'da environment variable olarak kullan

2. **API Limitleri:**
   - Google Maps Platform: Aylık $200 ücretsiz kredi
   - Places API (New): $32 per 1,000 requests
   - Places Photo API: $7 per 1,000 requests
   - Street View API: $7 per 1,000 requests

3. **API Key Kısıtlamaları:**
   - HTTP referrers ile kısıtla (production için)
   - Sadece gerekli API'leri etkinleştir
   - IP kısıtlaması ekle (opsiyonel)

---

## 🚀 Sonraki Adımlar

1. ✅ Yeni Google Places/Maps API key al
2. ✅ `.env.local` dosyasına ekle
3. ✅ Sistem test et
4. ✅ Fotoğrafların geldiğini kontrol et

---

**Tarih:** 10 Ocak 2026
