# WhereTo - Pişman Olmazsın

Yanlış yer seçme korkusunu ortadan kaldıran, yakın mekanları uygunluk skoru ile gösteren Next.js uygulaması.

## 🎯 Proje Hakkında

WhereTo, kullanıcıların yanlış yer seçme korkusunu ortadan kaldırmak için tasarlanmış bir uygulamadır. Binlerce Google yorumunu AI ile analiz ederek, kullanıcının durumuna (ne arıyor, kiminle) en uygun mekanları uygunluk skoru ile gösterir.

## ✨ Özellikler

- 📍 **Konum Bazlı Arama**: Otomatik konum algılama veya manuel giriş
- 🤖 **AI Destekli Analiz**: Google Gemini ile yorum analizi ve kategorizasyon
- 🗺️ **Harita Görünümü**: Leaflet ile interaktif harita
- 📊 **Uygunluk Skoru**: Her mekan için 0-100 arası uygunluk skoru
- 📝 **Yorum Analizi**: Kategorize edilmiş yorum analizi (Servis, Fiyat, Kalite, vb.)
- 🎨 **Modern UI**: Tailwind CSS + shadcn/ui ile modern ve minimalist tasarım
- 🌍 **Çok Dilli**: Türkçe ve İngilizce destek
- 🚀 **Hızlı**: Database-backed caching ile anında sonuçlar
- 📸 **Mekan Fotoğrafları**: Google Street View entegrasyonu
- 🧭 **Navigasyon**: Google Maps ile rota gösterimi

## Özellikler

- 📍 Konum bazlı mekan arama
- 🤖 AI destekli uygunluk skorlama
- 🗺️ Harita görünümü
- 🌍 Çok dilli destek (Türkçe/İngilizce)
- ⚡ Hızlı ve minimal arayüz

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Google AI API anahtarınızı alın:
   - https://makersuite.google.com/app/apikey adresinden API anahtarı oluşturun

3. `.env.local` dosyası oluşturun:
```bash
cp .env.local.example .env.local
```

4. `.env.local` dosyasına API anahtarınızı ekleyin:
```
GOOGLE_AI_API_KEY=your_api_key_here
```

5. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

6. Tarayıcıda `http://localhost:3000` adresini açın

## Kullanım

1. **Konum Seç**: Otomatik algılama veya manuel giriş
2. **Kategori Seç**: Ne arıyorsun? (Yemek, Kahve, Bar, vs.)
3. **Yanındakini Seç**: Kiminle? (Yalnız, Sevgili, Arkadaş, vs.)
4. **Sonuçları Gör**: Uygunluk skorları ile mekanları görüntüle

## Teknik Detaylar

- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **AI**: Google Gemini Pro
- **Scraping**: Puppeteer (Google Maps)
- **Harita**: Leaflet + OpenStreetMap
- **Dil**: TypeScript

## Notlar

- Google Maps scraping rate limiting'e tabidir
- Puppeteer headless modda çalışır
- Cache mekanizması 1 saat TTL ile çalışır
- Production'da Redis gibi bir cache servisi kullanılmalıdır

## Lisans

MIT

