# 🗄️ Production Database Kurulum Rehberi

## 📊 Mevcut Durum

**Şu Anki Database:**
- ✅ **SQLite** (better-sqlite3)
- 📁 Dosya: `database.sqlite` (lokal)
- ⚠️ **Sorun:** Serverless platformlarda (Vercel, Netlify) çalışmaz!

**Neden SQLite Production'da Çalışmaz?**
- SQLite dosya sistemi üzerinde çalışır
- Serverless platformlar her istekte yeni bir container başlatır
- Dosya sistemi geçici ve paylaşılmaz
- Her istekte database sıfırlanır

---

## 🎯 Production Database Seçenekleri

### Seçenek 1: Vercel Postgres (Önerilen - Vercel Kullanıyorsanız)

**Avantajlar:**
- ✅ Vercel ile entegre
- ✅ Otomatik backup
- ✅ Ücretsiz tier (256 MB)
- ✅ Kolay kurulum
- ✅ Drizzle ORM ile uyumlu

**Fiyat:**
- Free: 256 MB storage
- Pro ($20/ay): 4 GB storage
- Enterprise: Özel fiyatlandırma

**Kurulum:**
1. Vercel Dashboard > Project > Storage > Create Database
2. "Postgres" seç
3. Database oluştur
4. Connection string'i al
5. Environment variable ekle: `DATABASE_URL`

---

### Seçenek 2: Supabase (Önerilen - En Popüler)

**Avantajlar:**
- ✅ Ücretsiz tier (500 MB)
- ✅ PostgreSQL (güçlü)
- ✅ Otomatik backup
- ✅ Real-time subscriptions
- ✅ Authentication (gelecekte kullanılabilir)
- ✅ Drizzle ORM ile uyumlu

**Fiyat:**
- Free: 500 MB storage, 2 GB bandwidth
- Pro ($25/ay): 8 GB storage, 50 GB bandwidth

**Kurulum:**
1. https://supabase.com → Sign up
2. New Project oluştur
3. Settings > Database > Connection string'i al
4. Environment variable ekle: `DATABASE_URL`

---

### Seçenek 3: Neon (Önerilen - Serverless PostgreSQL)

**Avantajlar:**
- ✅ Serverless PostgreSQL
- ✅ Otomatik scaling
- ✅ Ücretsiz tier (3 GB)
- ✅ Drizzle ORM ile uyumlu
- ✅ Hızlı ve modern

**Fiyat:**
- Free: 3 GB storage
- Launch ($19/ay): 10 GB storage
- Scale: Özel fiyatlandırma

**Kurulum:**
1. https://neon.tech → Sign up
2. New Project oluştur
3. Connection string'i al
4. Environment variable ekle: `DATABASE_URL`

---

### Seçenek 4: Railway

**Avantajlar:**
- ✅ PostgreSQL
- ✅ Kolay kurulum
- ✅ $5 kredi (ücretsiz başlangıç)

**Fiyat:**
- $5 kredi ücretsiz
- Sonrası kullanıma göre

**Kurulum:**
1. https://railway.app → Sign up
2. New Project > Database > PostgreSQL
3. Connection string'i al
4. Environment variable ekle: `DATABASE_URL`

---

## 🔄 Migration Stratejisi

### Adım 1: PostgreSQL Database Seç ve Kur

**Öneri:** Supabase (ücretsiz, kolay, güçlü)

1. Supabase hesabı oluştur
2. Yeni proje oluştur
3. Connection string'i al:
   ```
   postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   ```

### Adım 2: Schema'yı PostgreSQL'e Migrate Et

**Drizzle ORM zaten PostgreSQL destekli!** Sadece schema'yı güncelle:

1. `drizzle.config.ts` dosyasını güncelle
2. `lib/db/index.ts` dosyasını güncelle
3. Schema'yı PostgreSQL'e push et

### Adım 3: Mevcut Verileri Migrate Et

**Script oluştur:**
- SQLite'den verileri oku
- PostgreSQL'e yaz
- Kategorileri düzelt (migration script ile)

---

## 📋 Adım Adım Kurulum

### 1. Supabase Database Oluştur

```bash
# 1. https://supabase.com → Sign up
# 2. New Project oluştur
# 3. Project Settings > Database > Connection string'i kopyala
```

### 2. Environment Variable Ekle

`.env.local` dosyasına ekle:
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
```

### 3. Drizzle Config Güncelle

`drizzle.config.ts` dosyasını güncelle:
```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql', // ✅ SQLite'dan PostgreSQL'e değiştir
  dbCredentials: {
    url: process.env.DATABASE_URL!, // ✅ Environment variable'dan al
  },
} satisfies Config
```

### 4. Database Driver Güncelle

`lib/db/index.ts` dosyasını güncelle:
```typescript
// ❌ Eski (SQLite):
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

// ✅ Yeni (PostgreSQL):
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
export const db = drizzle(client, { schema })
```

### 5. Schema'yı PostgreSQL'e Uyarla

`lib/db/schema.ts` dosyasını güncelle:
```typescript
// ❌ Eski (SQLite):
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// ✅ Yeni (PostgreSQL):
import { pgTable, text, integer, real, timestamp } from 'drizzle-orm/pg-core'
```

### 6. Package.json'a PostgreSQL Dependencies Ekle

```bash
npm install postgres drizzle-orm
npm install -D @types/pg
```

### 7. Schema'yı Database'e Push Et

```bash
npm run db:push
```

### 8. Mevcut Verileri Migrate Et

Migration script çalıştır:
```bash
npm run migrate:analyses-categories
```

---

## 🚀 Hızlı Başlangıç (Supabase)

### 1. Supabase Hesabı Oluştur
- https://supabase.com → Sign up
- GitHub ile giriş yap

### 2. Yeni Proje Oluştur
- "New Project" tıkla
- Proje adı: `whereto`
- Database password seç (kaydet!)
- Region: En yakın bölge (Europe West)
- "Create new project" tıkla

### 3. Connection String Al
- Project Settings > Database
- Connection string'i kopyala:
  ```
  postgresql://postgres.xxxxx:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
  ```

### 4. Environment Variable Ekle
`.env.local` dosyasına:
```bash
DATABASE_URL=postgresql://postgres.xxxxx:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

### 5. Code Güncellemeleri
- `drizzle.config.ts` güncelle
- `lib/db/index.ts` güncelle
- `lib/db/schema.ts` güncelle (PostgreSQL types)
- Dependencies ekle

### 6. Database Push
```bash
npm run db:push
```

### 7. Migration Çalıştır
```bash
npm run migrate:analyses-categories
```

---

## 📊 Karşılaştırma

| Özellik | SQLite (Şu An) | Supabase | Vercel Postgres | Neon |
|---------|----------------|----------|-----------------|------|
| **Production Ready** | ❌ | ✅ | ✅ | ✅ |
| **Serverless Uyumlu** | ❌ | ✅ | ✅ | ✅ |
| **Ücretsiz Tier** | ✅ | ✅ (500 MB) | ✅ (256 MB) | ✅ (3 GB) |
| **Kurulum Kolaylığı** | ✅ | ✅ | ✅ | ✅ |
| **Backup** | ❌ | ✅ | ✅ | ✅ |
| **Öneri** | ❌ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |

---

## 🎯 Öneri

**Supabase kullan!** Çünkü:
1. ✅ Ücretsiz tier yeterli (500 MB)
2. ✅ Kolay kurulum
3. ✅ Güçlü PostgreSQL
4. ✅ Otomatik backup
5. ✅ Gelecekte authentication eklenebilir
6. ✅ Real-time özellikler

---

## ⚠️ Önemli Notlar

1. **SQLite → PostgreSQL Migration:**
   - Schema'lar farklı (text vs varchar, integer vs bigint)
   - Timestamp formatları farklı
   - Boolean handling farklı (SQLite: 0/1, PostgreSQL: true/false)

2. **Environment Variables:**
   - Production'da (Vercel, Netlify) environment variables ekle
   - `.env.local` sadece lokal development için

3. **Backup:**
   - Supabase otomatik backup yapar
   - Manuel backup için: Supabase Dashboard > Database > Backups

4. **Connection Pooling:**
   - Supabase connection pooling kullan
   - Connection string'de `pooler` kullan

---

## 📝 Sonraki Adımlar

1. ✅ Supabase hesabı oluştur
2. ✅ Database oluştur
3. ✅ Connection string al
4. ✅ Code güncellemeleri yap
5. ✅ Database push et
6. ✅ Migration çalıştır
7. ✅ Test et



