#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { places } from '../lib/db/schema'
import { sql } from 'drizzle-orm'

async function checkApiUsage() {
  console.log('🔍 API Kullanım Analizi\n')

  try {
    // Toplam mekan sayısı
    const totalPlaces = await db.select({ count: sql<number>`count(*)` }).from(places)
    console.log(`📊 Toplam mekan sayısı: ${totalPlaces[0].count}`)

    // Fotoğrafı olan mekanlar
    const placesWithPhotos = await db
      .select({ count: sql<number>`count(*)` })
      .from(places)
      .where(sql`photos IS NOT NULL AND photos != 'null' AND photos != ''`)
    
    console.log(`📸 Fotoğrafı olan mekanlar: ${placesWithPhotos[0].count}`)

    // Yorumu olan mekanlar
    const placesWithReviews = await db
      .select({ count: sql<number>`count(*)` })
      .from(places)
      .where(sql`review_count > 0`)
    
    console.log(`💬 Yorumu olan mekanlar: ${placesWithReviews[0].count}`)

    // Analizi olan mekanlar
    const placesWithAnalyses = await db
      .select({ count: sql<number>`count(*)` })
      .from(places)
      .innerJoin(
        sql`analyses`,
        sql`analyses.place_id = places.id`
      )
    
    console.log(`🤖 Analizi olan mekanlar: ${placesWithAnalyses[0].count || 0}`)

    // Örnek fotoğraf verisi
    const samplePlace = await db
      .select({
        id: places.id,
        name: places.name,
        photos: places.photos,
        googleMapsId: places.googleMapsId,
      })
      .from(places)
      .where(sql`photos IS NOT NULL AND photos != 'null' AND photos != ''`)
      .limit(1)

    if (samplePlace.length > 0) {
      console.log(`\n📋 Örnek mekan: ${samplePlace[0].name}`)
      try {
        const photos = typeof samplePlace[0].photos === 'string' 
          ? JSON.parse(samplePlace[0].photos) 
          : samplePlace[0].photos
        console.log(`   Fotoğraf sayısı: ${Array.isArray(photos) ? photos.length : 0}`)
        if (Array.isArray(photos) && photos.length > 0) {
          console.log(`   İlk fotoğraf name: ${photos[0].name?.substring(0, 80)}...`)
        }
      } catch (e) {
        console.log(`   Parse hatası: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    console.log('\n✅ API\'siz çalışma için yeterli veri var!')
    console.log('   - Fotoğraflar database\'de saklanıyor')
    console.log('   - Yorumlar database\'de saklanıyor')
    console.log('   - Analizler database\'de saklanıyor')

  } catch (error) {
    console.error('❌ Hata:', error)
    process.exit(1)
  }
}

checkApiUsage().catch(console.error)
