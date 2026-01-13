#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { places } from '../lib/db/schema'
import { sql } from 'drizzle-orm'

async function checkPhotos() {
  console.log('🔍 Fotoğraf verilerini kontrol ediyor...\n')

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

    // Fotoğrafı olmayan mekanlar
    const placesWithoutPhotos = await db
      .select({ count: sql<number>`count(*)` })
      .from(places)
      .where(sql`photos IS NULL OR photos = 'null' OR photos = ''`)
    
    console.log(`❌ Fotoğrafı olmayan mekanlar: ${placesWithoutPhotos[0].count}`)

    // Örnek fotoğraf verileri
    const samplePlaces = await db
      .select({
        id: places.id,
        name: places.name,
        photos: places.photos,
      })
      .from(places)
      .where(sql`photos IS NOT NULL AND photos != 'null' AND photos != ''`)
      .limit(3)

    console.log('\n📋 Örnek fotoğraf verileri:')
    for (const place of samplePlaces) {
      console.log(`\n  ${place.name} (ID: ${place.id}):`)
      try {
        const photos = typeof place.photos === 'string' ? JSON.parse(place.photos) : place.photos
        console.log(`    Fotoğraf sayısı: ${Array.isArray(photos) ? photos.length : 0}`)
        if (Array.isArray(photos) && photos.length > 0) {
          console.log(`    İlk fotoğraf:`, JSON.stringify(photos[0], null, 2))
        }
      } catch (e) {
        console.log(`    ❌ Parse hatası: ${e instanceof Error ? e.message : String(e)}`)
        console.log(`    Raw data: ${place.photos?.substring(0, 100)}...`)
      }
    }

    // Fotoğrafı olmayan örnek mekanlar
    const sampleWithoutPhotos = await db
      .select({
        id: places.id,
        name: places.name,
        googleMapsId: places.googleMapsId,
        lastScrapedAt: places.lastScrapedAt,
      })
      .from(places)
      .where(sql`photos IS NULL OR photos = 'null' OR photos = ''`)
      .limit(3)

    console.log('\n📋 Fotoğrafı olmayan örnek mekanlar:')
    for (const place of sampleWithoutPhotos) {
      console.log(`  - ${place.name} (ID: ${place.id}, Google Maps ID: ${place.googleMapsId || 'yok'})`)
    }

  } catch (error) {
    console.error('❌ Hata:', error)
    process.exit(1)
  }
}

checkPhotos().catch(console.error)
