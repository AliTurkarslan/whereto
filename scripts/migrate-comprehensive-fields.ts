/**
 * Comprehensive Fields Migration Script
 * 
 * Google Places API'den alınan tüm yeni alanları database'e ekler
 */

import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'database.sqlite')
const db = new Database(dbPath)

console.log('🔄 Starting comprehensive fields migration...')

try {
  // Yeni alanları ekle (IF NOT EXISTS ile güvenli)
  const migrations = [
    // Temel alanlar
    `ALTER TABLE places ADD COLUMN short_formatted_address TEXT`,
    `ALTER TABLE places ADD COLUMN address_components TEXT`,
    `ALTER TABLE places ADD COLUMN viewport TEXT`,
    `ALTER TABLE places ADD COLUMN primary_type TEXT`,
    `ALTER TABLE places ADD COLUMN primary_type_display_name TEXT`,
    `ALTER TABLE places ADD COLUMN icon_background_color TEXT`,
    `ALTER TABLE places ADD COLUMN icon_mask_base_uri TEXT`,
    `ALTER TABLE places ADD COLUMN utc_offset TEXT`,
    
    // Accessibility ve özellikler
    `ALTER TABLE places ADD COLUMN accessibility_options TEXT`,
    `ALTER TABLE places ADD COLUMN ev_charging_options TEXT`,
    `ALTER TABLE places ADD COLUMN fuel_options TEXT`,
    `ALTER TABLE places ADD COLUMN good_for_children INTEGER`,
    `ALTER TABLE places ADD COLUMN good_for_groups INTEGER`,
    `ALTER TABLE places ADD COLUMN good_for_watching_sports INTEGER`,
    `ALTER TABLE places ADD COLUMN indoor_options TEXT`,
    `ALTER TABLE places ADD COLUMN live_music INTEGER`,
    `ALTER TABLE places ADD COLUMN menu_for_children INTEGER`,
    `ALTER TABLE places ADD COLUMN outdoor_seating INTEGER`,
    `ALTER TABLE places ADD COLUMN parking_options TEXT`,
    `ALTER TABLE places ADD COLUMN payment_options TEXT`,
    `ALTER TABLE places ADD COLUMN reservable INTEGER`,
    `ALTER TABLE places ADD COLUMN restroom INTEGER`,
    
    // Yemek ve içecek seçenekleri
    `ALTER TABLE places ADD COLUMN serves_breakfast INTEGER`,
    `ALTER TABLE places ADD COLUMN serves_brunch INTEGER`,
    `ALTER TABLE places ADD COLUMN serves_dinner INTEGER`,
    `ALTER TABLE places ADD COLUMN serves_lunch INTEGER`,
    `ALTER TABLE places ADD COLUMN serves_beer INTEGER`,
    `ALTER TABLE places ADD COLUMN serves_wine INTEGER`,
    `ALTER TABLE places ADD COLUMN serves_cocktails INTEGER`,
    `ALTER TABLE places ADD COLUMN serves_vegetarian_food INTEGER`,
    
    // Hizmet seçenekleri
    `ALTER TABLE places ADD COLUMN takeout INTEGER`,
    `ALTER TABLE places ADD COLUMN delivery INTEGER`,
    `ALTER TABLE places ADD COLUMN dine_in INTEGER`,
    `ALTER TABLE places ADD COLUMN sub_destinations TEXT`,
    `ALTER TABLE places ADD COLUMN current_secondary_opening_hours TEXT`,
  ]

  let successCount = 0
  let skipCount = 0

  for (const migration of migrations) {
    try {
      db.exec(migration)
      successCount++
      console.log(`✅ ${migration.split('ADD COLUMN ')[1]?.split(' ')[0] || 'Column'} added`)
    } catch (error: any) {
      // Column already exists hatası normal, devam et
      if (error.message?.includes('duplicate column') || error.message?.includes('already exists')) {
        skipCount++
        console.log(`⏭️  Column already exists, skipping...`)
      } else {
        console.error(`❌ Error: ${error.message}`)
        throw error
      }
    }
  }

  console.log('')
  console.log(`✅ Migration completed!`)
  console.log(`   - Added: ${successCount} columns`)
  console.log(`   - Skipped (already exists): ${skipCount} columns`)
  console.log(`   - Total: ${migrations.length} columns`)
  
} catch (error) {
  console.error('❌ Migration failed:', error)
  process.exit(1)
} finally {
  db.close()
}



