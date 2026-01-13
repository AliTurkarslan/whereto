#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { places } from '../lib/db/schema'
import { sql } from 'drizzle-orm'

async function checkPhotos() {
  console.log('🔍 Database\'de Fotoğraf Kontrolü\n')

  try {
    // Fotoğrafı olan mekanlar
    const placesWithPhotos = await db
      .select({
        id: places.id,
        name: places.name,
        photos: places.photos,
      })
      .from(places)
      .where(sql`photos IS NOT NULL AND photos != 'null' AND photos != ''`)
      .limit(10)

    console.log(`📸 Fotoğrafı olan mekanlar: ${placesWithPhotos.length}`)
    
    if (placesWithPhotos.length > 0) {
      console.log('\n📋 Örnek Mekanlar:')
      placesWithPhotos.forEach((place, i) => {
        let photosData: any = null
        try {
          photosData = typeof place.photos === 'string' 
            ? JSON.parse(place.photos) 
            : place.photos
        } catch (e) {
          console.log(`   ${i + 1}. ${place.name} - Parse hatası`)
          return
        }
        
        const photoCount = Array.isArray(photosData) ? photosData.length : 0
        console.log(`   ${i + 1}. ${place.name} - ${photoCount} fotoğraf`)
        if (photoCount > 0 && photosData[0]) {
          console.log(`      İlk foto: ${photosData[0].name || 'name yok'}`)
        }
      })
    }

    // Toplam mekan sayısı
    const totalPlaces = await db.select({ count: sql<number>`count(*)` }).from(places)
    console.log(`\n📊 Toplam Mekan: ${totalPlaces[0].count}`)

  } catch (error) {
    console.error('❌ Hata:', error)
    process.exit(1)
  }
}

checkPhotos().catch(console.error)
