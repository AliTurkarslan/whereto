# 🧪 Test Kullanıcıları İçin Hazırlık Rehberi

## ✅ Mevcut Durum

Geri bildirim sistemi **hazır ve aktif**:
- ✅ Feedback tablosu database'de mevcut
- ✅ FeedbackButton component'i ana sayfa ve sonuç sayfasında görünüyor
- ✅ API endpoint çalışıyor (`/api/feedback`)
- ✅ Geri bildirim görüntüleme script'i hazır

---

## 🚀 Test Kullanıcılarına Dağıtım

### 1. Production Build ve Deploy

#### Seçenek A: Vercel/Netlify (Önerilen)
```bash
# Git'e push yap
git add .
git commit -m "Test kullanıcıları için hazır"
git push

# Vercel/Netlify otomatik deploy edecek
```

#### Seçenek B: Local Production Build
```bash
npm run build
npm start
```

### 2. Test Linki Paylaşımı

Test kullanıcılarına şu linki paylaşın:
- **Production URL:** `https://your-domain.com/tr` (veya `/en`)
- **Local URL:** `http://localhost:3000/tr` (eğer local test yapıyorsanız)

---

## 📋 Test Kullanıcılarına Talimatlar

### Kullanım Adımları

1. **Uygulamayı Açın**
   - Linke tıklayın
   - Ana sayfada wizard'ı görün

2. **Wizard'ı Tamamlayın**
   - Konum seçin (otomatik veya manuel)
   - Kategori seçin (yemek, kahve, vb.)
   - Yanındakini seçin (yalnız, sevgili, vb.)

3. **Sonuçları İnceleyin**
   - Önerilen mekanları görün
   - Filtreleme ve sıralama yapın
   - Harita görünümüne geçin

4. **Geri Bildirim Verin**
   - Sağ alt köşedeki **"Geri Bildirim"** butonuna tıklayın
   - Formu doldurun:
     - Rating (1-5 yıldız)
     - Kategori (Kullanılabilirlik, Tasarım, Performans, Özellikler, Diğer)
     - Sorunlar (varsa)
     - Detaylı geri bildirim

---

## 📊 Geri Bildirimleri Görüntüleme

### Terminal'den Görüntüleme
```bash
npm run feedback:view
```

Bu komut şunları gösterir:
- Toplam geri bildirim sayısı
- Ortalama rating
- Kategori bazlı dağılım
- Rating bazlı dağılım
- Son 10 geri bildirim

### API'den Görüntüleme (Admin)

Önce `.env.local` dosyasına `FEEDBACK_SECRET` ekleyin:
```env
FEEDBACK_SECRET=your-secret-key-here
```

Sonra API'den çekin:
```bash
curl "http://localhost:3000/api/feedback?secret=your-secret-key"
```

---

## 🎯 Test Senaryoları

### Senaryo 1: İlk Kullanım
1. Kullanıcı uygulamayı açıyor
2. Wizard'ı tamamlıyor
3. Sonuçları görüyor
4. Geri bildirim veriyor

**Beklenen Geri Bildirimler:**
- Onboarding deneyimi
- Wizard kullanım kolaylığı
- Sonuç sayfası anlaşılabilirliği

### Senaryo 2: Filtreleme ve Sıralama
1. Kullanıcı sonuçları filtreliyor
2. Farklı sıralama seçeneklerini deniyor
3. Geri bildirim veriyor

**Beklenen Geri Bildirimler:**
- Filtre kullanım kolaylığı
- Sıralama seçenekleri yeterliliği
- Sonuç kalitesi

### Senaryo 3: Harita Görünümü
1. Kullanıcı harita görünümüne geçiyor
2. Mekanları haritada görüyor
3. Geri bildirim veriyor

**Beklenen Geri Bildirimler:**
- Harita kullanım kolaylığı
- Marker görünürlüğü
- Harita performansı

---

## 📈 Başarı Metrikleri

### Minimum Başarı Kriterleri
- ✅ Ortalama rating ≥ 4.0
- ✅ %70+ kullanıcı 4-5 yıldız veriyor
- ✅ Her kategoride en az 10 geri bildirim

### İdeal Başarı Kriterleri
- ✅ Ortalama rating ≥ 4.5
- ✅ %85+ kullanıcı 4-5 yıldız veriyor
- ✅ Kritik sorun sayısı < 5
- ✅ Her kategoride en az 20 geri bildirim

---

## 🔧 Hızlı Kontrol

### Sistem Hazır mı?
```bash
# Geri bildirim sistemi kontrolü
npx tsx scripts/check-feedback-system.ts
```

### Geri Bildirimleri Görüntüle
```bash
# Terminal'den görüntüle
npm run feedback:view
```

---

## 📝 Test Sonrası Analiz

### Öncelikli Analiz Alanları

1. **Rating Dağılımı**
   - %80+ kullanıcı 4-5 yıldız veriyorsa → İyi
   - %50+ kullanıcı 3 veya altı veriyorsa → İyileştirme gerekli

2. **Kategori Analizi**
   - En çok hangi kategoride geri bildirim var?
   - Hangi kategori en düşük rating alıyor?

3. **Sorun Analizi**
   - En çok hangi sorunlar bildiriliyor?
   - Hangi sorunlar kritik?

4. **Metin Analizi**
   - Ortak kelimeler neler?
   - Hangi özellikler eksik?
   - Hangi özellikler beğeniliyor?

---

## 🎯 İyileştirme Öncelikleri

### Yüksek Öncelikli
- 3+ kullanıcı aynı sorunu bildiriyorsa → Hemen düzelt
- Rating < 3 olan kategoriler → Öncelikli iyileştir
- Tekrarlanan özellik istekleri → Roadmap'e ekle

### Orta Öncelikli
- 2 kullanıcı aynı sorunu bildiriyorsa → Değerlendir
- Rating 3-4 arası kategoriler → İyileştir

### Düşük Öncelikli
- Tek kullanıcı bildirimi → Gelecek versiyonlarda değerlendir
- Rating 4+ kategoriler → Optimize et

---

## 🔒 Gizlilik ve Güvenlik

- ✅ Geri bildirimler anonim olarak toplanır
- ✅ Kişisel bilgi toplanmaz (sadece user agent ve URL)
- ✅ Database'de güvenli saklanır
- ✅ Sadece admin erişimi (secret key ile)

---

## ✅ Hazırlık Checklist

- [x] Feedback tablosu database'de mevcut
- [x] FeedbackButton component'i sayfalarda görünüyor
- [x] API endpoint çalışıyor
- [ ] Production deploy yapıldı (veya local test için hazır)
- [ ] Test kullanıcılarına link paylaşıldı
- [ ] FEEDBACK_SECRET ayarlandı (opsiyonel, admin için)

---

**Tarih:** 10 Ocak 2026  
**Durum:** ✅ Sistem hazır, test kullanıcılarına dağıtılabilir
