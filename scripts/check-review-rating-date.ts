#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { sql } from 'drizzle-orm'

async function checkReviewRatingDate() {
  console.log('🔍 Yorum Rating ve Tarih Bilgisi Kontrolü...\n')

  // Toplam yorum
  const totalResult = await db.execute(sql`SELECT COUNT(*)::int as count FROM reviews`)
  const total = (totalResult as any).rows?.[0]?.count || (totalResult as any)[0]?.count || 0

  // Rating bilgisi olan
  const ratingResult = await db.execute(sql`SELECT COUNT(*)::int as count FROM reviews WHERE rating IS NOT NULL`)
  const withRating = (ratingResult as any).rows?.[0]?.count || (ratingResult as any)[0]?.count || 0

  // Tarih bilgisi olan
  const dateResult = await db.execute(sql`SELECT COUNT(*)::int as count FROM reviews WHERE publish_time IS NOT NULL`)
  const withDate = (dateResult as any).rows?.[0]?.count || (dateResult as any)[0]?.count || 0

  // Relative time bilgisi olan
  const relativeResult = await db.execute(sql`SELECT COUNT(*)::int as count FROM reviews WHERE relative_publish_time_description IS NOT NULL`)
  const withRelative = (relativeResult as any).rows?.[0]?.count || (relativeResult as any)[0]?.count || 0

  console.log('📊 Yorum Verisi:')
  console.log(`   Toplam: ${total}`)
  console.log(`   Rating bilgisi olan: ${withRating} (${total > 0 ? ((withRating / total) * 100).toFixed(1) : 0}%)`)
  console.log(`   Tarih bilgisi olan: ${withDate} (${total > 0 ? ((withDate / total) * 100).toFixed(1) : 0}%)`)
  console.log(`   Relative time bilgisi olan: ${withRelative} (${total > 0 ? ((withRelative / total) * 100).toFixed(1) : 0}%)\n`)

  // Örnek yorumlar
  const sampleResult = await db.execute(sql`
    SELECT r.*, p.name as place_name
    FROM reviews r
    JOIN places p ON r.place_id = p.id
    WHERE r.rating IS NOT NULL OR r.publish_time IS NOT NULL
    ORDER BY r.id DESC
    LIMIT 10
  `)
  const samples = (sampleResult as any).rows || (sampleResult as any) || []

  console.log('📋 Örnek Yorumlar:')
  samples.forEach((r: any, idx: number) => {
    console.log(`   ${idx + 1}. ${r.place_name}:`)
    console.log(`      Text: ${r.text.substring(0, 50)}...`)
    console.log(`      Rating: ${r.rating || 'Yok'}`)
    console.log(`      publishTime: ${r.publish_time ? new Date(r.publish_time).toLocaleDateString('tr-TR') : 'Yok'}`)
    console.log(`      Relative: ${r.relative_publish_time_description || 'Yok'}`)
    console.log()
  })

  console.log('✅ Kontrol tamamlandı!')
}

checkReviewRatingDate().catch(console.error)
