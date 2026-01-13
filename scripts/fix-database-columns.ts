#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { sql } from 'drizzle-orm'

async function fixDatabaseColumns() {
  console.log('🔧 Database kolonlarını düzeltiyor...\n')

  try {
    // ev_charging_options kolonunu kontrol et ve kaldır
    const checkEvCharging = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'places' AND column_name = 'ev_charging_options'
    `)
    
    if ((checkEvCharging as any).rows?.length > 0 || (checkEvCharging as any).length > 0) {
      console.log('   ➖ ev_charging_options kolonu kaldırılıyor...')
      await db.execute(sql`ALTER TABLE places DROP COLUMN IF EXISTS ev_charging_options`)
      console.log('   ✅ ev_charging_options kolonu kaldırıldı')
    } else {
      console.log('   ℹ️  ev_charging_options kolonu zaten yok')
    }

    // fuel_options kolonunu kontrol et ve kaldır
    const checkFuel = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'places' AND column_name = 'fuel_options'
    `)
    
    if ((checkFuel as any).rows?.length > 0 || (checkFuel as any).length > 0) {
      console.log('   ➖ fuel_options kolonu kaldırılıyor...')
      await db.execute(sql`ALTER TABLE places DROP COLUMN IF EXISTS fuel_options`)
      console.log('   ✅ fuel_options kolonu kaldırıldı')
    } else {
      console.log('   ℹ️  fuel_options kolonu zaten yok')
    }

    // indoor_options kolonunu kontrol et ve kaldır
    const checkIndoor = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'places' AND column_name = 'indoor_options'
    `)
    
    if ((checkIndoor as any).rows?.length > 0 || (checkIndoor as any).length > 0) {
      console.log('   ➖ indoor_options kolonu kaldırılıyor...')
      await db.execute(sql`ALTER TABLE places DROP COLUMN IF EXISTS indoor_options`)
      console.log('   ✅ indoor_options kolonu kaldırıldı')
    } else {
      console.log('   ℹ️  indoor_options kolonu zaten yok')
    }

    console.log('\n✅ Database kolonları düzeltildi!')
  } catch (error) {
    console.error('❌ Hata:', error)
    process.exit(1)
  }
}

fixDatabaseColumns().catch(console.error)
