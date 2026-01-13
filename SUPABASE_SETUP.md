# 🚀 Supabase PostgreSQL Kurulum Rehberi

## ✅ Adım 1: Environment Variable Ekle

`.env.local` dosyasına connection string'i ekle:

```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.tdquwneanxuavsgxcwgo.supabase.co:5432/postgres
```

**⚠️ ÖNEMLİ:** `[YOUR-PASSWORD]` kısmını gerçek şifrenle değiştir!

## ✅ Adım 2: PostgreSQL Paketlerini Yükle

```bash
npm install postgres
npm install -D @types/pg
```

## ✅ Adım 3: Database Connection'ı Güncelle

`lib/db/index.ts` dosyasını PostgreSQL için güncelle (zaten yapıldı).

## ✅ Adım 4: Schema'yı PostgreSQL'e Uyarla

`lib/db/schema.ts` dosyasını PostgreSQL için güncelle (zaten yapıldı).

## ✅ Adım 5: Drizzle Config'i Güncelle

`drizzle.config.ts` dosyasını PostgreSQL için güncelle (zaten yapıldı).

## ✅ Adım 6: Migration Yap

```bash
npm run db:push
```

## 🔍 Connection String Kontrolü

Connection string formatı:
```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
```

Senin connection string:
```
postgresql://postgres:[YOUR-PASSWORD]@db.tdquwneanxuavsgxcwgo.supabase.co:5432/postgres
```

✅ Format doğru!

## ⚠️ Güvenlik Notu

Connection string'i `.env.local` dosyasına ekle ve **ASLA** Git'e commit etme!

`.gitignore` dosyasında `.env.local` olduğundan emin ol.



