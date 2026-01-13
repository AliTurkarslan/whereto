#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { getPlacePhotoUrl, extractPhotoReference } from '../lib/google-apis/places-photo'

async function testPhotoAPI() {
  console.log('🧪 Google Places Photo API Testi\n')

  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.error('❌ API key bulunamadı!')
    process.exit(1)
  }

  console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...`)

  // Test photo reference (database'den alınan örnek)
  const testPhotoName = 'places/ChIJ5REgoq050xQR-GjNBgzRAPA/photos/AZLasHqUCP66PRaZrjbJCJatc47c_jd0swI1aA4Q4jlTTfUoGfNLDdZHonVpLcb2TiPRzT1W8vHvyHA9dusBrvyl91D81h6UCUBqobnfWl0HLLMe8s20wzmbWtB9imiMI_Q1Ovq2X3lEzkqSCSFIXYNBOgHzSvuYr_kR3a-9cTH6AjpwzcqkVNdPLlMn7dm-muPy_lkdS4EX5UnfvMmcVrL3FsuPy5KJsLuA7_YVzoUaLVaAT4vP6oG-0cUWF5AZIKgUdv5SlTvw3hqP2vcNwDlR96BySBDM5Gk8s5VszIeFw8Y_9A'
  
  console.log('\n📸 Test Photo Name:')
  console.log(`   ${testPhotoName.substring(0, 100)}...`)

  // Photo reference extract et
  const photoRef = extractPhotoReference(testPhotoName)
  console.log(`\n🔍 Extracted Photo Reference:`)
  console.log(`   ${photoRef ? photoRef.substring(0, 50) + '...' : 'NULL'}`)

  if (!photoRef) {
    console.error('❌ Photo reference extract edilemedi!')
    process.exit(1)
  }

  // Photo URL oluştur
  const photoUrl = getPlacePhotoUrl(photoRef, apiKey, 600)
  console.log(`\n🌐 Photo URL:`)
  console.log(`   ${photoUrl.substring(0, 150)}...`)

  // URL'i test et
  console.log('\n🔍 URL Testi yapılıyor...')
  try {
    const response = await fetch(photoUrl, { method: 'HEAD' })
    console.log(`\n📊 Response Status: ${response.status}`)
    console.log(`📊 Response Headers:`)
    response.headers.forEach((value, key) => {
      if (key.toLowerCase().includes('error') || key.toLowerCase().includes('x-') || key.toLowerCase().includes('content-type')) {
        console.log(`   ${key}: ${value}`)
      }
    })

    if (response.ok) {
      console.log('\n✅ Photo URL çalışıyor!')
    } else {
      const text = await response.text().catch(() => '')
      console.log(`\n❌ Photo URL hatası: ${response.status}`)
      if (text) {
        console.log(`   Error: ${text.substring(0, 200)}`)
      }
    }
  } catch (error) {
    console.error(`\n❌ Fetch hatası:`, error instanceof Error ? error.message : String(error))
  }
}

testPhotoAPI().catch(console.error)
