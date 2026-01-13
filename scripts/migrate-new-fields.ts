/**
 * Database Migration Script
 * 
 * Place tablosuna yeni alanlar ekler:
 * - phone
 * - website
 * - opening_hours
 * - photos
 * - editorial_summary
 * - business_status
 * - plus_code
 * - price_level
 */

import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'database.sqlite')
const db = new Database(dbPath)

console.log('🔄 Database migration başlatılıyor...\n')

try {
  // Yeni alanları ekle (eğer yoksa)
  const newFields = [
    { name: 'phone', type: 'TEXT' },
    { name: 'website', type: 'TEXT' },
    { name: 'opening_hours', type: 'TEXT' },
    { name: 'photos', type: 'TEXT' },
    { name: 'editorial_summary', type: 'TEXT' },
    { name: 'business_status', type: 'TEXT' },
    { name: 'plus_code', type: 'TEXT' },
    { name: 'price_level', type: 'TEXT' },
  ]

  for (const field of newFields) {
    try {
      // Alan zaten var mı kontrol et
      const tableInfo = db.prepare(`PRAGMA table_info(places)`).all() as Array<{ name: string }>
      const fieldExists = tableInfo.some(col => col.name === field.name)

      if (!fieldExists) {
        db.prepare(`ALTER TABLE places ADD COLUMN ${field.name} ${field.type}`).run()
        console.log(`✅ ${field.name} alanı eklendi`)
      } else {
        console.log(`⏭️  ${field.name} alanı zaten mevcut`)
      }
    } catch (error: any) {
      if (error.message.includes('duplicate column')) {
        console.log(`⏭️  ${field.name} alanı zaten mevcut`)
      } else {
        console.error(`❌ ${field.name} alanı eklenirken hata:`, error.message)
      }
    }
  }

  console.log('\n✅ Migration tamamlandı!')
  
  // Tablo yapısını göster
  console.log('\n📊 Güncel tablo yapısı:')
  const tableInfo = db.prepare(`PRAGMA table_info(places)`).all()
  tableInfo.forEach((col: any) => {
    console.log(`   - ${col.name} (${col.type})`)
  })
  
} catch (error: any) {
  console.error('❌ Migration hatası:', error.message)
  process.exit(1)
} finally {
  db.close()
}



