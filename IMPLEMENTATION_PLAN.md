# 🎯 Place Details API Entegrasyon Planı

## ✅ Tamamlanan Adımlar

### 1. PlaceData Interface Güncellemesi
- ✅ `placeId` field'ı eklendi
- ✅ Tüm API fonksiyonları `placeId` döndürüyor

### 2. Place Details API Entegrasyonu
- ✅ `getPlaceDetails()` fonksiyonu mevcut ve çalışıyor
- ✅ Yorumları API'den çekiyor
- ✅ Place ID'yi döndürüyor

### 3. Kadıköy Yemek Yerleri Sync Script
- ✅ `sync-kadikoy-food.ts` oluşturuldu
- ✅ Place Details API kullanıyor
- ✅ Database'e kaydediyor
- ✅ AI analiz yapıyor

## 📋 Yapılacaklar

### Adım 1: Test ve Doğrulama
```bash
# Script'i test et
npm run sync:kadikoy:food
```

### Adım 2: Database Kontrolü
- Place ID'lerin kaydedildiğini kontrol et
- Yorumların kaydedildiğini kontrol et
- AI analizlerin yapıldığını kontrol et

### Adım 3: Güncelleme Script'i (Opsiyonel)
- Place ID'leri kullanarak güncelleme yap
- Sadece yeni yorumları ekle
- Analizleri güncelle

## 💰 Maliyet Hesaplaması

### Senaryo: Kadıköy Yemek Yerleri
- **Text/Nearby Search**: ~5 request (100 mekan)
- **Place Details API**: ~200 request (200 mekan)
- **Toplam**: ~205 request
- **Maliyet**: $3.49 (Free tier içinde ✅)

### Aylık Güncelleme
- **Place Details API**: ~200 request (güncelleme)
- **Maliyet**: $3.40 / ay
- **Yıllık**: ~$40 (Free tier içinde ✅)

## 🎯 Sistem Akışı

### İlk Sync
```
1. Text/Nearby Search → Place ID'leri al
2. Place Details API → Detaylar + Yorumlar
3. Database'e kaydet
4. AI Analiz → Sonuçları kaydet
```

### Kullanıcı Araması
```
1. Database'den mekanları çek (API çağrısı YOK)
2. Yorumlar database'den
3. Analiz sonuçları database'den
4. Sonuçları göster
```

### Güncelleme (İstenildiğinde)
```
1. Database'den Place ID'leri al
2. Place Details API → Güncel veriler
3. Yeni yorumları ekle
4. Analizleri güncelle
```

## 📝 Kullanım

### İlk Sync
```bash
npm run sync:kadikoy:food
```

### Database Kontrolü
```bash
npm run db:check
```

### Drizzle Studio (GUI)
```bash
npm run db:studio
```

## ⚠️ Önemli Notlar

1. **Rate Limiting**: 10 request/saniye (Google limit)
2. **Free Tier**: $200/ay (yeterli)
3. **Place ID**: Her mekan için unique, değişmez
4. **Yorumlar**: Place Details API'den gelir (ücretsiz, Basic Data içinde)
5. **Güncelleme**: İstenildiğinde yapılabilir (ayda bir, haftada bir, vs.)

## 🚀 Sonraki Adımlar

1. ✅ Script'i test et
2. ✅ Database'i kontrol et
3. ⏳ Diğer kategoriler için genişlet (cafe, bar, vs.)
4. ⏳ Güncelleme script'i oluştur
5. ⏳ Cron job kurulumu (opsiyonel)


