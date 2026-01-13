# 🔧 Supabase Bağlantı Sorunu Çözümü

## ❌ Hata Mesajı

```
Error: getaddrinfo ENOTFOUND db.tdquwneanxuavsgxcwgo.supabase.co
```

## 🔍 Sorun Analizi

DNS çözümleme hatası - Supabase hostname'ine erişilemiyor.

## ✅ Çözüm Adımları

### 1. Supabase Projesi Durumunu Kontrol Et

**En olası neden:** Supabase projesi durdurulmuş olabilir.

1. **Supabase Dashboard'a Git**
   - https://supabase.com/dashboard
   - Projeni seç

2. **Proje Durumunu Kontrol Et**
   - Proje durdurulmuşsa "Resume" veya "Restore" butonuna tıkla
   - Ücretsiz tier'de 1 hafta inaktiflik sonrası otomatik durdurulur

3. **Proje Aktif mi?**
   - Aktifse → Connection string'i kontrol et
   - Durdurulmuşsa → Projeyi başlat (birkaç dakika sürebilir)

### 2. Connection String'i Doğrula

1. **Supabase Dashboard > Settings > Database**
2. **Connection string'i kopyala**
   - "Connection string" veya "Connection pooling" sekmesine git
   - **URI** formatını seç
   - Password'ü göster ve kopyala

3. **Doğru Format:**
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

4. **`.env.local` Dosyasını Güncelle:**
   ```bash
   DATABASE_URL=postgresql://postgres:[YENI-PASSWORD]@db.tdquwneanxuavsgxcwgo.supabase.co:5432/postgres
   ```

### 3. İnternet Bağlantısını Kontrol Et

1. **İnternet bağlantınızı kontrol edin**
2. **Firewall veya VPN sorunu olabilir**
3. **Farklı bir network'ten deneyin**

### 4. Yeni Proje Oluştur (Gerekirse)

Eğer proje geri getirilemiyorsa:

1. **Yeni Supabase Projesi Oluştur**
   - https://supabase.com/dashboard
   - "New Project" butonuna tıkla
   - Proje adı ve şifre belirle

2. **Yeni Connection String'i Al**
   - Settings > Database > Connection string

3. **`.env.local` Dosyasını Güncelle:**
   ```bash
   DATABASE_URL=postgresql://postgres:[YENI-PASSWORD]@db.[YENI-PROJECT-REF].supabase.co:5432/postgres
   ```

## 🧪 Test Komutları

### Connection String Testi:
```bash
# Connection string'i test et
node -e "require('dotenv').config({path: '.env.local'}); console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Tanımlı' : '❌ Tanımlı değil');"
```

### DNS Testi:
```bash
# Hostname'i test et
nslookup db.tdquwneanxuavsgxcwgo.supabase.co
```

### PostgreSQL Bağlantı Testi:
```bash
# PostgreSQL bağlantısını test et (postgres paketi yüklüyse)
psql $DATABASE_URL -c "SELECT version();"
```

## 📋 Kontrol Listesi

- [ ] Supabase Dashboard'da proje aktif mi?
- [ ] Connection string doğru mu?
- [ ] Password doğru mu?
- [ ] `.env.local` dosyası güncel mi?
- [ ] İnternet bağlantısı çalışıyor mu?
- [ ] Firewall/VPN sorunu var mı?

## 🚀 Sonraki Adım

Proje aktif olduktan sonra:

```bash
npm run db:push
```

## 💡 İpucu

Supabase ücretsiz tier'de projeler 1 hafta inaktiflik sonrası otomatik durdurulur. Projeyi başlatmak birkaç dakika sürebilir.



