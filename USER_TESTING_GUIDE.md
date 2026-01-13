# 🧪 Kullanıcı Testi Rehberi

## 📋 Test Süreci

### 1. Hazırlık

#### Database Migration
```bash
npm run db:migrate-feedback
```

Bu komut `feedback` tablosunu oluşturur.

#### Environment Variables
`.env.local` dosyasına ekleyin (opsiyonel, admin için):
```env
FEEDBACK_SECRET=your-secret-key-here
```

### 2. Test Kullanıcılarına Dağıtım

#### Deployment
1. Production build:
```bash
npm run build
npm start
```

2. Veya Vercel/Netlify gibi bir platforma deploy edin.

#### Test Linki Paylaşımı
- Test kullanıcılarına uygulama linkini paylaşın
- Her kullanıcıya benzersiz bir test ID verebilirsiniz (opsiyonel)

### 3. Geri Bildirim Toplama

#### Otomatik Toplama
- Kullanıcılar sağ alt köşedeki **Geri Bildirim** butonuna tıklayabilir
- Geri bildirim otomatik olarak database'e kaydedilir

#### Geri Bildirim Formu İçeriği
- **Rating**: 1-5 yıldız
- **Kategori**: Kullanılabilirlik, Tasarım, Performans, Özellikler, Diğer
- **Sorunlar**: Yavaş yükleme, Kafa karıştırıcı, Eksik özellik, Hata/Bug, Arayüz sorunu
- **Detaylı Geri Bildirim**: Serbest metin

### 4. Geri Bildirimleri Görüntüleme

#### Terminal'den Görüntüleme
```bash
npm run feedback:view
```

Bu komut:
- Toplam geri bildirim sayısı
- Ortalama rating
- Kategori bazlı dağılım
- Rating bazlı dağılım
- Son 10 geri bildirimi gösterir

#### API'den Görüntüleme (Admin)
```bash
curl "http://localhost:3000/api/feedback?secret=your-secret-key"
```

Response:
```json
{
  "feedback": [...],
  "stats": {
    "total": 100,
    "averageRating": 4.2,
    "byCategory": {
      "usability": 30,
      "design": 25,
      "performance": 20,
      "features": 15,
      "other": 10
    },
    "byRating": {
      "5": 50,
      "4": 30,
      "3": 15,
      "2": 3,
      "1": 2
    }
  }
}
```

### 5. Test Sonuçlarını Analiz Etme

#### Öncelikli Analiz Alanları

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

### 6. İyileştirme Önerileri

#### Yüksek Öncelikli İyileştirmeler
- 3+ kullanıcı aynı sorunu bildiriyorsa → Hemen düzelt
- Rating < 3 olan kategoriler → Öncelikli iyileştir
- Tekrarlanan özellik istekleri → Roadmap'e ekle

#### Orta Öncelikli İyileştirmeler
- 2 kullanıcı aynı sorunu bildiriyorsa → Değerlendir
- Rating 3-4 arası kategoriler → İyileştir

#### Düşük Öncelikli İyileştirmeler
- Tek kullanıcı bildirimi → Gelecek versiyonlarda değerlendir
- Rating 4+ kategoriler → Optimize et

## 📊 Örnek Test Senaryosu

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

## 🎯 Başarı Metrikleri

### Minimum Başarı Kriterleri
- ✅ Ortalama rating ≥ 4.0
- ✅ %70+ kullanıcı 4-5 yıldız veriyor
- ✅ Her kategoride en az 10 geri bildirim

### İdeal Başarı Kriterleri
- ✅ Ortalama rating ≥ 4.5
- ✅ %85+ kullanıcı 4-5 yıldız veriyor
- ✅ Kritik sorun sayısı < 5
- ✅ Her kategoride en az 20 geri bildirim

## 📝 Test Sonrası Rapor

### Rapor İçeriği
1. **Genel İstatistikler**
   - Toplam geri bildirim sayısı
   - Ortalama rating
   - Rating dağılımı

2. **Kategori Analizi**
   - Her kategori için rating
   - Her kategori için geri bildirim sayısı
   - Kategori bazlı sorunlar

3. **Sorun Analizi**
   - En çok bildirilen sorunlar
   - Kritik sorunlar
   - Tekrarlanan sorunlar

4. **Özellik İstekleri**
   - En çok istenen özellikler
   - Öncelikli özellikler

5. **İyileştirme Önerileri**
   - Yüksek öncelikli iyileştirmeler
   - Orta öncelikli iyileştirmeler
   - Düşük öncelikli iyileştirmeler

## 🔒 Gizlilik ve Güvenlik

- Geri bildirimler anonim olarak toplanır
- Kişisel bilgi toplanmaz (sadece user agent ve URL)
- Database'de güvenli saklanır
- Sadece admin erişimi (secret key ile)

## 📞 Destek

Test sırasında sorun yaşarsanız:
1. Geri bildirim formunu kullanın
2. Veya doğrudan iletişime geçin



