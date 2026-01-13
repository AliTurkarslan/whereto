# Skorlama Mantığı - Detaylı Açıklama

## 🎯 Genel Mantık

Uygunluk skoru (0-100) şu faktörlere göre hesaplanır:

1. **Yorum Analizi** (en önemli)
2. **Rating** (yorum yoksa)
3. **Kategori Uyumu**
4. **Companion Uyumu**
5. **Mesafe** (daha az etkili)

## 📊 Skorlama Adımları

### 1. Yorum Analizi (Basit)

**Kategori Tespiti:**
- Her yorum, 7 kategoriye göre analiz edilir
- Keyword matching ile kategoriler belirlenir
- Her kategori için pozitif/negatif oran hesaplanır

**Skor Hesaplama:**
```
Kategori Skoru = (Pozitif Yorum Sayısı / Toplam Yorum) × 100
```

**Örnek:**
- 10 yorum, 7'si pozitif → Skor: 70
- 20 yorum, 15'i pozitif → Skor: 75

### 2. Genel Skor

**Yöntem 1: Rating Varsa**
```
Genel Skor = (Ortalama Rating / 5) × 100
```

**Yöntem 2: Kategori Skorları**
```
Genel Skor = Tüm Kategori Skorlarının Ortalaması
```

**Yöntem 3: Pozitif/Negatif Kelime Analizi**
```
Pozitif Oran = Pozitif Yorum Sayısı / Toplam Yorum
Genel Skor = Pozitif Oran × 100
```

### 3. Kategori Bazlı Ayarlama

**Yemek (food):**
- Kalite skoru önemli
- Genel skor = (Genel Skor + Kalite Skoru) / 2

**Aile (family):**
- Temizlik skoru önemli
- Genel skor = (Genel Skor × 0.7) + (Temizlik Skoru × 0.3)

### 4. Companion Bazlı Ayarlama

| Companion | Ayarlama | Açıklama |
|-----------|----------|----------|
| alone | 0 | Değişiklik yok |
| partner | +5 | Daha yüksek beklenti |
| friends | 0 | Değişiklik yok |
| family | +10 | Çok daha yüksek beklenti (temizlik, güvenlik) |
| colleagues | -5 | Daha düşük beklenti |

### 5. Final Skor

```
Final Skor = Genel Skor + Kategori Ayarlaması + Companion Ayarlaması
Final Skor = min(100, max(0, Final Skor)) // 0-100 arası sınırla
```

## 🔍 Örnek Hesaplama

### Senaryo 1: Restoran, Aile ile

**Yorumlar:**
- 20 yorum
- 15 pozitif, 5 negatif
- Ortalama rating: 4.2

**Kategori Skorları:**
- Servis: 80
- Fiyat: 60
- Kalite: 90
- Ortam: 70
- Lokasyon: 85
- Temizlik: 95
- Hız: 75

**Hesaplama:**
1. Genel Skor (rating): (4.2 / 5) × 100 = 84
2. Kategori Ortalaması: (80+60+90+70+85+95+75) / 7 = 79
3. Genel Skor (kombine): (84 + 79) / 2 = 81.5
4. Aile için temizlik önemli: (81.5 × 0.7) + (95 × 0.3) = 57 + 28.5 = 85.5
5. Companion ayarı: 85.5 + 10 = 95.5
6. **Final Skor: 96**

### Senaryo 2: Kafe, Yalnız

**Yorumlar:**
- 10 yorum
- 6 pozitif, 4 negatif
- Rating yok

**Kategori Skorları:**
- Servis: 70
- Fiyat: 80
- Kalite: 75
- Ortam: 90

**Hesaplama:**
1. Genel Skor (kategori): (70+80+75+90) / 4 = 78.75
2. Companion ayarı: 78.75 + 0 = 78.75
3. **Final Skor: 79**

## 📈 Skor Aralıkları

| Skor | Anlam | Açıklama |
|------|-------|----------|
| 80-100 | Çok Uygun | Büyük ihtimalle pişman olmazsın |
| 60-79 | Uygun | Genelde uygun, bazı riskler var |
| 40-59 | Az Uygun | Karışık yorumlar, dikkatli ol |
| 0-39 | Uygun Değil | Çoğunlukla olumsuz yorumlar |

## ⚠️ Özel Durumlar

### Yorum Yok
- Rating varsa: Rating × 20
- Rating yoksa: 50 (varsayılan)

### Yorum Az (1-5 yorum)
- Skor daha konservatif hesaplanır
- Güven aralığı düşük

### Karışık Yorumlar
- Pozitif ve negatif dengeli
- Skor ortada (50-60)
- Riskler belirtilir

## 🔄 AI vs Basit Skorlama

### AI Skorlama (Gemini)
- ✅ Daha akıllı analiz
- ✅ Bağlam anlama
- ✅ Daha detaylı açıklamalar
- ❌ API maliyeti
- ❌ Yavaş (cache yoksa)

### Basit Skorlama
- ✅ Hızlı
- ✅ Ücretsiz
- ✅ Her zaman çalışır
- ❌ Daha basit analiz
- ❌ Keyword bazlı

## 🎯 Kullanım Stratejisi

1. **Önce AI dene** (cache varsa veya API key varsa)
2. **AI başarısız olursa basit skorlama kullan**
3. **Yorum yoksa rating'e göre skorla**
4. **Hiçbiri yoksa varsayılan 50**


