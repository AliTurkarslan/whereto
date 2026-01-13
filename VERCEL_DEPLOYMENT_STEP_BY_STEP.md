# 🚀 Vercel Deployment - Adım Adım Rehber

## 📋 Ön Hazırlık

### 1. Git Kontrolü
```bash
# Proje klasörüne git
cd /Users/mac_ali/WhereTo

# Git durumunu kontrol et
git status
```

Eğer git yoksa:
```bash
git init
git add .
git commit -m "Initial commit"
```

---

## 🎯 ADIM 1: GitHub'a Yükle

### 1.1. GitHub Hesabı Oluştur (Yoksa)
1. https://github.com adresine git
2. "Sign up" butonuna tıkla
3. Email ve şifre ile hesap oluştur

### 1.2. Yeni Repository Oluştur
1. GitHub'a giriş yap
2. Sağ üstteki **"+"** işaretine tıkla
3. **"New repository"** seç
4. **Repository name:** `whereto` yaz
5. **Public** seç (ücretsiz)
6. **"Create repository"** tıkla

### 1.3. Kodları GitHub'a Push Et

**Terminal'de şu komutları sırayla çalıştır:**

```bash
# 1. Proje klasörüne git (zaten oradasın)
cd /Users/mac_ali/WhereTo

# 2. Git remote ekle (KULLANICI_ADI yerine GitHub kullanıcı adını yaz!)
git remote add origin https://github.com/KULLANICI_ADI/whereto.git

# 3. Ana dalı ayarla
git branch -M main

# 4. Tüm değişiklikleri ekle
git add .

# 5. Commit yap
git commit -m "Vercel deployment için hazır"

# 6. GitHub'a push et
git push -u origin main
```

**Not:** 
- `KULLANICI_ADI` yerine GitHub kullanıcı adını yaz (örn: `ali` → `https://github.com/ali/whereto.git`)
- İlk push'ta GitHub kullanıcı adı ve şifre istenebilir
- Eğer 2FA (iki faktörlü doğrulama) açıksa, Personal Access Token kullanman gerekebilir

---

## 🎯 ADIM 2: Vercel Hesabı Oluştur

### 2.1. Vercel'e Kayıt Ol
1. https://vercel.com adresine git
2. **"Sign Up"** butonuna tıkla
3. **"Continue with GitHub"** seç (GitHub hesabınla giriş yap)

### 2.2. Vercel Dashboard'a Git
Giriş yaptıktan sonra otomatik olarak dashboard'a yönlendirileceksin.

---

## 🎯 ADIM 3: Projeyi Vercel'e Bağla

### 3.1. Yeni Proje Ekle
1. Vercel dashboard'da **"Add New..."** butonuna tıkla
2. **"Project"** seç

### 3.2. GitHub Repository'yi Seç
1. GitHub'dan **"whereto"** repository'sini seç
2. **"Import"** butonuna tıkla

### 3.3. Proje Ayarları
Vercel otomatik olarak Next.js projesini algılayacak. Ayarları kontrol et:

- **Framework Preset:** Next.js (otomatik algılanır)
- **Root Directory:** `./` (değiştirme)
- **Build Command:** `npm run build` (otomatik)
- **Output Directory:** `.next` (otomatik)
- **Install Command:** `npm install` (otomatik)

**Şimdilik "Deploy" butonuna TIKLAMA!** Önce environment variables ekleyelim.

---

## 🎯 ADIM 4: Environment Variables Ekle

### 4.1. Environment Variables Bölümüne Git
1. Proje ayarları sayfasında **"Environment Variables"** bölümüne scroll et
2. Veya **"Settings"** > **"Environment Variables"** sekmesine git

### 4.2. Gerekli Environment Variables'ı Ekle

**Her birini ayrı ayrı ekle:**

#### 1. Google Places API Key
- **Name:** `GOOGLE_PLACES_API_KEY`
- **Value:** `AIzaSyBrMQukYX3mhL_UYR2WgqxfJbAWwsvaAPI`
- **Environment:** Production, Preview, Development (hepsini seç)
- **"Add"** tıkla

#### 2. Google Maps API Key (Public)
- **Name:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **Value:** `AIzaSyBrMQukYX3mhL_UYR2WgqxfJbAWwsvaAPI`
- **Environment:** Production, Preview, Development (hepsini seç)
- **"Add"** tıkla

#### 3. Google AI API Key
- **Name:** `GOOGLE_AI_API_KEY`
- **Value:** `AIzaSyBT1wZoWf1R9En7K1QMF5XeHlaTCQzh3uE`
- **Environment:** Production, Preview, Development (hepsini seç)
- **"Add"** tıkla

#### 4. Database URL (Supabase)
- **Name:** `DATABASE_URL`
- **Value:** `postgresql://postgres.tdquwneanxuavsgxcwgo:At280994at..@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres`
- **Environment:** Production, Preview, Development (hepsini seç)
- **"Add"** tıkla

#### 5. Feedback Secret (Opsiyonel - Admin için)
- **Name:** `FEEDBACK_SECRET`
- **Value:** `your-secret-key-here` (kendi secret key'inizi oluşturun)
- **Environment:** Production, Preview, Development (hepsini seç)
- **"Add"** tıkla

### 4.3. Environment Variables Kontrolü
Tüm environment variables eklendikten sonra şunlar görünmeli:
- ✅ `GOOGLE_PLACES_API_KEY`
- ✅ `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- ✅ `GOOGLE_AI_API_KEY`
- ✅ `DATABASE_URL`
- ✅ `FEEDBACK_SECRET` (opsiyonel)

---

## 🎯 ADIM 5: Deploy Et!

### 5.1. Deploy Butonuna Tıkla
1. Tüm environment variables eklendikten sonra
2. Sayfanın altındaki **"Deploy"** butonuna tıkla

### 5.2. Build Sürecini İzle
1. Vercel otomatik olarak build başlatacak
2. **"Building"** aşamasını göreceksin
3. 2-5 dakika sürebilir
4. Build log'larını görmek için **"View Build Logs"** tıkla

### 5.3. Deploy Tamamlandı
Build başarılı olduğunda:
- ✅ **"Congratulations!"** mesajını göreceksin
- ✅ Yeşil tik işareti görünecek
- ✅ **"Visit"** butonuna tıklayarak uygulamayı açabilirsin

---

## 🎯 ADIM 6: Link'i Al ve Test Et

### 6.1. Production URL'i Bul
Deploy tamamlandıktan sonra Vercel sana bir URL verecek:
```
https://whereto-xxxxx.vercel.app
```

veya custom domain:
```
https://whereto.vercel.app
```

### 6.2. Link'i Kopyala
1. Vercel dashboard'da projeye tıkla
2. Üstte **"Visit"** butonuna tıkla veya URL'i kopyala

### 6.3. Uygulamayı Test Et
1. Link'i tarayıcıda aç
2. Ana sayfayı kontrol et
3. Bir arama yap (Ankara, restaurant, alone)
4. Sonuçları kontrol et
5. Geri bildirim butonunu kontrol et

---

## 🎯 ADIM 7: Test Kullanıcılarına Paylaş

### 7.1. Paylaşım Mesajı Hazırla

```
Merhaba! 👋

WhereTo uygulamasını test etmek ister misiniz?

🔗 Link: https://whereto-xxxxx.vercel.app

📋 Nasıl Kullanılır:
1. Konumunuzu girin (veya otomatik algılansın)
2. Ne aradığınızı seçin (Yemek, Kahve, vs.)
3. Kiminle gittiğinizi seçin (Yalnız, Sevgili, vs.)
4. Size uygun mekanları görün!

💬 Geri Bildirim:
Sağ alt köşedeki "Geri Bildirim" butonuna tıklayarak 
geri bildirim verebilirsiniz.

Teşekkürler! 🙏
```

### 7.2. Link'i Paylaş
- WhatsApp, Email, veya istediğin platformdan paylaş
- Test kullanıcıları linke tıklayarak uygulamayı kullanabilir

---

## 📊 Geri Bildirimleri Görüntüleme

### Terminal'den (Local)
```bash
# Database'e bağlan ve geri bildirimleri görüntüle
npm run feedback:view
```

### API'den (Production)
```bash
# FEEDBACK_SECRET ile
curl "https://whereto-xxxxx.vercel.app/api/feedback?secret=your-secret-key"
```

---

## 🔄 Güncelleme Yapma

Kod değişikliği yaptıktan sonra:

```bash
# 1. Değişiklikleri commit et
git add .
git commit -m "Güncelleme açıklaması"

# 2. GitHub'a push et
git push

# 3. Vercel otomatik olarak yeni deploy başlatacak!
```

Vercel her push'ta otomatik olarak yeni bir deploy yapar.

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. Environment Variables
- ✅ Production'da environment variables doğru eklendi mi?
- ✅ Tüm environment'lar için eklendi mi? (Production, Preview, Development)

### 2. Database
- ✅ Supabase database bağlantısı çalışıyor mu?
- ✅ Production'da database migration yapıldı mı?

### 3. API Keys
- ✅ Google Places API key aktif mi?
- ✅ Google AI API key aktif mi?
- ✅ API key'lerde gerekli API'ler etkinleştirildi mi?

### 4. Build
- ✅ Build başarılı mı?
- ✅ Hata var mı? (Build logs'u kontrol et)

---

## 🐛 Sorun Giderme

### Build Hatası
1. **Build Logs'u Kontrol Et:**
   - Vercel dashboard > Deployments > Son deployment > "View Build Logs"
   - Hata mesajını oku

2. **Local'de Test Et:**
   ```bash
   npm run build
   ```
   - Local'de build hatası varsa, Vercel'de de olur
   - Hataları düzelt ve tekrar push et

### Environment Variables Hatası
1. **Vercel Dashboard'da Kontrol Et:**
   - Settings > Environment Variables
   - Tüm değişkenler doğru mu?

2. **Değerleri Kontrol Et:**
   - API key'ler doğru mu?
   - Database URL doğru mu?

### Database Bağlantı Hatası
1. **Supabase Kontrolü:**
   - Supabase dashboard'da database aktif mi?
   - Connection string doğru mu?

2. **Migration Kontrolü:**
   - Database'de tablolar var mı?
   - Gerekirse migration script'i çalıştır

---

## ✅ Deployment Checklist

- [ ] GitHub repository oluşturuldu
- [ ] Kodlar GitHub'a push edildi
- [ ] Vercel hesabı oluşturuldu
- [ ] Proje Vercel'e import edildi
- [ ] Environment variables eklendi:
  - [ ] `GOOGLE_PLACES_API_KEY`
  - [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
  - [ ] `GOOGLE_AI_API_KEY`
  - [ ] `DATABASE_URL`
  - [ ] `FEEDBACK_SECRET` (opsiyonel)
- [ ] Deploy başarılı
- [ ] Uygulama test edildi
- [ ] Link test kullanıcılarına paylaşıldı

---

## 🎉 Başarı!

Deployment tamamlandı! Artık uygulaman internet üzerinden erişilebilir.

**Sonraki Adımlar:**
1. ✅ Test kullanıcılarına link paylaş
2. ✅ Geri bildirimleri topla
3. ✅ Geri bildirimleri analiz et
4. ✅ İyileştirmeler yap
5. ✅ Tekrar deploy et

---

**Tarih:** 10 Ocak 2026  
**Durum:** ✅ Rehber hazır
