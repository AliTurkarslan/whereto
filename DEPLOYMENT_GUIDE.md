# 🚀 Deployment ve Paylaşım Rehberi

## 📋 Hızlı Başlangıç

### Seçenek 1: Vercel (Önerilen - En Kolay)

Vercel Next.js için optimize edilmiş ve en kolay deployment seçeneği.

#### Adımlar:

1. **Vercel Hesabı Oluştur**
   - https://vercel.com adresine git
   - GitHub/GitLab/Bitbucket ile giriş yap

2. **Projeyi GitHub'a Push Et**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADI/WhereTo.git
   git push -u origin main
   ```

3. **Vercel'e Deploy Et**
   - Vercel dashboard'a git
   - "Add New Project" tıkla
   - GitHub repo'yu seç
   - "Import" tıkla
   - Environment Variables ekle (aşağıya bak)
   - "Deploy" tıkla

4. **Environment Variables Ekle**
   Vercel dashboard'da Settings > Environment Variables'a git ve şunları ekle:
   ```
   GOOGLE_PLACES_API_KEY=your-api-key
   GOOGLE_AI_API_KEY=your-ai-key
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key
   FEEDBACK_SECRET=your-secret-key (opsiyonel)
   ```

5. **Deploy Sonrası**
   - Vercel otomatik olarak bir URL verecek: `https://whereto-xxxxx.vercel.app`
   - Bu linki test kullanıcılarına paylaşabilirsin!

#### Avantajlar:
- ✅ Otomatik HTTPS
- ✅ Otomatik domain (vercel.app)
- ✅ Custom domain desteği (ücretsiz)
- ✅ Otomatik CI/CD (her push'ta deploy)
- ✅ Analytics (ücretsiz)
- ✅ Next.js için optimize

---

### Seçenek 2: Netlify

#### Adımlar:

1. **Netlify Hesabı Oluştur**
   - https://netlify.com adresine git
   - GitHub ile giriş yap

2. **Projeyi Deploy Et**
   - "Add new site" > "Import an existing project"
   - GitHub repo'yu seç
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `.next`
   - Environment Variables ekle
   - "Deploy site" tıkla

3. **Environment Variables**
   ```
   GOOGLE_PLACES_API_KEY=your-api-key
   GOOGLE_AI_API_KEY=your-ai-key
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key
   FEEDBACK_SECRET=your-secret-key
   ```

#### Avantajlar:
- ✅ Ücretsiz hosting
- ✅ Otomatik HTTPS
- ✅ Custom domain
- ✅ Form handling (geri bildirimler için)

---

### Seçenek 3: Railway

#### Adımlar:

1. **Railway Hesabı Oluştur**
   - https://railway.app adresine git
   - GitHub ile giriş yap

2. **Projeyi Deploy Et**
   - "New Project" > "Deploy from GitHub repo"
   - Repo'yu seç
   - Environment Variables ekle
   - Otomatik deploy başlar

3. **Environment Variables**
   Railway dashboard'da Variables sekmesinden ekle

#### Avantajlar:
- ✅ Database desteği (PostgreSQL)
- ✅ Kolay deployment
- ✅ Ücretsiz tier mevcut

---

## 🔧 Deployment Öncesi Kontrol Listesi

### 1. Environment Variables Kontrolü

`.env.local` dosyasında şunlar olmalı:
```env
GOOGLE_PLACES_API_KEY=your-key
GOOGLE_AI_API_KEY=your-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key
FEEDBACK_SECRET=your-secret (opsiyonel)
```

### 2. Database Migration

Production'da database migration yapılmalı:
```bash
npm run db:migrate-feedback
```

**Not:** SQLite dosyası local'de kalacak. Production için:
- Railway PostgreSQL kullanabilirsin
- Veya Vercel/Netlify'da SQLite dosyasını persistent storage'a taşıyabilirsin

### 3. Build Test

Local'de production build test et:
```bash
npm run build
npm start
```

Hata varsa düzelt.

### 4. .gitignore Kontrolü

`.gitignore` dosyasında şunlar olmalı:
```
.env.local
.env*.local
database.sqlite
database.sqlite-journal
database.sqlite-wal
node_modules
.next
```

---

## 📱 Paylaşım Linki

Deployment sonrası şu şekilde bir link alacaksın:

**Vercel:**
```
https://whereto-xxxxx.vercel.app
```

**Netlify:**
```
https://whereto-xxxxx.netlify.app
```

**Railway:**
```
https://whereto-production.up.railway.app
```

### Custom Domain (Opsiyonel)

1. **Vercel'de:**
   - Settings > Domains
   - Domain ekle (örn: whereto.app)
   - DNS ayarlarını yap

2. **Netlify'da:**
   - Site settings > Domain management
   - Custom domain ekle

---

## 🎯 Test Kullanıcılarına Paylaşım

### Örnek Mesaj:

```
Merhaba! 

WhereTo uygulamasını test etmek ister misiniz? 

🔗 Link: https://whereto-xxxxx.vercel.app

📋 Nasıl Kullanılır:
1. Konumunuzu girin (veya otomatik algılansın)
2. Ne aradığınızı seçin (Yemek, Kahve, vs.)
3. Kiminle gittiğinizi seçin
4. Size uygun mekanları görün!

💬 Geri Bildirim:
Sağ alt köşedeki butona tıklayarak geri bildirim verebilirsiniz.

Teşekkürler! 🙏
```

---

## 🔒 Güvenlik Notları

1. **API Keys:**
   - Asla GitHub'a commit etme
   - Environment variables kullan
   - Production ve development için farklı keys kullan (önerilir)

2. **Database:**
   - SQLite production için ideal değil
   - Çok kullanıcı için PostgreSQL kullan
   - Database backup al

3. **Rate Limiting:**
   - API rate limiting aktif
   - Google API quota'larını kontrol et

---

## 📊 Monitoring

### Vercel Analytics:
- Dashboard'da analytics görüntüle
- Kullanıcı sayısı, sayfa görüntülemeleri

### Geri Bildirim Takibi:
```bash
npm run feedback:view
```

### API Monitoring:
- Vercel dashboard'da Functions sekmesi
- API response times
- Error rates

---

## 🐛 Sorun Giderme

### Build Hatası:
```bash
# Local'de test et
npm run build

# Hataları kontrol et
npm run lint
```

### Database Hatası:
```bash
# Migration'ı tekrar çalıştır
npm run db:migrate-feedback
```

### Environment Variables:
- Vercel/Netlify dashboard'da kontrol et
- Deploy sonrası değişiklikler için yeniden deploy gerekebilir

---

## 🚀 Hızlı Deploy (Vercel CLI)

```bash
# Vercel CLI yükle
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Production deploy
vercel --prod
```

---

## 📝 Özet

1. ✅ GitHub'a push et
2. ✅ Vercel/Netlify'a bağla
3. ✅ Environment variables ekle
4. ✅ Deploy et
5. ✅ Link'i paylaş!

**En Hızlı Yol:** Vercel (5 dakika)

---

## 🆘 Yardım

Sorun yaşarsan:
1. Build log'larını kontrol et
2. Environment variables'ı kontrol et
3. Database migration'ı kontrol et
4. Vercel/Netlify support'a başvur



