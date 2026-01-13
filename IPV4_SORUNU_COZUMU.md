# 🔧 IPv4 Sorunu Çözümü

## ❌ Sorun

Supabase connection string'inde "Not IPv4 compatible" uyarısı var. Bu, Supabase'in IPv6 kullandığını ve ağınızın IPv4-only olabileceğini gösterir.

## ✅ Çözüm: Session Pooler Kullanmak

### Adım 1: Supabase Dashboard'da Session Pooler Connection String'i Al

1. **Supabase Dashboard > Settings > Database**
2. **"Connect to your project" modal'ını aç**
3. **"Connection String" tab'ına git**
4. **"Source" dropdown'ından "Session Pooler" seç**
5. **Connection string'i kopyala**

### Adım 2: Session Pooler Connection String Formatı

Session Pooler connection string formatı şöyle olacak:

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

veya

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[REGION].pooler.supabase.com:6543/postgres
```

**Önemli Farklar:**
- Port: `5432` yerine `6543`
- Hostname: `db.[PROJECT-REF].supabase.co` yerine `[REGION].pooler.supabase.com`
- User: `postgres` yerine `postgres.[PROJECT-REF]`

### Adım 3: .env.local Dosyasını Güncelle

```bash
DATABASE_URL=postgresql://postgres.tdquwneanxuavsgxcwgo:At280994at..@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

**NOT:** `[REGION]` kısmını Supabase Dashboard'dan aldığın connection string'deki region ile değiştir (örneğin: `eu-central-1`, `us-east-1`, vb.)

### Adım 4: Test Et

```bash
npm run db:push
```

## 🔍 Region'u Nasıl Bulurum?

1. Supabase Dashboard > Settings > Database
2. Session Pooler connection string'ine bak
3. Hostname'deki region'u kopyala (örneğin: `aws-0-eu-central-1.pooler.supabase.com` → region: `eu-central-1`)

## 📋 Alternatif: Direct Connection (IPv4 Add-on)

Eğer Session Pooler kullanmak istemiyorsan:

1. **Supabase Dashboard > Settings > Database**
2. **"IPv4 add-on" butonuna tıkla**
3. **IPv4 add-on'u satın al** (ücretli)

## ✅ Kontrol Listesi

- [ ] Supabase Dashboard'dan Session Pooler connection string'i aldım
- [ ] Connection string formatı doğru (port 6543, pooler hostname)
- [ ] `.env.local` dosyasını güncelledim
- [ ] `npm run db:push` komutunu çalıştırdım
- [ ] Bağlantı başarılı oldu

## 🚀 Sonraki Adım

Session Pooler connection string'i ile `.env.local` dosyasını güncelledikten sonra:

```bash
npm run db:push
```



