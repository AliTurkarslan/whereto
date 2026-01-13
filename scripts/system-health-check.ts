#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

console.log('🔍 Sistem Sağlık Kontrolü\n')

const issues: string[] = []
const warnings: string[] = []
const info: string[] = []

// 1. API Key Kontrolleri
console.log('📋 API Key Kontrolleri:')

const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
if (!googlePlacesApiKey || googlePlacesApiKey.trim() === '') {
  issues.push('❌ GOOGLE_PLACES_API_KEY veya NEXT_PUBLIC_GOOGLE_MAPS_API_KEY eksik')
} else {
  info.push(`✅ Google Places/Maps API Key: ${googlePlacesApiKey.substring(0, 10)}...`)
}

const googleAiApiKey = process.env.GOOGLE_AI_API_KEY
if (!googleAiApiKey || googleAiApiKey.trim() === '') {
  warnings.push('⚠️  GOOGLE_AI_API_KEY eksik (AI analizleri çalışmayacak)')
} else {
  info.push(`✅ Google AI API Key: ${googleAiApiKey.substring(0, 10)}...`)
}

// 2. Database Kontrolü
console.log('\n📊 Database Kontrolü:')

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl || databaseUrl.trim() === '') {
  issues.push('❌ DATABASE_URL eksik')
} else {
  if (databaseUrl.includes('supabase')) {
    info.push('✅ Supabase database bağlantısı mevcut')
  } else {
    info.push('✅ Database bağlantısı mevcut')
  }
}

// 3. Özet
console.log('\n📊 Özet:')
console.log(`   ✅ Başarılı: ${info.length}`)
console.log(`   ⚠️  Uyarılar: ${warnings.length}`)
console.log(`   ❌ Sorunlar: ${issues.length}`)

if (info.length > 0) {
  console.log('\n✅ Başarılı Kontroller:')
  info.forEach(item => console.log(`   ${item}`))
}

if (warnings.length > 0) {
  console.log('\n⚠️  Uyarılar:')
  warnings.forEach(item => console.log(`   ${item}`))
}

if (issues.length > 0) {
  console.log('\n❌ Kritik Sorunlar:')
  issues.forEach(item => console.log(`   ${item}`))
  console.log('\n🔧 Bu sorunları çözmeniz gerekiyor!')
  process.exit(1)
} else {
  console.log('\n✅ Sistem hazır görünüyor!')
}
