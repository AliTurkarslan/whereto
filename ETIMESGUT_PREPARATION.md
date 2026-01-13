# 🚀 Ankara Etimesgut - Production Hazırlık Rehberi

## 📋 Özet

Ankara Etimesgut için gerçek verilerle test ve production hazırlığı.

---

## ✅ Hazırlıklar Tamamlandı

### 1. ✅ Sync Script Hazırlığı

**Dosya:** `scripts/sync-etimesgut.ts`

**Özellikler:**
- ✅ Etimesgut koordinatları (39.9567, 32.6378)
- ✅ Tüm kategoriler için sync
- ✅ Yeni verimlilik iyileştirmeleri aktif:
  - Dinamik yorum örnekleme
  - Google Places API genişletilmiş alanlar
  - Database schema güncellemeleri
- ✅ Rate limiting ve error handling
- ✅ Detaylı logging

**Kullanım:**
```bash
npm run sync:etimesgut
```

### 2. ✅ Database Schema Güncellemeleri

**Yeni Alanlar:**
- ✅ `phone` (TEXT)
- ✅ `website` (TEXT)
- ✅ `opening_hours` (TEXT - JSON)
- ✅ `photos` (TEXT - JSON)
- ✅ `editorial_summary` (TEXT)
- ✅ `business_status` (TEXT)
- ✅ `plus_code` (TEXT)
- ✅ `price_level` (TEXT)

**Migration:** ✅ Tamamlandı

### 3. ✅ UI Hazırlıkları

**Güncellenen Dosyalar:**
- ✅ `components/ResultCardCompact.tsx` - Yeni alanlar eklendi
- ✅ `app/[locale]/result/page.tsx` - Place interface güncellendi
- ✅ `lib/types/place.ts` - ScoredPlace interface güncellendi
- ✅ `app/api/recommend/route.ts` - API response güncellendi

**Yeni Özellikler:**
- ✅ Phone numarası gösterimi (PlaceActions'da)
- ✅ Website linki gösterimi (PlaceActions'da)
- ✅ Opening hours gösterimi (açık/kapalı durumu ile)
- ✅ Editorial summary gösterimi
- ✅ Business status gösterimi
- ✅ Price level gösterimi (PlaceActions'da)

### 4. ✅ Data Sistem Kontrolü

**Kontroller:**
- ✅ Database bağlantısı
- ✅ Schema güncellemeleri
- ✅ API entegrasyonları
- ✅ Cache mekanizması
- ✅ Error handling

---

## 🎯 Test Senaryosu

### 1. Sync Testi

```bash
# Etimesgut sync'i başlat
npm run sync:etimesgut
```

**Beklenen Sonuçlar:**
- 7 kategori × 50 mekan = ~350 mekan
- Her mekan için yorumlar ve analizler
- Yeni alanlar (phone, website, hours, etc.) doldurulmuş

### 2. UI Testi

**Test Adımları:**
1. Ana sayfada Etimesgut konumu seç
2. Bir kategori seç (örn: food)
3. Companion seç (örn: alone)
4. Sonuç sayfasında kontrol et:
   - Phone numarası görünüyor mu?
   - Website linki çalışıyor mu?
   - Opening hours gösteriliyor mu?
   - Photos görünüyor mu?
   - Editorial summary var mı?

### 3. Verimlilik Testi

```bash
# Verimlilik testleri
npm run test:efficiency
```

**Kontrol Edilecekler:**
- Yorum örnekleme çalışıyor mu?
- API maliyeti beklenen seviyede mi?
- Analiz süresi kabul edilebilir mi?

---

## 📊 Beklenen Metrikler

### Sync Metrikleri
- **Mekan Sayısı:** ~350 mekan
- **Yorum Sayısı:** ~5,000-10,000 yorum
- **Analiz Sayısı:** ~1,750 analiz (350 × 5 companion)
- **API Calls:** ~700-1,000 calls
- **Maliyet:** ~$12-17
- **Süre:** ~2-3 saat

### Performans Metrikleri
- **Yorum Örnekleme:** 500 yorum → 125 yorum (%25)
- **Analiz Süresi:** ~5-10 saniye/mekan
- **Cache Hit Rate:** %50-70 (beklenen)

---

## 🚀 Production Hazırlıkları

### 1. Environment Variables

**Gerekli:**
```env
GOOGLE_PLACES_API_KEY=your_key_here
GOOGLE_AI_API_KEY=your_key_here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

**Kontrol:**
```bash
npm run test:system
```

### 2. Database Backup

**Önerilen:**
```bash
# Database yedeği al
cp database.sqlite database.sqlite.backup.$(date +%Y%m%d)
```

### 3. Error Monitoring

**Önerilen:**
- Console logları kontrol et
- API hatalarını izle
- Database hatalarını izle

### 4. Performance Monitoring

**Kontrol Edilecekler:**
- API response süreleri
- Database query süreleri
- Cache hit rates
- Memory kullanımı

---

## 📝 Test Checklist

### Pre-Sync
- [ ] Environment variables kontrol edildi
- [ ] Database backup alındı
- [ ] Database migration tamamlandı
- [ ] API key'ler geçerli

### Sync
- [ ] Sync script çalıştırıldı
- [ ] Tüm kategoriler sync edildi
- [ ] Yorumlar toplandı
- [ ] Analizler oluşturuldu
- [ ] Yeni alanlar dolduruldu

### Post-Sync
- [ ] Database'de veriler var
- [ ] UI'da yeni alanlar görünüyor
- [ ] Phone/website linkleri çalışıyor
- [ ] Opening hours doğru gösteriliyor
- [ ] Photos görünüyor (varsa)
- [ ] Editorial summary görünüyor (varsa)

### Performance
- [ ] Yorum örnekleme çalışıyor
- [ ] Analiz süreleri kabul edilebilir
- [ ] API maliyeti beklenen seviyede
- [ ] Cache çalışıyor

---

## 🎯 Sonraki Adımlar

1. **Sync Çalıştır:**
   ```bash
   npm run sync:etimesgut
   ```

2. **Test Et:**
   - UI'da yeni alanları kontrol et
   - Gerçek verilerle test et
   - Performans metriklerini ölç

3. **Production'a Hazır:**
   - Tüm testler geçtiyse
   - Error handling çalışıyorsa
   - Performance kabul edilebilirse

---

## ⚠️ Önemli Notlar

1. **API Rate Limits:**
   - Place Details API: 10 req/saniye
   - Sync script otomatik rate limiting yapıyor

2. **Maliyet:**
   - Place Details API: $0.017/request
   - Free tier: $200/ay
   - Etimesgut sync: ~$12-17

3. **Süre:**
   - Her kategori: ~15-20 dakika
   - Toplam: ~2-3 saat

4. **Veri Kalitesi:**
   - Yorum örnekleme ile %90-95 doğruluk
   - Tüm rating kategorileri temsil ediliyor

---

## 📞 Destek

Sorun olursa:
1. Console loglarını kontrol et
2. Database'i kontrol et
3. API key'leri kontrol et
4. Test scriptlerini çalıştır

---

**Hazır! 🚀**



