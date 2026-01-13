# 🔧 Vercel Environment Variables Düzeltme Rehberi

## ❌ Mevcut Sorun

Vercel'de environment variables eksik olduğu için:
- ❌ Database bağlantısı çalışmıyor
- ❌ API keys eksik
- ❌ Arama sonuçları gelmiyor

---

## ✅ Çözüm: Environment Variables Ekle

### ADIM 1: Vercel Dashboard'a Git

1. **https://vercel.com/dashboard** → Projeyi aç
2. **Settings** sekmesine tıkla
3. **Environment Variables** bölümüne git

---

### ADIM 2: 5 Environment Variable Ekle

Her birini aşağıdaki gibi ekle:

#### 1️⃣ DATABASE_URL (EN ÖNEMLİ!)

```
Name: DATABASE_URL
Value: postgresql://postgres.tdquwneanxuavsgxcwgo:At280994at..@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
Environment: ✅ Production, ✅ Preview, ✅ Development
```

**⚠️ ÖNEMLİ:** Tüm environment'ları seç (Production, Preview, Development)

---

#### 2️⃣ GOOGLE_PLACES_API_KEY

```
Name: GOOGLE_PLACES_API_KEY
Value: AIzaSyBrMQukYX3mhL_UYR2WgqxfJbAWwsvaAPI
Environment: ✅ Production, ✅ Preview, ✅ Development
```

---

#### 3️⃣ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

```
Name: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
Value: AIzaSyBrMQukYX3mhL_UYR2WgqxfJbAWwsvaAPI
Environment: ✅ Production, ✅ Preview, ✅ Development
```

---

#### 4️⃣ GOOGLE_AI_API_KEY

```
Name: GOOGLE_AI_API_KEY
Value: AIzaSyBT1wZoWf1R9En7K1QMF5XeHlaTCQzh3uE
Environment: ✅ Production, ✅ Preview, ✅ Development
```

---

#### 5️⃣ FEEDBACK_SECRET (Opsiyonel)

```
Name: FEEDBACK_SECRET
Value: whereto-feedback-secret-2026
Environment: ✅ Production, ✅ Preview, ✅ Development
```

---

### ADIM 3: Deploy'u Yeniden Başlat

1. Environment variables eklendikten sonra
2. **Deployments** sekmesine git
3. En son deployment'ın yanındaki **"..."** menüsüne tıkla
4. **"Redeploy"** seç
5. Veya yeni bir commit push et (otomatik deploy olur)

---

## ✅ Kontrol Listesi

- [ ] DATABASE_URL eklendi (tüm environment'lar)
- [ ] GOOGLE_PLACES_API_KEY eklendi (tüm environment'lar)
- [ ] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY eklendi (tüm environment'lar)
- [ ] GOOGLE_AI_API_KEY eklendi (tüm environment'lar)
- [ ] FEEDBACK_SECRET eklendi (tüm environment'lar - opsiyonel)
- [ ] Deploy yeniden başlatıldı
- [ ] Health check çalışıyor: https://whereto-sigma.vercel.app/api/health
- [ ] Arama test edildi

---

## 🧪 Test Et

### 1. Health Check

Tarayıcıda aç:
```
https://whereto-sigma.vercel.app/api/health
```

**Beklenen Sonuç:**
```json
{
  "status": "healthy",
  "checks": {
    "config": { "status": "ok" },
    "database": { "status": "ok", "message": "X tables found" },
    "apiKeys": { "status": "ok", "message": "Places API: OK, AI API: OK" }
  }
}
```

### 2. Arama Testi

Ana sayfada:
- Konum: Ankara
- Kategori: Yemek
- Kiminle: Yalnız
- "Ara" butonuna tıkla

**Beklenen:** Sonuçlar gelmeli (191 mekan var)

---

## 🚨 Hala Çalışmıyorsa

### Sorun 1: "DATABASE_URL not set" Hatası

**Çözüm:**
1. Vercel dashboard'da environment variable'ı kontrol et
2. Tüm environment'ları seçtiğinden emin ol (Production, Preview, Development)
3. Deploy'u yeniden başlat

### Sorun 2: "Connection refused" veya "Connection timeout"

**Çözüm:**
1. Supabase dashboard'da database'in aktif olduğunu kontrol et
2. Connection string'in doğru olduğunu kontrol et
3. Supabase'de IP whitelist kontrolü yap (gerekirse tüm IP'lere izin ver)

### Sorun 3: "API key invalid" Hatası

**Çözüm:**
1. Google Cloud Console'da API key'in aktif olduğunu kontrol et
2. API key'in doğru olduğunu kontrol et
3. Gerekli API'lerin enable edildiğini kontrol et:
   - Places API (New)
   - Maps JavaScript API
   - Gemini API

---

## 📞 Yardım

Hala sorun varsa:
1. Vercel deployment logs'u kontrol et
2. Browser console'da hata var mı bak
3. Network tab'de API isteklerini kontrol et

---

**Sonraki Adım:** Environment variables'ı ekle ve deploy'u yeniden başlat! 🚀
