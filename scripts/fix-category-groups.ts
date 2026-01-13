#!/usr/bin/env tsx

/**
 * Database'deki mevcut kayıtların categoryGroup değerlerini düzelt
 * 
 * Bu script:
 * 1. Tüm places kayıtlarını alır
 * 2. Her kayıt için category değerine göre categoryGroup bulur
 * 3. categoryGroup NULL olan kayıtları günceller
 */

// Environment variables'ı yükle (import'lardan ÖNCE!)
import { config } from 'dotenv'
import { resolve } from 'path'
const envResult = config({ path: resolve(process.cwd(), '.env.local') })

if (envResult.error) {
  console.error('❌ .env.local dosyası yüklenemedi:', envResult.error)
  process.exit(1)
}

// DATABASE_URL kontrolü
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable bulunamadı!')
  console.error('   .env.local dosyasında DATABASE_URL tanımlı olduğundan emin olun.')
  process.exit(1)
}

import { db } from '../lib/db'
import { places } from '../lib/db/schema'
import { getCategoryGroupForPlaceType } from '../lib/config/google-maps-category-groups'
import { eq, sql, isNull } from 'drizzle-orm'

async function fixCategoryGroups() {
  console.log('🔄 Category Group düzeltme işlemi başlatılıyor...\n')

  try {
    // 1. Tüm places kayıtlarını al (categoryGroup NULL olanlar)
    const placesToFix = await db
      .select({
        id: places.id,
        name: places.name,
        category: places.category,
        categoryGroup: places.categoryGroup,
      })
      .from(places)
      .where(
        sql`${places.categoryGroup} IS NULL AND ${places.category} IS NOT NULL`
      )

    console.log(`📊 Toplam ${placesToFix.length} kayıt bulundu (categoryGroup NULL)\n`)

    if (placesToFix.length === 0) {
      console.log('✅ Tüm kayıtlar zaten categoryGroup değerine sahip!')
      return
    }

    // 2. Her kayıt için categoryGroup bul ve güncelle
    let updated = 0
    let notFound = 0
    const notFoundCategories: Set<string> = new Set()

    for (const place of placesToFix) {
      if (!place.category) {
        continue
      }

      const categoryGroup = getCategoryGroupForPlaceType(place.category)

      if (categoryGroup) {
        await db
          .update(places)
          .set({ categoryGroup })
          .where(eq(places.id, place.id))

        updated++
        if (updated % 10 === 0) {
          console.log(`   ✅ ${updated} kayıt güncellendi...`)
        }
      } else {
        notFound++
        notFoundCategories.add(place.category)
        console.log(`   ⚠️  ${place.name}: category "${place.category}" için categoryGroup bulunamadı`)
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 ÖZET:')
    console.log(`   ✅ Güncellenen: ${updated} kayıt`)
    console.log(`   ⚠️  CategoryGroup bulunamayan: ${notFound} kayıt`)

    if (notFoundCategories.size > 0) {
      console.log(`\n   ⚠️  CategoryGroup bulunamayan kategoriler:`)
      notFoundCategories.forEach(cat => {
        console.log(`      - ${cat}`)
      })
      console.log(`\n   💡 Bu kategoriler için google-maps-category-groups.ts dosyasına mapping eklenmeli!`)
    }

    console.log('\n✅ İşlem tamamlandı!')
  } catch (error) {
    console.error('❌ Hata:', error)
    process.exit(1)
  }
}

fixCategoryGroups()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })



