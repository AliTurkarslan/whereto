#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { getFirstPhotoUrl, extractPhotoReference } from '../lib/google-apis/places-photo'

// Test photo name (database'den alınan format)
const testPhotoName = "places/ChIJ5REgoq050xQR-GjNBgzRAPA/photos/AZLasHqUCP66PRaZrjbJCJatc47c_jd0swI1aA4Q4jlTTfUoGfNLDdZHonVpLcb2TiPRzT1W8vHvyHA9dusBrvyl91D81h6UCUBqobnfWl0HLLMe8s20wzmbWtB9imiMI_Q1Ovq2X3lEzkqSCSFIXYNBOgHzSvuYr_kR3a-9cTH6AjpwzcqkVNdPLlMn7dm-muPy_lkdS4EX5UnfvMmcVrL3FsuPy5KJsLuA7_YVzoUaLVaAT4vP6oG-0cUWF5AZIKgUdv5SlTvw3hqP2vcNwDlR96BySBDM5Gk8s5VszIeFw8Y_9A"

const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

console.log('🔍 Photo URL testi...\n')
console.log('Photo Name:', testPhotoName)
console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'YOK!')

const photoRef = extractPhotoReference(testPhotoName)
console.log('\n📸 Extracted Photo Reference:', photoRef)

if (photoRef && apiKey) {
  const photoUrl = getFirstPhotoUrl([{ name: testPhotoName }], apiKey, 600)
  console.log('\n✅ Photo URL:', photoUrl)
  console.log('\n🌐 Test URL (tarayıcıda açabilirsiniz):')
  console.log(photoUrl)
} else {
  console.log('\n❌ Photo reference veya API key eksik!')
}
