#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

async function testVercelDeployment() {
  console.log('🔍 Vercel Deployment Testi\n')

  const vercelUrl = 'https://whereto-sigma.vercel.app'

  // 1. Health check
  console.log('1️⃣ Health Check...')
  try {
    const healthResponse = await fetch(`${vercelUrl}/api/health`)
    const healthData = await healthResponse.json()
    console.log(`   ✅ Health: ${JSON.stringify(healthData)}`)
  } catch (error) {
    console.log(`   ❌ Health check hatası: ${error instanceof Error ? error.message : String(error)}`)
  }

  // 2. Recommend API test
  console.log('\n2️⃣ Recommend API Test...')
  try {
    const recommendResponse = await fetch(`${vercelUrl}/api/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lat: 39.9334, // Ankara
        lng: 32.8597,
        address: 'Ankara, Türkiye',
        category: 'yemek',
        companion: 'alone',
      }),
    })

    if (!recommendResponse.ok) {
      const errorText = await recommendResponse.text()
      console.log(`   ❌ API Hatası: ${recommendResponse.status}`)
      console.log(`   Hata Detayı: ${errorText.substring(0, 500)}`)
    } else {
      const data = await recommendResponse.json()
      console.log(`   ✅ API Başarılı`)
      console.log(`   📊 Sonuç Sayısı: ${data.places?.length || 0}`)
      if (data.error) {
        console.log(`   ⚠️  API Error: ${data.error}`)
      }
    }
  } catch (error) {
    console.log(`   ❌ API Test Hatası: ${error instanceof Error ? error.message : String(error)}`)
  }

  // 3. Environment variables kontrolü
  console.log('\n3️⃣ Environment Variables Kontrolü:')
  console.log('   ⚠️  Vercel dashboard\'da kontrol et:')
  console.log('   - GOOGLE_PLACES_API_KEY')
  console.log('   - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY')
  console.log('   - GOOGLE_AI_API_KEY')
  console.log('   - DATABASE_URL')
  console.log('   - FEEDBACK_SECRET (opsiyonel)')

  // 4. Database bağlantı testi (local)
  console.log('\n4️⃣ Local Database Bağlantı Testi:')
  try {
    const { db } = require('../lib/db')
    const { places } = require('../lib/db/schema')
    const { sql } = require('drizzle-orm')
    
    const placeCount = await db.select({ count: sql<number>`count(*)` }).from(places)
    console.log(`   ✅ Database bağlantısı çalışıyor`)
    console.log(`   📊 Toplam mekan: ${placeCount[0].count}`)
  } catch (error) {
    console.log(`   ❌ Database hatası: ${error instanceof Error ? error.message : String(error)}`)
  }

  console.log('\n✅ Test tamamlandı!')
}

testVercelDeployment().catch(console.error)
