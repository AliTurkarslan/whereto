# Yorum ve Skorlama İyileştirmeleri

## 🎯 Yapılan İyileştirmeler

### 1. ✅ Yorum Verilerini Database'den Çekme

**Sorun:**
- Yorumlar sync sırasında çekiliyor ama API'de kullanılmıyordu
- Database'de yorumlar var ama erişilemiyordu

**Çözüm:**
- `getPlacesWithReviews()` fonksiyonu eklendi
- API'de mekanlar çekilirken yorumlar da database'den alınıyor
- Yorumlar `placeReviews` olarak mekanlara ekleniyor

**Kod:**
```typescript
// lib/db/index.ts
export async function getPlacesWithReviews(placeIds: number[])
```

### 2. ✅ Basit Yorum Analizi (AI Olmadan)

**Sorun:**
- AI API key yoksa veya başarısız olursa skorlama yapılamıyordu
- Sadece rating'e göre basit skorlama vardı

**Çözüm:**
- `lib/analysis/simple-scoring.ts` oluşturuldu
- Keyword bazlı kategori analizi
- Pozitif/negatif yorum tespiti
- Kategori bazlı skorlama
- Companion ve kategori uyumuna göre ayarlama

**Özellikler:**
- 7 kategori analizi (servis, fiyat, kalite, ortam, lokasyon, temizlik, hız)
- Pozitif/negatif oran hesaplama
- Örnek yorum seçimi
- Otomatik açıklama üretimi

### 3. ✅ Skorlama Mantığı İyileştirmesi

**Yeni Mantık:**

1. **Yorum Analizi** (öncelikli)
   - Kategori bazlı analiz
   - Pozitif/negatif oran
   - Genel skor hesaplama

2. **Rating** (yorum yoksa)
   - Rating × 20 = Skor
   - Varsayılan: 50

3. **Kategori Uyumu**
   - Yemek → Kalite önemli
   - Aile → Temizlik önemli

4. **Companion Uyumu**
   - Partner: +5
   - Family: +10
   - Colleagues: -5

5. **Final Skor**
   - 0-100 arası sınırlandırma
   - Açıklama ve riskler

## 📊 Skorlama Akışı

```
Mekan Çek
    ↓
Yorumlar Var mı?
    ├─ Evet → Basit Analiz veya AI Analiz
    └─ Hayır → Rating'e Göre veya Varsayılan
    ↓
Kategori Uyumu Ayarla
    ↓
Companion Uyumu Ayarla
    ↓
Final Skor (0-100)
```

## 🔄 Kullanım Senaryoları

### Senaryo 1: AI Key Var + Yorum Var
1. AI analizi yapılır
2. Sonuç cache'lenir
3. Database'e kaydedilir

### Senaryo 2: AI Key Yok + Yorum Var
1. Basit analiz yapılır
2. Keyword bazlı kategori analizi
3. Skor hesaplanır

### Senaryo 3: Yorum Yok + Rating Var
1. Rating × 20 = Skor
2. Varsayılan açıklama

### Senaryo 4: Hiçbiri Yok
1. Varsayılan skor: 50
2. "Yorum verisi yetersiz"

## 📝 Basit Analiz Detayları

### Kategori Tespiti

**Keyword Matching:**
- Her kategori için özel keyword'ler
- Yorum metninde keyword arama
- Kategoriye göre gruplama

**Örnek:**
```typescript
servis: ['servis', 'personel', 'garson', 'müşteri hizmeti']
fiyat: ['fiyat', 'ucuz', 'pahalı', 'değer']
kalite: ['kalite', 'lezzetli', 'taze', 'iyi']
```

### Pozitif/Negatif Tespiti

**Pozitif Kelimeler:**
- iyi, güzel, harika, mükemmel, beğendim, tavsiye

**Negatif Kelimeler:**
- kötü, berbat, yavaş, pahalı, kirli, ilgisiz

**Skor:**
```
Pozitif Oran = Pozitif Yorum Sayısı / Toplam Yorum
Kategori Skoru = Pozitif Oran × 100
```

## 🎯 Skor Aralıkları

| Skor | Etiket | Açıklama |
|------|--------|----------|
| 80-100 | Çok Uygun | Büyük ihtimalle pişman olmazsın |
| 60-79 | Uygun | Genelde uygun, bazı riskler var |
| 40-59 | Az Uygun | Karışık yorumlar, dikkatli ol |
| 0-39 | Uygun Değil | Çoğunlukla olumsuz yorumlar |

## 🔧 Teknik Detaylar

### Database Entegrasyonu

**Yorum Çekme:**
```typescript
const reviewsByPlace = await getPlacesWithReviews(placeIds)
const placeReviews = reviewsByPlace.get(place.id) || []
```

**Kullanım:**
```typescript
// API'de
const placesWithAnalyses = await getPlacesWithAnalyses(...)
// Artık her place'de reviews var
```

### Basit Analiz Kullanımı

```typescript
import { analyzeReviewsSimple } from '@/lib/analysis/simple-scoring'

const result = analyzeReviewsSimple(
  reviews.map(r => ({ text: r.text, rating: r.rating })),
  category,
  companion
)

// result.score, result.why, result.risks, result.reviewCategories
```

## 📈 Performans

### AI Analiz
- Süre: ~2-5 saniye/mekan
- Maliyet: API call
- Cache: 24 saat

### Basit Analiz
- Süre: ~10-50ms/mekan
- Maliyet: Yok
- Cache: Gerekmez

## 🚀 Sonuç

Artık sistem:
- ✅ Database'den yorumları çekiyor
- ✅ AI olmadan da skorlama yapabiliyor
- ✅ Daha şeffaf skorlama mantığı
- ✅ Her durumda çalışıyor

**Detaylar için:** `lib/analysis/scoring-logic.md`


