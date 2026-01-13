#!/usr/bin/env tsx

/**
 * Database'deki mekanları kontrol et
 */

import { db } from '../lib/db'
import { places, analyses } from '../lib/db/schema'
import { sql } from 'drizzle-orm'

async function checkDatabase() {
  console.log('📊 Database Durumu\n')
  
  // Toplam mekan sayısı
  const totalPlaces = await db.select({ count: sql<number>`count(*)` }).from(places)
  console.log(`📍 Toplam Mekan: ${totalPlaces[0].count}`)
  
  // Kategori bazlı sayılar
  const byCategory = await db
    .select({
      category: places.category,
      count: sql<number>`count(*)`,
    })
    .from(places)
    .groupBy(places.category)
  
  console.log('\n📂 Kategori Bazlı:')
  byCategory.forEach((row) => {
    console.log(`  ${row.category || 'N/A'}: ${row.count}`)
  })
  
  // Analiz sayıları
  const totalAnalyses = await db.select({ count: sql<number>`count(*)` }).from(analyses)
  console.log(`\n🤖 Toplam Analiz: ${totalAnalyses[0].count}`)
  
  // Son 10 mekan
  const recentPlaces = await db.select().from(places).limit(10)
  console.log('\n📋 Son 10 Mekan:')
  recentPlaces.forEach((place, i) => {
    console.log(`  ${i + 1}. ${place.name} (${place.category}) - ${place.lat}, ${place.lng}`)
  })
}

checkDatabase()
  .then(() => {
    console.log('\n✅ Kontrol tamamlandı')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Hata:', error)
    process.exit(1)
  })


