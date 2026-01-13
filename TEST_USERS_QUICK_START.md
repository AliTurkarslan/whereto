# 🚀 Test Kullanıcıları - Hızlı Başlangıç

## ✅ Sistem Hazır!

Geri bildirim sistemi **tamamen hazır** ve çalışıyor.

---

## 📋 Test Kullanıcılarına Gönderilecek Talimatlar

### 1. Uygulamayı Açın
Link: `https://your-domain.com/tr` (veya production URL'iniz)

### 2. Kullanım
1. Konum seçin (otomatik veya manuel)
2. Kategori seçin (yemek, kahve, vb.)
3. Yanındakini seçin (yalnız, sevgili, vb.)
4. Sonuçları inceleyin

### 3. Geri Bildirim Verin
- Sağ alt köşedeki **"Geri Bildirim"** butonuna tıklayın
- Formu doldurun ve gönderin

---

## 📊 Geri Bildirimleri Görüntüleme

### Terminal'den
```bash
npm run feedback:view
```

### API'den (Admin)
```bash
# Önce .env.local'e FEEDBACK_SECRET ekleyin
curl "http://localhost:3000/api/feedback?secret=your-secret-key"
```

---

## 🎯 Başarı Kriterleri

- ✅ Ortalama rating ≥ 4.0
- ✅ %70+ kullanıcı 4-5 yıldız veriyor
- ✅ Her kategoride en az 10 geri bildirim

---

## ✅ Hazır!

Sistem test kullanıcılarına dağıtılmaya hazır. Sadece production URL'inizi paylaşın!
