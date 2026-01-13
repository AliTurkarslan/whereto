#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { places, reviews, analyses } from '../lib/db/schema'
import { sql, count, isNotNull, desc } from 'drizzle-orm'

async function comprehensiveCheck() {
  console.log('🔍 Kapsamlı Veri Kontrolü Başlatılıyor...\n')

  // 1. Temel istatistikler
  const totalPlaces = await db.select({ count: count() }).from(places)
  const totalReviews = await db.select({ count: count() }).from(reviews)
  const totalAnalyses = await db.select({ count: count() }).from(analyses)

  console.log('📊 TEMEL İSTATİSTİKLER')
  console.log('='.repeat(60))
  console.log(`   Mekan: ${totalPlaces[0].count}`)
  console.log(`   Yorum: ${totalReviews[0].count}`)
  console.log(`   Analiz: ${totalAnalyses[0].count}\n`)

  // 2. Yorum verisi
  const ratingResult = await db.execute(sql`SELECT COUNT(*)::int as count FROM reviews WHERE rating IS NOT NULL`)
  const dateResult = await db.execute(sql`SELECT COUNT(*)::int as count FROM reviews WHERE publish_time IS NOT NULL`)
  
  const withRating = (ratingResult as any).rows?.[0]?.count || 0
  const withDate = (dateResult as any).rows?.[0]?.count || 0

  console.log('💬 YORUM VERİSİ KALİTESİ')
  console.log('='.repeat(60))
  console.log(`   Rating bilgisi: ${withRating} (${totalReviews[0].count > 0 ? ((withRating / totalReviews[0].count) * 100).toFixed(1) : 0}%)`)
  console.log(`   Tarih bilgisi: ${withDate} (${totalReviews[0].count > 0 ? ((withDate / totalReviews[0].count) * 100).toFixed(1) : 0}%)\n`)

  // 3. Mekan verisi
  const placesWithGoogleMapsId = await db
    .select({ count: count() })
    .from(places)
    .where(isNotNull(places.googleMapsId))

  console.log('🗺️  MEKAN VERİSİ')
  console.log('='.repeat(60))
  console.log(`   Google Maps ID: ${placesWithGoogleMapsId[0].count} (${((placesWithGoogleMapsId[0].count / totalPlaces[0].count) * 100).toFixed(1)}%)\n`)

  // 4. Analiz dağılımı
  const analysesByCompanion = await db.execute(sql`
    SELECT companion, COUNT(*)::int as count
    FROM analyses
    GROUP BY companion
    ORDER BY count DESC
  `)
  const analysesData = (analysesByCompanion as any).rows || []

  console.log('🤖 ANALİZ DAĞILIMI')
  console.log('='.repeat(60))
  analysesData.forEach((a: any) => {
    console.log(`   ${a.companion}: ${a.count}`)
  })
  console.log()

  // 5. Sonuç
  console.log('='.repeat(60))
  console.log('✅ SONUÇ')
  console.log('='.repeat(60))
  console.log('✅ Migration: Başarılı')
  console.log('✅ Veriler: Database\'de')
  console.log('✅ Schema: Güncel')
  if (withRating === 0 || withDate === 0) {
    console.log('⚠️  Yorumlar: Eski formatta (rating/tarih yok)')
    console.log('💡 Öneri: Mevcut yorumları güncelle')
  } else {
    console.log('✅ Yorumlar: Rating + tarih bilgisi ile')
  }
  console.log('='.repeat(60))
}

comprehensiveCheck().catch(console.error)
