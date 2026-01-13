#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { places } from '../lib/db/schema'
import { sql } from 'drizzle-orm'

async function checkAnkaraCoverage() {
  console.log('🔍 Ankara Veri Kapsamı Kontrolü\n')

  try {
    // Ankara koordinatları (yaklaşık)
    const ankaraLat = 39.9334
    const ankaraLng = 32.8597
    const ankaraRadius = 50 // km

    // Ankara içindeki mekanlar (yaklaşık)
    const ankaraPlaces = await db
      .select({ count: sql<number>`count(*)` })
      .from(places)
      .where(sql`(
        6371 * acos(
          cos(radians(${ankaraLat})) * 
          cos(radians(lat)) * 
          cos(radians(lng) - radians(${ankaraLng})) + 
          sin(radians(${ankaraLat})) * 
          sin(radians(lat))
        )
      ) <= ${ankaraRadius}`)
    
    console.log(`📍 Ankara İçindeki Mekanlar (50km radius): ${ankaraPlaces[0].count}`)

    // Kategorilere göre Ankara mekanları
    const ankaraCategoryStats = await db
      .select({
        category: places.category,
        count: sql<number>`count(*)`,
      })
      .from(places)
      .where(sql`(
        6371 * acos(
          cos(radians(${ankaraLat})) * 
          cos(radians(lat)) * 
          cos(radians(lng) - radians(${ankaraLng})) + 
          sin(radians(${ankaraLat})) * 
          sin(radians(lat))
        )
      ) <= ${ankaraRadius}`)
      .groupBy(places.category)
      .orderBy(sql`count(*) desc`)

    console.log('\n📋 Ankara Kategorileri:')
    for (const stat of ankaraCategoryStats) {
      console.log(`   ${stat.category || 'NULL'}: ${stat.count} mekan`)
    }

    // Toplam mekan sayısı
    const totalPlaces = await db.select({ count: sql<number>`count(*)` }).from(places)
    console.log(`\n📊 Toplam Mekan Sayısı (Tüm Türkiye): ${totalPlaces[0].count}`)

    console.log('\n✅ Ankara veri kontrolü tamamlandı!')

  } catch (error) {
    console.error('❌ Hata:', error)
    process.exit(1)
  }
}

checkAnkaraCoverage().catch(console.error)
