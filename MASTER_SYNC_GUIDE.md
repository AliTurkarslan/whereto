# 🚀 Master Sync Kullanım Kılavuzu

## 📋 Genel Bakış

Master Sync, tüm kategorileri otomatik olarak sync eden profesyonel bir sistemdir.

### Özellikler

- ✅ **Otomatik**: Tüm kategorileri tek komutla sync eder
- ✅ **Place Details API**: Güvenilir yorum çekme
- ✅ **Database**: Tüm veriler database'de saklanır
- ✅ **AI Analiz**: Otomatik analiz yapılır
- ✅ **Progress Tracking**: İlerleme takibi
- ✅ **Error Recovery**: Hata durumunda devam eder
- ✅ **Cost Tracking**: Maliyet takibi
- ✅ **Rate Limiting**: Free tier koruması

## 🎯 Kullanım

### Tüm Kategorileri Sync Et

```bash
npm run sync:master
```

Bu komut şunları yapar:
1. Tüm kategorileri sırayla işler
2. Her kategori için mekanları bulur
3. Place Details API ile yorumları çeker
4. Database'e kaydeder
5. AI analiz yapar
6. Sonuçları gösterir

### Belirli Kategorileri Sync Et

```bash
npm run sync:master -- --categories food,coffee
```

Sadece belirtilen kategorileri sync eder.

## 📊 Kategoriler

| Kategori | Sorgu | API Type | Display Name |
|----------|-------|----------|--------------|
| food | restaurant | restaurant | Yemek Yerleri |
| coffee | cafe | cafe | Kafeler |
| bar | bar | bar | Barlar |
| haircut | hair salon | hair_salon | Kuaförler |
| spa | spa | spa | Spa & Masaj |
| shopping | shopping | clothing_store | Alışveriş |
| entertainment | entertainment | amusement_center | Eğlence |

## 💰 Maliyet Hesaplaması

### Senaryo: Tüm Kategoriler (Kadıköy)

- **Text/Nearby Search**: ~35 request (7 kategori × 5 request)
- **Place Details API**: ~1,400 request (7 kategori × 200 mekan)
- **Toplam**: ~1,435 request
- **Maliyet**: $24.40 (Free tier içinde ✅)

### Aylık Güncelleme

- **Place Details API**: ~1,400 request
- **Maliyet**: $23.80 / ay
- **Yıllık**: ~$285 (Free tier içinde ✅)

## ⚙️ Konfigürasyon

`scripts/sync-master.ts` dosyasındaki `CONFIG` objesini düzenleyerek:

- Lokasyon değiştirilebilir
- Kategoriler eklenebilir/çıkarılabilir
- Limitler ayarlanabilir
- Rate limiting değiştirilebilir

## 📈 Progress Tracking

Script çalışırken:
- Her mekan için progress gösterir
- Kategori bazlı özet verir
- Final özet gösterir
- Maliyet takibi yapar

## 🔄 Sistem Akışı

```
Master Sync Başlar
    ↓
Her Kategori İçin:
    ├─ Text/Nearby Search → Place ID'leri
    ├─ Place Details API → Detaylar + Yorumlar
    ├─ Database'e Kaydet
    ├─ AI Analiz → Sonuçları Kaydet
    └─ Progress Göster
    ↓
Final Özet
```

## 🎯 Örnek Çıktı

```
🚀 Master Sync Başlıyor...

📍 Lokasyon: Kadıköy (40.9833, 29.0167)

============================================================
🍽️  Yemek Yerleri Sync Başlıyor...
============================================================

🔍 Yemek Yerleri aranıyor...
✅ 150 mekan bulundu

[1/150] 📍 Örnek Restoran... ✅ (25 yorum, 5 analiz)
[2/150] 📍 Popüler Kafe... ✅ (30 yorum, 5 analiz)
...

📊 Yemek Yerleri Özeti:
   ✅ Başarılı: 145
   ❌ Başarısız: 5
   📝 Yorum: 3,250
   🤖 Analiz: 725
   🔢 API Çağrısı: 150
   💰 Maliyet: $2.55
   ⏱️  Süre: 45.2s

============================================================
📊 GENEL ÖZET
============================================================
✅ Tamamlanan: 7/7
📍 Toplam Mekan Bulundu: 1,050
🔄 İşlenen: 1,400
📝 Toplam Yorum: 25,000
🤖 Toplam Analiz: 7,000
🔢 Toplam API Çağrısı: 1,435
💰 Toplam Maliyet: $24.40
⏱️  Toplam Süre: 12.5 dakika

💡 Free Tier: $200/ay (Kalan: $175.60)
============================================================
```

## ⚠️ Önemli Notlar

1. **Rate Limiting**: 10 request/saniye (Google limit)
2. **Free Tier**: $200/ay (yeterli)
3. **Süre**: Tüm kategoriler için ~10-15 dakika
4. **Resume**: Yarım kalan sync'i devam ettirmek için script'i tekrar çalıştırın (duplicate kontrolü var)

## 🔧 Gelişmiş Kullanım

### Sadece Yemek Yerleri

```bash
npm run sync:master -- --categories food
```

### Yemek ve Kafe

```bash
npm run sync:master -- --categories food,coffee
```

### Tüm Kategoriler (Varsayılan)

```bash
npm run sync:master
```

## 🎯 Sonuç

Artık tek bir komutla tüm sistemi sync edebilirsiniz!

```bash
npm run sync:master
```

Bu komut:
- ✅ Tüm kategorileri işler
- ✅ Yorumları çeker
- ✅ Database'e kaydeder
- ✅ AI analiz yapar
- ✅ Progress gösterir
- ✅ Maliyet takibi yapar


