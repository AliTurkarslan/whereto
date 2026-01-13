#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { places, reviews, analyses } from '../lib/db/schema'
import { sql, count, isNotNull, gte } from 'drizzle-orm'

async function systemReadinessCheck() {
  console.log('🔍 Sistem Test Hazırlık Kontrolü Başlatılıyor...\n')

  const issues: string[] = []
  const warnings: string[] = []
  const successes: string[] = []

  // 1. Environment Variables
  console.log('1️⃣  Environment Variables Kontrolü...')
  const requiredEnvVars = [
    'DATABASE_URL',
    'GOOGLE_PLACES_API_KEY',
    'GOOGLE_GEMINI_API_KEY',
  ]
  
  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar] || process.env[`NEXT_PUBLIC_${envVar}`]) {
      successes.push(`✅ ${envVar} tanımlı`)
    } else {
      issues.push(`❌ ${envVar} tanımlı değil`)
    }
  })
  console.log()

  // 2. Database Connection
  console.log('2️⃣  Database Bağlantısı Kontrolü...')
  try {
    const result = await db.execute(sql`SELECT 1 as test`)
    successes.push('✅ Database bağlantısı başarılı')
  } catch (error) {
    issues.push(`❌ Database bağlantı hatası: ${error}`)
  }
  console.log()

  // 3. Database Verileri
  console.log('3️⃣  Database Verileri Kontrolü...')
  try {
    const totalPlaces = await db.select({ count: count() }).from(places)
    const totalReviews = await db.select({ count: count() }).from(reviews)
    const totalAnalyses = await db.select({ count: count() }).from(analyses)

    if (totalPlaces[0].count > 0) {
      successes.push(`✅ ${totalPlaces[0].count} mekan var`)
    } else {
      issues.push('❌ Database\'de mekan yok')
    }

    if (totalReviews[0].count > 0) {
      successes.push(`✅ ${totalReviews[0].count} yorum var`)
    } else {
      warnings.push('⚠️  Database\'de yorum yok')
    }

    if (totalAnalyses[0].count > 0) {
      successes.push(`✅ ${totalAnalyses[0].count} analiz var`)
    } else {
      warnings.push('⚠️  Database\'de analiz yok')
    }
  } catch (error) {
    issues.push(`❌ Database veri kontrolü hatası: ${error}`)
  }
  console.log()

  // 4. Veri Kalitesi
  console.log('4️⃣  Veri Kalitesi Kontrolü...')
  try {
    const placesWithReviews = await db.execute(sql`
      SELECT COUNT(DISTINCT p.id)::int as count
      FROM places p
      JOIN reviews r ON p.id = r.place_id
    `)
    const placesCount = (placesWithReviews as any).rows?.[0]?.count || 0

    if (placesCount > 0) {
      successes.push(`✅ ${placesCount} mekanın yorumu var`)
    } else {
      warnings.push('⚠️  Hiç mekanın yorumu yok')
    }

    const placesWithAnalyses = await db.execute(sql`
      SELECT COUNT(DISTINCT p.id)::int as count
      FROM places p
      JOIN analyses a ON p.id = a.place_id
    `)
    const analysesCount = (placesWithAnalyses as any).rows?.[0]?.count || 0

    if (analysesCount > 0) {
      successes.push(`✅ ${analysesCount} mekanın analizi var`)
    } else {
      warnings.push('⚠️  Hiç mekanın analizi yok')
    }
  } catch (error) {
    issues.push(`❌ Veri kalitesi kontrolü hatası: ${error}`)
  }
  console.log()

  // 5. API Endpoints
  console.log('5️⃣  API Endpoints Kontrolü...')
  const apiFiles = [
    'app/api/recommend/route.ts',
    'app/api/feedback/route.ts',
  ]
  
  apiFiles.forEach(file => {
    try {
      const fs = require('fs')
      if (fs.existsSync(file)) {
        successes.push(`✅ ${file} mevcut`)
      } else {
        issues.push(`❌ ${file} bulunamadı`)
      }
    } catch (error) {
      warnings.push(`⚠️  ${file} kontrol edilemedi`)
    }
  })
  console.log()

  // 6. Özet
  console.log('='.repeat(60))
  console.log('📊 ÖZET')
  console.log('='.repeat(60))
  console.log(`✅ Başarılı: ${successes.length}`)
  console.log(`⚠️  Uyarı: ${warnings.length}`)
  console.log(`❌ Sorun: ${issues.length}`)
  console.log()

  if (successes.length > 0) {
    console.log('✅ BAŞARILILAR:')
    successes.forEach(s => console.log(`   ${s}`))
    console.log()
  }

  if (warnings.length > 0) {
    console.log('⚠️  UYARILAR:')
    warnings.forEach(w => console.log(`   ${w}`))
    console.log()
  }

  if (issues.length > 0) {
    console.log('❌ SORUNLAR:')
    issues.forEach(i => console.log(`   ${i}`))
    console.log()
  }

  // 7. Test Uygunluk Değerlendirmesi
  console.log('='.repeat(60))
  console.log('🎯 TEST UYGUNLUK DEĞERLENDİRMESİ')
  console.log('='.repeat(60))
  
  if (issues.length === 0 && warnings.length <= 2) {
    console.log('✅ SİSTEM TEST İÇİN UYGUN!')
    console.log('   Tüm kritik kontroller başarılı.')
  } else if (issues.length === 0) {
    console.log('⚠️  SİSTEM TEST İÇİN UYGUN (Uyarılar var)')
    console.log('   Kritik sorunlar yok ama bazı uyarılar var.')
  } else {
    console.log('❌ SİSTEM TEST İÇİN UYGUN DEĞİL')
    console.log('   Kritik sorunlar var, önce düzeltilmeli.')
  }
  console.log('='.repeat(60))
}

systemReadinessCheck().catch(console.error)
