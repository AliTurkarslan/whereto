# 🔑 Supabase Connection String Nasıl Alınır?

## ⚠️ ÖNEMLİ FARK

**Secret Key ≠ Database Password**

- **Secret Key** (`sb_secret_...`): Supabase API'lerini kullanmak için (REST API, Auth API)
- **Database Password**: PostgreSQL connection string'inde kullanılır

## 📋 Connection String'i Alma Adımları

### Yöntem 1: Supabase Dashboard (Önerilen)

1. **Supabase Dashboard'a Git**
   - https://supabase.com/dashboard
   - Projeni seç

2. **Settings > Database** bölümüne git

3. **Connection string'i kopyala**
   - "Connection string" veya "Connection pooling" sekmesine git
   - **URI** formatını seç
   - Connection string şöyle görünecek:
     ```
     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```
     veya
     ```
     postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
     ```

4. **Password'ü göster**
   - "Show password" veya "Reveal" butonuna tıkla
   - Password'ü kopyala

### Yöntem 2: Connection String Formatı

Eğer password'ü biliyorsan, connection string'i manuel oluşturabilirsin:

```
postgresql://postgres:[DATABASE-PASSWORD]@db.tdquwneanxuavsgxcwgo.supabase.co:5432/postgres
```

**Örnek:**
```
postgresql://postgres:MySecurePassword123@db.tdquwneanxuavsgxcwgo.supabase.co:5432/postgres
```

## 🔍 Password'ü Bulamıyorsan

1. **Supabase Dashboard > Settings > Database**
2. **"Reset database password"** butonuna tıkla
3. Yeni bir password belirle
4. Bu password'ü connection string'de kullan

## ✅ .env.local Dosyasına Ekle

```bash
DATABASE_URL=postgresql://postgres:[DATABASE-PASSWORD]@db.tdquwneanxuavsgxcwgo.supabase.co:5432/postgres
```

**⚠️ ÖNEMLİ:** `[DATABASE-PASSWORD]` kısmını gerçek database password'ünle değiştir!

## 🚫 Secret Key Ne İçin Kullanılır?

Secret Key (`sb_secret_...`) şunlar için kullanılır:
- Supabase REST API çağrıları
- Supabase Auth API
- Supabase Storage API
- Admin işlemleri

**PostgreSQL connection string'inde kullanılmaz!**

## 📝 Özet

1. ✅ Supabase Dashboard > Settings > Database
2. ✅ Connection string'i kopyala (URI formatında)
3. ✅ Password'ü göster ve kopyala
4. ✅ `.env.local` dosyasına ekle:
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.tdquwneanxuavsgxcwgo.supabase.co:5432/postgres
   ```
5. ✅ `npm run db:push` çalıştır



