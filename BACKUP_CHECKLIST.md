# 🔒 Güncelleme Öncesi Yedekleme Kontrol Listesi

## ⚠️ ÖNEMLİ: Bu dosyalar KORUNMALI!

### 1. Database Dosyası (EN ÖNEMLİSİ)
```
database.sqlite
database.sqlite-wal
database.sqlite-shm
```
**Bu dosyalar tüm mekan verilerinizi içerir!**
- 373 mekan
- 1990 analiz
- Tüm yorumlar

### 2. Environment Variables
```
.env.local
```
**API key'leriniz burada!**
- GOOGLE_PLACES_API_KEY
- GOOGLE_AI_API_KEY
- NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

### 3. Özel Konfigürasyonlar
```
next.config.js
tailwind.config.ts
tsconfig.json
drizzle.config.ts
```

## ✅ Güvenli Değiştirilebilir Dosyalar

Bu dosyalar güncelleme ile değiştirilebilir:
- `package.json` (bağımlılıklar)
- `node_modules/` (yeniden yüklenir)
- `.next/` (yeniden build edilir)
- Source code dosyaları (app/, components/, lib/)

## 🛡️ Yedekleme Önerisi

Güncelleme öncesi şu komutları çalıştırın:

```bash
# Database yedeği
cp database.sqlite database.sqlite.backup
cp database.sqlite-wal database.sqlite-wal.backup 2>/dev/null || true
cp database.sqlite-shm database.sqlite-shm.backup 2>/dev/null || true

# Environment variables yedeği
cp .env.local .env.local.backup
```

## 📋 Güncelleme Sonrası Kontrol

1. Database dosyasının hala mevcut olduğunu kontrol edin
2. Environment variables'ın korunduğunu kontrol edin
3. `npm run db:check` ile database'i kontrol edin
4. `npm run test:system` ile sistemi test edin


