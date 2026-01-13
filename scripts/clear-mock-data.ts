#!/usr/bin/env tsx

/**
 * Mock dataları temizle
 */

import { db } from '../lib/db'
import { places, reviews, analyses } from '../lib/db/schema'
import { like, or, eq } from 'drizzle-orm'

async function clearMockData() {
  console.log('🧹 Mock dataları temizliyorum...\n')

  // Mock mekanları bul (isimlerine göre)
  const mockPlaces = await db
    .select()
    .from(places)
    .where(
      or(
        like(places.name, '%Örnek%'),
        like(places.name, '%Popüler%')
      )
    )

  console.log(`📋 ${mockPlaces.length} mock mekan bulundu`)

  for (const place of mockPlaces) {
    // İlgili analizleri sil
    await db.delete(analyses).where(eq(analyses.placeId, place.id))
    
    // İlgili yorumları sil
    await db.delete(reviews).where(eq(reviews.placeId, place.id))
    
    // Mekanı sil
    await db.delete(places).where(eq(places.id, place.id))
    
    console.log(`  ✅ ${place.name} silindi`)
  }

  console.log(`\n✅ ${mockPlaces.length} mock mekan temizlendi`)
}

clearMockData()
  .then(() => {
    console.log('\n✅ Temizleme tamamlandı')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Hata:', error)
    process.exit(1)
  })

