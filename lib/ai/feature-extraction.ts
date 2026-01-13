/**
 * Feature Extraction from Reviews
 * 
 * Yorumlardan mekan özelliklerini çıkarma (atmosphere, petFriendly, wifi, vb.)
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from '@/lib/logging/logger'

export interface ExtractedFeatures {
  atmosphere?: 'quiet' | 'lively' | 'romantic' | 'casual' | 'formal'
  petFriendly?: boolean
  wifi?: boolean
  wheelchairAccessible?: boolean
  kidFriendly?: boolean
  parking?: boolean
  vegetarian?: boolean
  vegan?: boolean
  confidence: number // 0-1 (güven skoru)
}

/**
 * Yorumlardan özellik çıkarımı yap (AI ile)
 */
export async function extractFeaturesFromReviews(
  reviews: string[],
  placeName?: string
): Promise<ExtractedFeatures> {
  if (!reviews || reviews.length === 0) {
    return { confidence: 0 }
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey || apiKey.trim() === '') {
    // API key yoksa basit keyword-based extraction
    return extractFeaturesWithKeywords(reviews)
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // Yorumları örnekle (çok fazla yorum varsa)
    const sampleSize = Math.min(50, reviews.length)
    const sampledReviews = reviews.slice(0, sampleSize)

    const prompt = `Aşağıdaki mekanın yorumlarını analiz et ve mekanın özelliklerini çıkar.

Mekan: ${placeName || 'Bilinmeyen'}

Yorumlar:
${sampledReviews.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Lütfen aşağıdaki özellikleri tespit et ve JSON formatında cevap ver:

1. **atmosphere** (ortam): Yorumlardan ortam tipini belirle
   - "quiet" (sessiz, huzurlu)
   - "lively" (neşeli, canlı)
   - "romantic" (romantik)
   - "casual" (gündelik, rahat)
   - "formal" (resmi, şık)
   - Eğer belirsizse null

2. **petFriendly** (evcil hayvan dostu): Yorumlarda köpek, kedi, pet gibi ifadeler var mı?
   - true: Evet, evcil hayvan kabul ediliyor
   - false: Hayır veya belirtilmemiş

3. **wifi** (WiFi): Yorumlarda WiFi, internet, wifi gibi ifadeler var mı?
   - true: WiFi mevcut
   - false: WiFi yok veya belirtilmemiş

4. **wheelchairAccessible** (tekerlekli sandalye erişimi): Yorumlarda engelli, tekerlekli sandalye, erişim gibi ifadeler var mı?
   - true: Erişilebilir
   - false: Erişilebilir değil veya belirtilmemiş

5. **kidFriendly** (çocuk dostu): Yorumlarda çocuk, aile, çocuk dostu gibi ifadeler var mı?
   - true: Çocuk dostu
   - false: Çocuk dostu değil veya belirtilmemiş

6. **parking** (park yeri): Yorumlarda park, otopark, park yeri gibi ifadeler var mı?
   - true: Park yeri var
   - false: Park yeri yok veya belirtilmemiş

7. **vegetarian** (vejetaryen): Yorumlarda vejetaryen, sebze, bitkisel gibi ifadeler var mı?
   - true: Vejetaryen seçenekler var
   - false: Vejetaryen seçenekler yok veya belirtilmemiş

8. **vegan** (vegan): Yorumlarda vegan, hayvansal ürün yok gibi ifadeler var mı?
   - true: Vegan seçenekler var
   - false: Vegan seçenekler yok veya belirtilmemiş

9. **confidence** (güven skoru): Tespit ettiğin özelliklerin güvenilirliği (0-1 arası)

ÖNEMLİ:
- Sadece yorumlarda açıkça belirtilen özellikleri tespit et
- Belirsizse false veya null döndür
- Güven skorunu yorum sayısına ve ifadelerin netliğine göre belirle

Cevabını şu JSON formatında ver:
{
  "atmosphere": "lively" | null,
  "petFriendly": true | false,
  "wifi": true | false,
  "wheelchairAccessible": true | false,
  "kidFriendly": true | false,
  "parking": true | false,
  "vegetarian": true | false,
  "vegan": true | false,
  "confidence": 0.85
}`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // JSON parse et
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      logger.warn('Failed to parse feature extraction JSON', { text })
      return extractFeaturesWithKeywords(reviews)
    }

    const extracted = JSON.parse(jsonMatch[0]) as ExtractedFeatures
    
    // Confidence'i normalize et (0-1 arası)
    if (extracted.confidence === undefined) {
      extracted.confidence = 0.5 // Varsayılan
    }
    extracted.confidence = Math.max(0, Math.min(1, extracted.confidence))

    return extracted
  } catch (error) {
    logger.error('Feature extraction failed', error instanceof Error ? error : undefined, { placeName })
    // Fallback to keyword-based extraction
    return extractFeaturesWithKeywords(reviews)
  }
}

/**
 * Keyword-based feature extraction (fallback)
 */
function extractFeaturesWithKeywords(reviews: string[]): ExtractedFeatures {
  const allText = reviews.join(' ').toLowerCase()
  
  // Atmosphere keywords
  const quietKeywords = ['sessiz', 'huzurlu', 'sakin', 'sessizlik', 'quiet', 'peaceful', 'calm']
  const livelyKeywords = ['neşeli', 'canlı', 'eğlenceli', 'kalabalık', 'lively', 'energetic', 'fun']
  const romanticKeywords = ['romantik', 'romantic', 'aşk', 'sevgili', 'couple']
  const casualKeywords = ['gündelik', 'rahat', 'casual', 'relaxed', 'informal']
  const formalKeywords = ['resmi', 'şık', 'formal', 'elegant', 'sophisticated']
  
  let atmosphere: ExtractedFeatures['atmosphere'] = undefined
  if (quietKeywords.some(kw => allText.includes(kw))) atmosphere = 'quiet'
  else if (livelyKeywords.some(kw => allText.includes(kw))) atmosphere = 'lively'
  else if (romanticKeywords.some(kw => allText.includes(kw))) atmosphere = 'romantic'
  else if (casualKeywords.some(kw => allText.includes(kw))) atmosphere = 'casual'
  else if (formalKeywords.some(kw => allText.includes(kw))) atmosphere = 'formal'
  
  // Pet friendly
  const petKeywords = ['köpek', 'kedi', 'pet', 'hayvan', 'dog', 'cat', 'pet friendly', 'evcil hayvan']
  const petFriendly = petKeywords.some(kw => allText.includes(kw))
  
  // WiFi
  const wifiKeywords = ['wifi', 'wi-fi', 'internet', 'wireless', 'bağlantı', 'ağ']
  const wifi = wifiKeywords.some(kw => allText.includes(kw))
  
  // Wheelchair accessible
  const wheelchairKeywords = ['tekerlekli sandalye', 'engelli', 'erişim', 'wheelchair', 'accessible', 'disabled']
  const wheelchairAccessible = wheelchairKeywords.some(kw => allText.includes(kw))
  
  // Kid friendly
  const kidKeywords = ['çocuk', 'aile', 'çocuk dostu', 'kid', 'family', 'child', 'children']
  const kidFriendly = kidKeywords.some(kw => allText.includes(kw))
  
  // Parking
  const parkingKeywords = ['park', 'otopark', 'parking', 'park yeri', 'garaj']
  const parking = parkingKeywords.some(kw => allText.includes(kw))
  
  // Vegetarian
  const vegetarianKeywords = ['vejetaryen', 'vegetarian', 'sebze', 'bitkisel', 'vegan olmayan vejetaryen']
  const vegetarian = vegetarianKeywords.some(kw => allText.includes(kw))
  
  // Vegan
  const veganKeywords = ['vegan', 'hayvansal ürün yok', 'bitkisel', 'plant-based']
  const vegan = veganKeywords.some(kw => allText.includes(kw) && !allText.includes('vegan olmayan'))
  
  // Confidence (keyword-based extraction için düşük)
  const confidence = 0.3 // Keyword-based için düşük güven
  
  return {
    atmosphere,
    petFriendly: petFriendly || undefined,
    wifi: wifi || undefined,
    wheelchairAccessible: wheelchairAccessible || undefined,
    kidFriendly: kidFriendly || undefined,
    parking: parking || undefined,
    vegetarian: vegetarian || undefined,
    vegan: vegan || undefined,
    confidence,
  }
}



