/**
 * Database Indexes Creation Script
 * 
 * Query performansını artırmak için index'ler oluşturur
 */

import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'database.sqlite')
const db = new Database(dbPath)

console.log('🔄 Creating database indexes...')

try {
  // Places tablosu index'leri
  const indexes = [
    // Koordinat bazlı arama için
    'CREATE INDEX IF NOT EXISTS idx_places_location ON places(lat, lng)',
    
    // Category bazlı arama için
    'CREATE INDEX IF NOT EXISTS idx_places_category ON places(category)',
    
    // Google Maps ID lookup için (zaten unique constraint var ama index ekstra hız sağlar)
    'CREATE INDEX IF NOT EXISTS idx_places_google_maps_id ON places(google_maps_id)',
    
    // Rating bazlı sıralama için
    'CREATE INDEX IF NOT EXISTS idx_places_rating ON places(rating DESC)',
    
    // Review count bazlı sıralama için
    'CREATE INDEX IF NOT EXISTS idx_places_review_count ON places(review_count DESC)',
    
    // Updated at bazlı sorgular için
    'CREATE INDEX IF NOT EXISTS idx_places_updated_at ON places(updated_at DESC)',
    
    // Reviews tablosu index'leri
    'CREATE INDEX IF NOT EXISTS idx_reviews_place_id ON reviews(place_id)',
    'CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)',
    'CREATE INDEX IF NOT EXISTS idx_reviews_date ON reviews(date DESC)',
    
    // Analyses tablosu index'leri
    'CREATE INDEX IF NOT EXISTS idx_analyses_place_id ON analyses(place_id)',
    'CREATE INDEX IF NOT EXISTS idx_analyses_category_companion ON analyses(category, companion)',
    'CREATE INDEX IF NOT EXISTS idx_analyses_score ON analyses(score DESC)',
    'CREATE INDEX IF NOT EXISTS idx_analyses_updated_at ON analyses(updated_at DESC)',
    
    // Composite index'ler (sık kullanılan sorgular için)
    'CREATE INDEX IF NOT EXISTS idx_places_category_location ON places(category, lat, lng)',
    'CREATE INDEX IF NOT EXISTS idx_analyses_place_category_companion ON analyses(place_id, category, companion)',
  ]

  let successCount = 0
  let skipCount = 0

  for (const indexSql of indexes) {
    try {
      db.exec(indexSql)
      successCount++
      const indexName = indexSql.match(/idx_\w+/)?.[0] || 'index'
      console.log(`✅ ${indexName} created`)
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        skipCount++
        console.log(`⏭️  Index already exists, skipping...`)
      } else {
        console.error(`❌ Error: ${error.message}`)
        throw error
      }
    }
  }

  console.log('')
  console.log(`✅ Index creation completed!`)
  console.log(`   - Created: ${successCount} indexes`)
  console.log(`   - Skipped (already exists): ${skipCount} indexes`)
  console.log(`   - Total: ${indexes.length} indexes`)
  
  // Index kullanım istatistikleri
  console.log('')
  console.log('📊 Index usage statistics:')
  const stats = db.prepare(`
    SELECT name, tbl_name 
    FROM sqlite_master 
    WHERE type='index' AND name LIKE 'idx_%'
    ORDER BY name
  `).all() as Array<{ name: string; tbl_name: string }>
  
  stats.forEach(stat => {
    console.log(`   - ${stat.name} on ${stat.tbl_name}`)
  })
  
} catch (error) {
  console.error('❌ Index creation failed:', error)
  process.exit(1)
} finally {
  db.close()
}



