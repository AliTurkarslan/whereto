#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { searchPlaces } from '../lib/scrapers/google-places-api'

async function testNewApiKey() {
  console.log('🧪 Yeni API Key Testi\n')

  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.error('❌ API key bulunamadı!')
    process.exit(1)
  }

  console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...`)

  try {
    // Basit bir test araması
    console.log('\n🔍 Test araması yapılıyor...')
    const places = await searchPlaces(
      'restaurant',
      { lat: 39.9334, lng: 32.8597 }, // Ankara
      apiKey,
      5 // Sadece 5 mekan
    )

    console.log(`✅ ${places.length} mekan bulundu!`)
    console.log('\n📋 Bulunan Mekanlar:')
    places.slice(0, 3).forEach((place, i) => {
      console.log(`   ${i + 1}. ${place.name} - ${place.rating || 'N/A'} ⭐`)
    })

    console.log('\n✅ API key çalışıyor!')
  } catch (error) {
    console.error('❌ API key testi başarısız:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

testNewApiKey().catch(console.error)
