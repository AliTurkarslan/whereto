# 🚀 Vercel Deployment - Hızlı Rehber

## ⚡ 5 Dakikada Deploy

### 1. GitHub'a Push
```bash
cd /Users/mac_ali/WhereTo
git init  # Eğer yoksa
git add .
git commit -m "Vercel deployment"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADI/whereto.git
git push -u origin main
```

### 2. Vercel'e Deploy
1. https://vercel.com → Sign Up (GitHub ile)
2. "Add New Project" → GitHub'dan "whereto" seç
3. **Environment Variables ekle:**
   - `GOOGLE_PLACES_API_KEY` = `AIzaSyBrMQukYX3mhL_UYR2WgqxfJbAWwsvaAPI`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = `AIzaSyBrMQukYX3mhL_UYR2WgqxfJbAWwsvaAPI`
   - `GOOGLE_AI_API_KEY` = `AIzaSyBT1wZoWf1R9En7K1QMF5XeHlaTCQzh3uE`
   - `DATABASE_URL` = `postgresql://postgres.tdquwneanxuavsgxcwgo:At280994at..@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres`
4. "Deploy" tıkla
5. Link'i al: `https://whereto-xxxxx.vercel.app`

### 3. Test Et ve Paylaş
- Link'i aç ve test et
- Test kullanıcılarına paylaş

**Detaylı rehber:** `VERCEL_DEPLOYMENT_STEP_BY_STEP.md`
