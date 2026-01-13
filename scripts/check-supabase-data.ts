#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { places, reviews, analyses } from '../lib/db/schema'
import { sql } from 'drizzle-orm'

async function checkSupabaseData() {
  console.log('🔍 Supabase Veri Durumu Kontrolü\n')

  try {
    // Places sayısı
    const placesCount = await db.select({ count: sql<number>`count(*)` }).from(places)
    console.log(`📊 Toplam Mekan Sayısı: ${placesCount[0].count}`)

    // Reviews sayısı
    const reviewsCount = await db.select({ count: sql<number>`count(*)` }).from(reviews)
    console.log(`💬 Toplam Yorum Sayısı: ${reviewsCount[0].count}`)

    // Analyses sayısı
    const analysesCount = await db.select({ count: sql<number>`count(*)` }).from(analyses)
    console.log(`🤖 Toplam Analiz Sayısı: ${analysesCount[0].count}`)

    // Kategorilere göre mekan dağılımı
    const categoryStats = await db
      .select({
        category: places.category,
        count: sql<number>`count(*)`,
      })
      .from(places)
      .groupBy(places.category)
      .orderBy(sql`count(*) desc`)
      .limit(10)

    console.log('\n📋 Kategorilere Göre Mekan Dağılımı:')
    for (const stat of categoryStats) {
      console.log(`   ${stat.category || 'NULL'}: ${stat.count} mekan`)
    }

    // Yorumu olan mekanlar
    const placesWithReviews = await db
      .select({ count: sql<number>`count(distinct ${places.id})` })
      .from(places)
      .innerJoin(reviews, sql`${reviews.placeId} = ${places.id}`)
    
    console.log(`\n💬 Yorumu Olan Mekanlar: ${placesWithReviews[0].count}`)

    // Analizi olan mekanlar
    const placesWithAnalyses = await db
      .select({ count: sql<number>`count(distinct ${places.id})` })
      .from(places)
      .innerJoin(analyses, sql`${analyses.placeId} = ${places.id}`)
    
    console.log(`🤖 Analizi Olan Mekanlar: ${placesWithAnalyses[0].count}`)

    // Fotoğrafı olan mekanlar
    const placesWithPhotos = await db
      .select({ count: sql<number>`count(*)` })
      .from(places)
      .where(sql`photos IS NOT NULL AND photos != 'null' AND photos != ''`)
    
    console.log(`📸 Fotoğrafı Olan Mekanlar: ${placesWithPhotos[0].count}`)

    // Son sync tarihleri
    const lastSync = await db
      .select({
        lastScrapedAt: sql<Date>`max(${places.lastScrapedAt})`,
      })
      .from(places)
    
    console.log(`\n🕐 Son Sync Tarihi: ${lastSync[0].lastScrapedAt || 'Hiç sync yapılmamış'}`)

    // Örnek mekanlar
    const samplePlaces = await db
      .select({
        id: places.id,
        name: places.name,
        category: places.category,
        reviewCount: places.reviewCount,
        rating: places.rating,
      })
      .from(places)
      .limit(5)

    console.log('\n📋 Örnek Mekanlar:')
    for (const place of samplePlaces) {
      console.log(`   - ${place.name} (${place.category || 'N/A'}) - ${place.reviewCount || 0} yorum, ${place.rating || 'N/A'} ⭐`)
    }

    console.log('\n✅ Supabase veri kontrolü tamamlandı!')

  } catch (error) {
    console.error('❌ Hata:', error)
    if (error instanceof Error) {
      console.error('   Mesaj:', error.message)
      console.error('   Stack:', error.stack)
    }
    process.exit(1)
  }
}

checkSupabaseData().catch(console.error)
