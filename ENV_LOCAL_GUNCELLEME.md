# 📝 .env.local Dosyası Güncelleme

## 🔧 Manuel Güncelleme Adımları

### 1. .env.local Dosyasını Aç

`.env.local` dosyasını bir text editor ile açın.

### 2. DATABASE_URL Satırını Bul ve Güncelle

**Eski (Direct Connection - IPv4 sorunlu):**
```bash
DATABASE_URL=postgresql://postgres:At280994at..@db.tdquwneanxuavsgxcwgo.supabase.co:5432/postgres
```

**Yeni (Session Pooler - IPv4 uyumlu):**
```bash
DATABASE_URL=postgresql://postgres.tdquwneanxuavsgxcwgo:At280994at..@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
```

### 3. Önemli Değişiklikler

- **User:** `postgres` → `postgres.tdquwneanxuavsgxcwgo`
- **Hostname:** `db.tdquwneanxuavsgxcwgo.supabase.co` → `aws-1-ap-northeast-1.pooler.supabase.com`
- **Port:** `5432` (aynı kaldı)
- **Password:** `At280994at..` (aynı kaldı)

### 4. Dosyayı Kaydet

`.env.local` dosyasını kaydedin.

### 5. Test Et

```bash
npm run db:push
```

## ✅ Kontrol

Connection string doğru mu kontrol etmek için:

```bash
node -e "require('dotenv').config({path: '.env.local'}); console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Tanımlı' : '❌ Tanımlı değil');"
```

## 🚀 Sonraki Adım

`.env.local` dosyasını güncelledikten sonra:

```bash
npm run db:push
```

Bu komut Supabase'de tabloları oluşturacak.



