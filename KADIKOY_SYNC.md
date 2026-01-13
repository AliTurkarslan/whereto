# Kadıköy Database Sync Rehberi

## 🎯 Amaç

Kadıköy'deki tüm mekanları database'e yüklemek ve AI analizlerini yapmak.

## 📍 Kadıköy Koordinatları

- **Latitude:** 40.9833
- **Longitude:** 29.0167

## 🚀 Hızlı Başlangıç

### 1. Database'i Hazırla

```bash
npm run db:push
```

### 2. Tüm Kategorileri Sync Et

```bash
npm run sync:kadikoy
```

Bu komut şunları yapacak:
- ✅ Restoranları sync eder
- ✅ Kafeleri sync eder
- ✅ Barları sync eder
- ✅ Kuaförleri sync eder
- ✅ Spa & Masaj yerlerini sync eder
- ✅ Alışveriş yerlerini sync eder
- ✅ Eğlence mekanlarını sync eder

**Süre:** Her kategori için ~5-10 dakika (AI analiz zaman alır)
**Toplam:** ~1-2 saat (tüm kategoriler için)

## 📊 Kategoriler

| Kategori | Google Maps Query | Database Category |
|----------|-------------------|-------------------|
| Restoran | `restaurant` | `food` |
| Kafe | `cafe` | `coffee` |
| Bar | `bar` | `bar` |
| Kuaför | `hair salon` | `haircut` |
| Spa & Masaj | `spa` | `spa` |
| Alışveriş | `shopping` | `shopping` |
| Eğlence | `entertainment` | `entertainment` |

## ⚙️ Nasıl Çalışıyor?

1. **Scraping:** Google Maps'ten mekanları çeker (max 50 mekan/kategori)
2. **Database'e Kaydet:** Her mekanı `places` tablosuna ekler
3. **Yorumları Kaydet:** Her mekanın yorumlarını `reviews` tablosuna ekler
4. **AI Analiz:** Her mekan için 5 companion × kategori = analiz yapar
5. **Analizleri Kaydet:** Sonuçları `analyses` tablosuna kaydeder

## 🔄 Tekrar Sync

Eğer yeni mekanlar eklemek veya mevcut mekanları güncellemek isterseniz:

```bash
npm run sync:kadikoy
```

Script mevcut mekanları günceller, yeni mekanları ekler.

## 📝 Tek Kategori Sync

Sadece bir kategoriyi sync etmek için:

```bash
npm run sync:places -- --query "restaurant" --lat 40.9833 --lng 29.0167 --category "food"
```

## ⚠️ Önemli Notlar

1. **AI API Limitleri:** Her mekan için 5 companion analizi yapılır, bu çok API çağrısı demek
2. **Süre:** İlk sync uzun sürebilir (1-2 saat)
3. **Rate Limiting:** Script'te 2 saniye bekleme var, gerekirse artırılabilir
4. **Hata Durumu:** Bir kategori başarısız olsa bile diğerleri devam eder

## 🎯 Sonuç

Sync tamamlandıktan sonra:
- ✅ Database'de Kadıköy'deki tüm mekanlar olacak
- ✅ Her mekan için yorumlar olacak
- ✅ Her mekan için tüm companion kombinasyonlarında AI analizleri olacak
- ✅ API anında yanıt verecek (scraping/AI yok)

## 🔍 Database'i Kontrol Et

```bash
npm run db:studio
```

Tarayıcıda database'i görüntüle ve kontrol et.


