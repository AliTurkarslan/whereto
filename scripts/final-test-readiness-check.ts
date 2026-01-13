#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { places, reviews, analyses } from '../lib/db/schema'
import { sql, count, isNotNull } from 'drizzle-orm'

async function finalTestReadinessCheck() {
  console.log('🔍 Final Test Hazırlık Kontrolü Başlatılıyor...\n')

  const checks: Array<{ name: string; status: 'pass' | 'fail' | 'warn'; message: string }> = []

  // 1. Build kontrolü
  console.log('1️⃣  Build Kontrolü...')
  try {
    const { execSync } = require('child_process')
    execSync('npm run build', { stdio: 'pipe' })
    checks.push({ name: 'Build', status: 'pass', message: 'Build başarılı' })
  } catch (error) {
    checks.push({ name: 'Build', status: 'fail', message: 'Build hatası var' })
  }
  console.log()

  // 2. Database bağlantısı
  console.log('2️⃣  Database Bağlantısı...')
  try {
    await db.execute(sql`SELECT 1`)
    checks.push({ name: 'Database', status: 'pass', message: 'Database bağlantısı başarılı' })
  } catch (error) {
    checks.push({ name: 'Database', status: 'fail', message: 'Database bağlantı hatası' })
  }
  console.log()

  // 3. Veri kontrolü
  console.log('3️⃣  Veri Kontrolü...')
  try {
    const totalPlaces = await db.select({ count: count() }).from(places)
    const totalReviews = await db.select({ count: count() }).from(reviews)
    const totalAnalyses = await db.select({ count: count() }).from(analyses)

    if (totalPlaces[0].count > 0) {
      checks.push({ name: 'Mekan Verisi', status: 'pass', message: `${totalPlaces[0].count} mekan var` })
    } else {
      checks.push({ name: 'Mekan Verisi', status: 'fail', message: 'Mekan yok' })
    }

    if (totalReviews[0].count > 0) {
      checks.push({ name: 'Yorum Verisi', status: 'pass', message: `${totalReviews[0].count} yorum var` })
    } else {
      checks.push({ name: 'Yorum Verisi', status: 'warn', message: 'Yorum yok' })
    }

    if (totalAnalyses[0].count > 0) {
      checks.push({ name: 'Analiz Verisi', status: 'pass', message: `${totalAnalyses[0].count} analiz var` })
    } else {
      checks.push({ name: 'Analiz Verisi', status: 'warn', message: 'Analiz yok' })
    }
  } catch (error) {
    checks.push({ name: 'Veri Kontrolü', status: 'fail', message: 'Veri kontrolü hatası' })
  }
  console.log()

  // 4. API Endpoints
  console.log('4️⃣  API Endpoints...')
  const fs = require('fs')
  const apiFiles = [
    'app/api/recommend/route.ts',
    'app/api/feedback/route.ts',
    'app/api/health/route.ts',
  ]
  
  apiFiles.forEach(file => {
    if (fs.existsSync(file)) {
      checks.push({ name: `API: ${file.split('/').pop()}`, status: 'pass', message: 'Mevcut' })
    } else {
      checks.push({ name: `API: ${file.split('/').pop()}`, status: 'fail', message: 'Bulunamadı' })
    }
  })
  console.log()

  // 5. Environment Variables
  console.log('5️⃣  Environment Variables...')
  const requiredEnvVars = ['DATABASE_URL', 'GOOGLE_PLACES_API_KEY']
  const optionalEnvVars = ['GOOGLE_GEMINI_API_KEY']
  
  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      checks.push({ name: `Env: ${envVar}`, status: 'pass', message: 'Tanımlı' })
    } else {
      checks.push({ name: `Env: ${envVar}`, status: 'fail', message: 'Tanımlı değil' })
    }
  })
  
  optionalEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      checks.push({ name: `Env: ${envVar}`, status: 'pass', message: 'Tanımlı' })
    } else {
      checks.push({ name: `Env: ${envVar}`, status: 'warn', message: 'Tanımlı değil (opsiyonel)' })
    }
  })
  console.log()

  // Özet
  console.log('='.repeat(60))
  console.log('📊 TEST HAZIRLIK RAPORU')
  console.log('='.repeat(60))
  
  const passed = checks.filter(c => c.status === 'pass').length
  const failed = checks.filter(c => c.status === 'fail').length
  const warned = checks.filter(c => c.status === 'warn').length

  checks.forEach(check => {
    const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️'
    console.log(`${icon} ${check.name}: ${check.message}`)
  })

  console.log()
  console.log('='.repeat(60))
  console.log(`✅ Başarılı: ${passed}`)
  console.log(`⚠️  Uyarı: ${warned}`)
  console.log(`❌ Başarısız: ${failed}`)
  console.log('='.repeat(60))
  console.log()

  if (failed === 0) {
    console.log('✅ SİSTEM TEST İÇİN HAZIR!')
  } else {
    console.log('❌ SİSTEM TEST İÇİN HAZIR DEĞİL')
    console.log('   Lütfen başarısız kontrolleri düzeltin.')
  }
  console.log('='.repeat(60))
}

finalTestReadinessCheck().catch(console.error)
