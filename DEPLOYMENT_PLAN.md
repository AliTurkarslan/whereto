# 🚀 WhereTo - Ankara ve İstanbul Deployment Planı

## 📋 Özet

WhereTo sistemini Ankara ve İstanbul'da kullanıma sunmak için hazırlık planı.

---

## ✅ Sistem Durumu

### Test Sonuçları
- ✅ **Database:** Çalışıyor (373 mekan, 1990 analiz)
- ✅ **API Entegrasyonları:** Çalışıyor
- ✅ **Veri Bütünlüğü:** %100
- ✅ **Sync Mekanizması:** Hazır
- ⚠️ **Environment Variables:** 1 opsiyonel eksik (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)

**Sistem %90 başarılı ve kullanıma hazır!** ✅

---

## 🎯 Sync Stratejisi

### 1. Aşamalı Sync

#### İstanbul (6 Bölge)
1. Kadıköy ✅ (Zaten sync edilmiş)
2. Beşiktaş
3. Şişli
4. Beyoğlu
5. Üsküdar
6. Bakırköy

#### Ankara (5 Bölge)
1. Çankaya
2. Keçiören
3. Yenimahalle
4. Mamak
5. Sincan

### 2. Kategoriler (Her Bölge İçin)
- Yemek Yerleri (restaurant)
- Kafeler (cafe)
- Barlar (bar)
- Kuaförler (hair_salon)
- Spa & Masaj (spa)
- Alışveriş (clothing_store)
- Eğlence (amusement_center)

### 3. Zaman Tahmini

**Her Bölge:**
- 7 kategori × ~5-10 dakika = **35-70 dakika**

**İstanbul:**
- 5 yeni bölge × 70 dakika = **~6 saat**

**Ankara:**
- 5 bölge × 70 dakika = **~6 saat**

**Toplam:**
- **~12 saat** (tüm sync)

---

## 💰 API Kullanımı ve Maliyet

### Place Details API
- **Rate Limit:** 10 request/saniye
- **Maliyet:** $0.017/request
- **Free Tier:** $200/ay

### Tahmini Kullanım

**Her Bölge:**
- 7 kategori × 100 mekan = 700 mekan
- 700 × Place Details API = **700 request**
- **Maliyet:** ~$12/bölge

**İstanbul (5 yeni bölge):**
- 5 × 700 = **3,500 request**
- **Maliyet:** ~$60

**Ankara (5 bölge):**
- 5 × 700 = **3,500 request**
- **Maliyet:** ~$60

**Toplam:**
- **7,000 request**
- **Maliyet:** ~$120
- **Free Tier İçinde:** ✅

---

## 🛠️ Sync Komutları

### Tüm Şehirler
```bash
npm run sync:ankara-istanbul
```

### Sadece İstanbul
```bash
npm run sync:ankara-istanbul -- --city=istanbul
```

### Sadece Ankara
```bash
npm run sync:ankara-istanbul -- --city=ankara
```

### Belirli Bir Bölge (Manuel)
`sync-master.ts` dosyasındaki `CONFIG.location` değiştirilerek:
```bash
npm run sync:master
```

---

## ⚠️ Önemli Notlar

### 1. Rate Limiting
- Place Details API: 10 request/saniye
- Script'te 200ms delay var (5 request/saniye)
- Güvenli sync için yeterli

### 2. Free Tier Koruması
- Aylık limit: $200
- Tahmini kullanım: ~$120
- **Güvenli marj var** ✅

### 3. Database Boyutu
- Her mekan: ~1-2 KB
- Her yorum: ~0.5 KB
- Her analiz: ~1 KB
- **Tahmini toplam:** ~500 MB (7,000 mekan)

### 4. Sync Süresi
- **Toplam:** ~12 saat
- **Öneri:** Gece çalıştırılabilir
- **Veya:** Aşamalı sync (her gün bir bölge)

---

## 📊 İlerleme Takibi

### Sync Sırasında
- Console'da ilerleme gösterilir
- Her bölge/kategori için özet
- Hata durumunda devam eder

### Sync Sonrası
```bash
npm run db:check
```

### Test
```bash
npm run test:system
```

---

## 🎯 Sonraki Adımlar

1. **Environment Variables Kontrolü**
   - `GOOGLE_PLACES_API_KEY` ✅
   - `GOOGLE_AI_API_KEY` ✅
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (opsiyonel)

2. **Sync Başlatma**
   - Gece çalıştırılabilir
   - Veya aşamalı sync

3. **Test**
   - Her bölge sync sonrası test
   - Database kontrolü
   - API testleri

4. **Production**
   - Build kontrolü
   - Deploy
   - Monitoring

---

## ✅ Hazırlık Kontrol Listesi

- [x] Sistem testleri başarılı
- [x] Database çalışıyor
- [x] API entegrasyonları hazır
- [x] Sync script'i hazır
- [ ] Environment variables kontrol edildi
- [ ] İlk sync test edildi
- [ ] Database backup alındı
- [ ] Production build test edildi

---

## 🚀 Başlatma

Sistem hazır! Sync'i başlatmak için:

```bash
# Tüm şehirler
npm run sync:ankara-istanbul

# Veya aşamalı
npm run sync:ankara-istanbul -- --city=istanbul
npm run sync:ankara-istanbul -- --city=ankara
```

**Not:** Sync işlemi uzun sürebilir (~12 saat). Gece çalıştırılması önerilir.


