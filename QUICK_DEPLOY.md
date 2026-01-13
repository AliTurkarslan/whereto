# 🚀 Uygulamayı İnternete Yükleme Rehberi (Çok Basit!)

## 📖 Bu Rehber Ne İçin?

Uygulamanı internet üzerinden herkesin kullanabileceği bir link haline getirmek için.

---

## 🎯 Adım 1: GitHub'a Yükle (Kodlarını İnternete Koy)

### GitHub Nedir?
GitHub, kodlarını internet üzerinde saklayabileceğin bir yerdir. Ücretsizdir.

### Nasıl Yapılır?

#### 1.1. GitHub Hesabı Oluştur
1. https://github.com adresine git
2. "Sign up" butonuna tıkla
3. Email ve şifre ile hesap oluştur

#### 1.2. Yeni Repo (Depo) Oluştur
1. GitHub'a giriş yap
2. Sağ üstteki "+" işaretine tıkla
3. "New repository" seç
4. Repository name: `whereto` yaz
5. "Public" seç (ücretsiz)
6. "Create repository" tıkla

#### 1.3. Kodlarını GitHub'a Yükle

**Terminal'de (Mac'te Terminal, Windows'ta Command Prompt) şu komutları sırayla çalıştır:**

```bash
# 1. Proje klasörüne git
cd /Users/mac_ali/WhereTo

# 2. Git'i başlat
git init

# 3. Tüm dosyaları ekle
git add .

# 4. İlk kayıt yap
git commit -m "İlk versiyon"

# 5. Ana dalı ayarla
git branch -M main

# 6. GitHub repo'yu bağla (KULLANICI_ADI yerine GitHub kullanıcı adını yaz!)
git remote add origin https://github.com/KULLANICI_ADI/whereto.git

# 7. Kodları yükle
git push -u origin main
```

**Not:** 6. adımda GitHub kullanıcı adını yazman gerekiyor. Örneğin: `git remote add origin https://github.com/ali/whereto.git`

**Sorun mu var?** GitHub'a giriş yapman istenebilir. O zaman GitHub kullanıcı adı ve şifreni gir.

---

## 🎯 Adım 2: Vercel'e Deploy Et (İnternete Yayınla)

### Vercel Nedir?
Vercel, uygulamanı internet üzerinden erişilebilir hale getiren bir servistir. Ücretsizdir ve Next.js için mükemmeldir.

### Nasıl Yapılır?

#### 2.1. Vercel Hesabı Oluştur
1. https://vercel.com adresine git
2. "Sign Up" butonuna tıkla
3. "Continue with GitHub" seç (GitHub hesabınla giriş yap)

#### 2.2. Projeyi Vercel'e Bağla
1. Vercel dashboard'da "Add New..." butonuna tıkla
2. "Project" seç
3. GitHub'dan "whereto" projesini seç
4. "Import" butonuna tıkla

#### 2.3. Ayarları Yap

**Environment Variables (Gizli Bilgiler) Ekle:**

1. "Environment Variables" bölümüne git
2. Şu 3 bilgiyi ekle (her birini ayrı ayrı):

   **1. Değişken:**
   - Name: `GOOGLE_PLACES_API_KEY`
   - Value: `AIzaSyATb5V4QnMjOqvlOzuIhKg6pw6j4IcN8-k`
   - "Add" tıkla

   **2. Değişken:**
   - Name: `GOOGLE_AI_API_KEY`
   - Value: `Google AI API key'in` (eğer varsa, yoksa boş bırakabilirsin)
   - "Add" tıkla

   **3. Değişken:**
   - Name: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - Value: `AIzaSyATb5V4QnMjOqvlOzuIhKg6pw6j4IcN8-k`
   - "Add" tıkla

#### 2.4. Deploy Et!
1. "Deploy" butonuna tıkla
2. 2-3 dakika bekle (Vercel uygulamayı hazırlıyor)
3. "Congratulations!" mesajını görünce hazır!

---

## 🎉 Adım 3: Link'i Al ve Paylaş!

### Link Nerede?
Deploy tamamlandıktan sonra Vercel sana bir link verecek:
```
https://whereto-xxxxx.vercel.app
```

Bu linki kopyala ve test kullanıcılarına gönder!

### Link Nasıl Bulunur?
1. Vercel dashboard'a git
2. "whereto" projesine tıkla
3. Üstte "Visit" butonuna tıkla veya linki kopyala

---

## 📱 Test Kullanıcılarına Gönderebileceğin Mesaj

```
Merhaba! 👋

WhereTo uygulamasını test etmek ister misiniz?

🔗 Link: https://whereto-xxxxx.vercel.app

Nasıl Kullanılır:
1. Konumunuzu girin (veya otomatik algılansın)
2. Ne aradığınızı seçin (Yemek, Kahve, vs.)
3. Kiminle gittiğinizi seçin
4. Size uygun mekanları görün!

💬 Geri Bildirim:
Sağ alt köşedeki butona tıklayarak geri bildirim verebilirsiniz.

Teşekkürler! 🙏
```

---

## ❓ Sık Sorulan Sorular

### Q: GitHub'a yüklerken hata alıyorum
**A:** GitHub kullanıcı adı ve şifreni doğru girdiğinden emin ol. Eğer iki faktörlü doğrulama açıksa, bir token oluşturman gerekebilir.

### Q: Vercel'de build hatası alıyorum
**A:** 
1. Environment Variables'ı doğru eklediğinden emin ol
2. Vercel dashboard'da "Deployments" > "View Build Logs" tıkla
3. Hata mesajını oku ve düzelt

### Q: Link çalışmıyor
**A:**
1. Deploy'un tamamlandığından emin ol (yeşil tik işareti)
2. Birkaç dakika bekle (bazen biraz zaman alabilir)
3. Tarayıcı cache'ini temizle (Ctrl+Shift+R veya Cmd+Shift+R)

### Q: Kod değişikliği yaptım, nasıl güncellerim?
**A:**
```bash
cd /Users/mac_ali/WhereTo
git add .
git commit -m "Güncelleme"
git push
```
Vercel otomatik olarak yeni versiyonu yükler!

---

## 🎯 Özet (3 Adım)

1. ✅ **GitHub'a yükle** → Kodlarını internet üzerinde sakla
2. ✅ **Vercel'e bağla** → Uygulamayı internet üzerinden erişilebilir yap
3. ✅ **Link'i paylaş** → Test kullanıcılarına gönder

**Toplam Süre:** ~10 dakika

---

## 🆘 Yardım Lazımsa

1. GitHub dokümantasyonu: https://docs.github.com
2. Vercel dokümantasyonu: https://vercel.com/docs
3. Hata mesajlarını Google'da ara

**Başarılar! 🚀**
