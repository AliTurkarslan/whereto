#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { places } from '../lib/db/schema'
import { sql, count, isNotNull, isNull } from 'drizzle-orm'

async function verifyPlaceData() {
  console.log('🔍 Mekan Verisi Doğrulama Başlatılıyor...\n')

  const totalPlaces = await db.select({ count: count() }).from(places)
  console.log(`📊 Toplam Mekan: ${totalPlaces[0].count}\n`)

  // Field completeness kontrolü
  const fields = [
    { name: 'googleMapsId', field: places.googleMapsId },
    { name: 'rating', field: places.rating },
    { name: 'reviewCount', field: places.reviewCount },
    { name: 'phone', field: places.phone },
    { name: 'website', field: places.website },
    { name: 'priceLevel', field: places.priceLevel },
    { name: 'goodForChildren', field: places.goodForChildren },
    { name: 'outdoorSeating', field: places.outdoorSeating },
    { name: 'parkingOptions', field: places.parkingOptions },
    { name: 'servesBreakfast', field: places.servesBreakfast },
    { name: 'servesLunch', field: places.servesLunch },
    { name: 'servesDinner', field: places.servesDinner },
    { name: 'takeout', field: places.takeout },
    { name: 'delivery', field: places.delivery },
    { name: 'dineIn', field: places.dineIn },
  ]

  console.log('📋 Field Completeness:')
  for (const { name, field } of fields) {
    const withField = await db
      .select({ count: count() })
      .from(places)
      .where(isNotNull(field))
    
    const percentage = (withField[0].count / totalPlaces[0].count) * 100
    const status = percentage > 50 ? '✅' : percentage > 25 ? '⚠️' : '❌'
    console.log(`   ${status} ${name}: ${withField[0].count} (${percentage.toFixed(1)}%)`)
  }
  console.log()

  // Örnek mekanlar
  const samplePlaces = await db
    .select()
    .from(places)
    .limit(5)

  console.log('📋 Örnek Mekanlar:')
  samplePlaces.forEach((place, idx) => {
    console.log(`   ${idx + 1}. ${place.name}`)
    console.log(`      Rating: ${place.rating || 'N/A'}, Yorum: ${place.reviewCount || 0}`)
    console.log(`      Google Maps ID: ${place.googleMapsId ? 'Var' : 'Yok'}`)
    console.log(`      Phone: ${place.phone ? 'Var' : 'Yok'}, Website: ${place.website ? 'Var' : 'Yok'}`)
    console.log()
  })

  console.log('✅ Mekan verisi doğrulama tamamlandı!')
}

verifyPlaceData().catch(console.error)
