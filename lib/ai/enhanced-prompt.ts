/**
 * Gelişmiş AI Prompt Oluşturma
 * 
 * Daha profesyonel ve kapsamlı analiz için prompt builder
 */

export interface AnalysisFactors {
  companion: 'alone' | 'partner' | 'friends' | 'family' | 'colleagues'
  budget?: 'budget' | 'moderate' | 'premium' | 'any'
  atmosphere?: 'quiet' | 'lively' | 'romantic' | 'casual' | 'formal'
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'brunch' | 'late-night'
  specialNeeds?: {
    wheelchair?: boolean
    petFriendly?: boolean
    kidFriendly?: boolean
    parking?: boolean
    wifi?: boolean
  }
  priceLevel?: 0 | 1 | 2 | 3 | 4
  cuisineType?: string
}

/**
 * Gelişmiş prompt oluştur
 */
export function buildEnhancedPrompt(
  places: Array<{
    name: string
    address: string
    rating?: number
    reviewCount?: number
    reviews: string[]
    priceLevel?: 0 | 1 | 2 | 3 | 4
    cuisineType?: string
  }>,
  category: string,
  factors: AnalysisFactors
): string {
  const factorsText = buildFactorsText(factors)
  const priceContext = buildPriceContext(factors.priceLevel)
  const cuisineContext = factors.cuisineType ? `\n- Kültür tercihi: ${factors.cuisineType}` : ''

  return `Sen bir mekan öneri uzmanısın. Kullanıcıların yanlış yer seçme korkusunu ortadan kaldırmak için çalışıyorsun.

Kullanıcı bilgileri:
- Ne arıyor: ${category}
${factorsText}${cuisineContext}${priceContext}

Aşağıdaki mekanların yorumlarını analiz et ve her biri için:
1. 0-100 arası bir uygunluk skoru ver (kullanıcının durumuna göre)
2. Neden uygun olduğunu kısa bir cümleyle açıkla
3. Hangi durumda pişman olabileceğini belirt (varsa)
4. Yorumları şu kategorilere göre analiz et:
   - servis: Müşteri hizmeti, personel davranışı
   - fiyat: Fiyat-performans, uygunluk, ortalama harcama
   - kalite: Ürün/hizmet kalitesi
   - ortam: Atmosfer, dekor, ambiyans
   - lokasyon: Ulaşım, park, konum
   - temizlik: Hijyen, düzen
   - hız: Servis hızı, bekleme süresi

Her kategori için:
- 0-100 arası skor ver
- Pozitif yorum oranını hesapla (0-1 arası)
- 1-2 pozitif örnek yorum seç
- 1-2 negatif örnek yorum seç (varsa)

ÖZEL ANALİZ:
- Fiyat bilgisi: Yorumlarda geçen fiyat bilgilerini çıkar (örn: "çay 15 TL", "dürüm 80 TL")
- Kültür tespiti: Yorumlardan yemek kültürü bilgisi çıkar (Türk, İtalyan, Çin, vb.)
- Ortam analizi: Ortamın sessiz/neşeli/romantik olup olmadığını değerlendir
- Özel ihtiyaçlar: Tekerlekli sandalye erişimi, çocuk dostu, park yeri, WiFi gibi özellikleri değerlendir

ÖNEMLİ:
- "En iyi" demek yok
- "5 yıldız" demek yok
- Sadece "bu kullanıcı için uygun mu, değil mi" değerlendirmesi yap
- Tüm faktörleri dikkate al
- Her mekan için JSON formatında cevap ver

Mekanlar ve yorumları:
${places
  .map(
    (place, idx) => {
      const priceInfo = place.priceLevel !== undefined 
        ? `Fiyat seviyesi: ${['Ücretsiz', 'Ucuz', 'Orta', 'Pahalı', 'Çok Pahalı'][place.priceLevel]}`
        : ''
      const cuisineInfo = place.cuisineType 
        ? `Kültür: ${place.cuisineType}`
        : ''
      
      return `
${idx + 1}. ${place.name}
   Adres: ${place.address}
   Puan: ${place.rating || 'Yok'}
   Toplam Yorum: ${place.reviews.length}
   ${priceInfo}
   ${cuisineInfo}
   Yorumlar:
   ${place.reviews.length > 0 ? place.reviews.join('\n   ') : 'Yorum yok'}
`
    }
  )
  .join('\n')}

Cevabını şu JSON formatında ver (her mekan için):
{
  "places": [
    {
      "name": "Mekan adı",
      "score": 85,
      "why": "Neden uygun olduğu (kısa cümle)",
      "risks": "Hangi durumda pişman olabilir (varsa, yoksa boş string)",
      "extractedPrices": [
        {
          "item": "çay",
          "price": 15,
          "currency": "TL"
        }
      ],
      "detectedCuisine": "turkish",
      "atmosphere": "lively",
      "reviewCategories": [
        {
          "name": "servis",
          "score": 80,
          "positiveRatio": 0.75,
          "positiveExamples": ["Örnek pozitif yorum 1", "Örnek pozitif yorum 2"],
          "negativeExamples": ["Örnek negatif yorum 1"]
        }
      ]
    }
  ]
}`
}

/**
 * Faktörler metnini oluştur
 */
function buildFactorsText(factors: AnalysisFactors): string {
  const parts: string[] = []
  
  parts.push(`- Kiminle: ${factors.companion}`)
  
  if (factors.budget && factors.budget !== 'any') {
    const budgetText = {
      budget: 'Bütçe dostu',
      moderate: 'Orta seviye',
      premium: 'Premium',
    }[factors.budget]
    parts.push(`- Bütçe: ${budgetText}`)
  }
  
  if (factors.atmosphere) {
    const atmosphereText = {
      quiet: 'Sessiz/Huzurlu',
      lively: 'Neşeli/Canlı',
      romantic: 'Romantik',
      casual: 'Gündelik',
      formal: 'Resmi',
    }[factors.atmosphere]
    parts.push(`- Ortam tercihi: ${atmosphereText}`)
  }
  
  if (factors.mealType) {
    const mealText = {
      breakfast: 'Kahvaltı',
      lunch: 'Öğle yemeği',
      dinner: 'Akşam yemeği',
      brunch: 'Brunch',
      'late-night': 'Gece',
    }[factors.mealType]
    parts.push(`- Zaman: ${mealText}`)
  }
  
  if (factors.specialNeeds) {
    const needs: string[] = []
    if (factors.specialNeeds.wheelchair) needs.push('Tekerlekli sandalye erişimi')
    if (factors.specialNeeds.petFriendly) needs.push('Evcil hayvan dostu')
    if (factors.specialNeeds.kidFriendly) needs.push('Çocuk dostu')
    if (factors.specialNeeds.parking) needs.push('Park yeri')
    if (factors.specialNeeds.wifi) needs.push('WiFi')
    
    if (needs.length > 0) {
      parts.push(`- Özel ihtiyaçlar: ${needs.join(', ')}`)
    }
  }
  
  return parts.join('\n')
}

/**
 * Fiyat bağlamı oluştur
 */
function buildPriceContext(priceLevel?: 0 | 1 | 2 | 3 | 4): string {
  if (priceLevel === undefined) return ''
  
  const levelText = ['Ücretsiz', 'Ucuz', 'Orta', 'Pahalı', 'Çok Pahalı'][priceLevel]
  return `\n- Fiyat seviyesi tercihi: ${levelText}`
}



