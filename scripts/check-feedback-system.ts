#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { feedback } from '../lib/db/schema'
import { sql } from 'drizzle-orm'

async function checkFeedbackSystem() {
  console.log('🔍 Geri Bildirim Sistemi Kontrolü\n')

  try {
    // 1. Feedback tablosu var mı?
    const feedbackCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(feedback)
    
    console.log(`✅ Feedback tablosu mevcut`)
    console.log(`📊 Toplam geri bildirim: ${feedbackCount[0].count}`)

    if (feedbackCount[0].count > 0) {
      // 2. Son geri bildirimler
      const recentFeedback = await db
        .select()
        .from(feedback)
        .orderBy(sql`${feedback.createdAt} DESC`)
        .limit(5)

      console.log('\n📝 Son 5 Geri Bildirim:')
      recentFeedback.forEach((fb, i) => {
        console.log(`   ${i + 1}. Rating: ${fb.rating}⭐ | Kategori: ${fb.category} | ${fb.createdAt ? new Date(fb.createdAt).toLocaleString('tr-TR') : 'N/A'}`)
      })

      // 3. İstatistikler
      const stats = await db
        .select({
          avgRating: sql<number>`avg(rating)`,
          categoryCount: sql<number>`count(distinct category)`,
        })
        .from(feedback)

      console.log(`\n📊 Ortalama Rating: ${stats[0].avgRating ? stats[0].avgRating.toFixed(1) : 'N/A'}`)
      console.log(`📊 Kategori Sayısı: ${stats[0].categoryCount}`)
    }

    // 4. FEEDBACK_SECRET kontrolü
    const feedbackSecret = process.env.FEEDBACK_SECRET
    if (feedbackSecret) {
      console.log(`\n🔑 FEEDBACK_SECRET: ${feedbackSecret.substring(0, 5)}... (ayarlanmış)`)
    } else {
      console.log(`\n⚠️  FEEDBACK_SECRET ayarlanmamış (opsiyonel, admin erişimi için)`)
    }

    console.log('\n✅ Geri bildirim sistemi hazır!')
    console.log('\n📋 Test Kullanıcıları İçin:')
    console.log('   1. Uygulamayı açın')
    console.log('   2. Sağ alt köşedeki "Geri Bildirim" butonuna tıklayın')
    console.log('   3. Formu doldurup gönderin')
    console.log('\n📊 Geri Bildirimleri Görüntüleme:')
    console.log('   npm run feedback:view')

  } catch (error) {
    if (error instanceof Error && error.message.includes('does not exist')) {
      console.error('❌ Feedback tablosu bulunamadı!')
      console.log('\n🔧 Migration yapılması gerekiyor:')
      console.log('   npm run db:migrate-feedback')
    } else {
      console.error('❌ Hata:', error)
      process.exit(1)
    }
  }
}

checkFeedbackSystem().catch(console.error)
