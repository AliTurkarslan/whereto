#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

console.log('🔧 API Key Güncelleme Hazırlığı\n')

// Mevcut API key'leri kontrol et
const currentPlacesKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const currentAiKey = process.env.GOOGLE_AI_API_KEY

console.log('📋 Mevcut API Key Durumu:')
console.log(`   Places/Maps API: ${currentPlacesKey ? `${currentPlacesKey.substring(0, 10)}... (limit dolmuş)` : 'YOK'}`)
console.log(`   AI API: ${currentAiKey ? `${currentAiKey.substring(0, 10)}...` : 'YOK'}`)

console.log('\n🔑 Gerekli API Key\'ler:')
console.log('   1. Google Places/Maps API Key (ZORUNLU)')
console.log('      - Places API (New) için')
console.log('      - Places Photo API için')
console.log('      - Street View API için (opsiyonel)')
console.log('   2. Google AI API Key (OPSİYONEL - zaten mevcut)')
console.log(`      - Mevcut: ${currentAiKey ? '✅' : '❌'}`)

console.log('\n📝 Yapılacaklar:')
console.log('   1. Yeni Google Places/Maps API key al')
console.log('   2. .env.local dosyasına ekle')
console.log('   3. Sistem test et')

console.log('\n✅ Hazırlık tamamlandı!')
