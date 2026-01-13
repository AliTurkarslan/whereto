import puppeteer, { Browser } from 'puppeteer'

export interface PlaceData {
  name: string
  address: string
  rating?: number
  reviewCount?: number
  lat?: number
  lng?: number
  reviews?: string[]
  category?: string
  placeId?: string // Google Places API Place ID
  // Yeni alanlar
  phone?: string
  website?: string
  openingHours?: {
    weekdayDescriptions?: string[]
    openNow?: boolean
  }
  photos?: Array<{
    name: string
    widthPx?: number
    heightPx?: number
  }>
  editorialSummary?: string
  businessStatus?: string
  priceLevel?: string
  plusCode?: string
  // Kapsamlı Google Places API alanları
  shortFormattedAddress?: string
  addressComponents?: Array<{
    longText: string
    shortText: string
    types: string[]
    languageCode?: string
  }>
  viewport?: {
    low: { latitude: number; longitude: number }
    high: { latitude: number; longitude: number }
  }
  primaryType?: string
  primaryTypeDisplayName?: string
  iconBackgroundColor?: string
  iconMaskBaseUri?: string
  utcOffset?: string
  // Accessibility ve özellikler
  accessibilityOptions?: {
    wheelchairAccessibleParking?: boolean
    wheelchairAccessibleEntrance?: boolean
    wheelchairAccessibleRestroom?: boolean
    wheelchairAccessibleSeating?: boolean
  }
  // evChargingOptions ve fuelOptions field mask'tan kaldırıldı (sadece belirli place type'lar için mevcut)
  goodForChildren?: boolean
  goodForGroups?: boolean
  goodForWatchingSports?: boolean
  indoorOptions?: {
    indoorSeating?: boolean
    indoorOutdoorSeating?: boolean
  }
  liveMusic?: boolean
  menuForChildren?: boolean
  outdoorSeating?: boolean
  parkingOptions?: {
    parkingLot?: boolean
    parkingGarage?: boolean
    streetParking?: boolean
    valetParking?: boolean
    freeGarageParking?: boolean
    freeParkingLot?: boolean
    paidParkingLot?: boolean
    paidParkingGarage?: boolean
    paidStreetParking?: boolean
    valetParkingAvailable?: boolean
  }
  paymentOptions?: {
    acceptsCreditCards?: boolean
    acceptsDebitCards?: boolean
    acceptsCashOnly?: boolean
    acceptsNfc?: boolean
  }
  reservable?: boolean
  restroom?: boolean
  // Yemek ve içecek seçenekleri
  servesBreakfast?: boolean
  servesBrunch?: boolean
  servesDinner?: boolean
  servesLunch?: boolean
  servesBeer?: boolean
  servesWine?: boolean
  servesCocktails?: boolean
  servesVegetarianFood?: boolean
  // Hizmet seçenekleri
  takeout?: boolean
  delivery?: boolean
  dineIn?: boolean
  subDestinations?: Array<{
    id: string
    displayName: string
  }>
  currentSecondaryOpeningHours?: Array<{
    weekdayDescriptions?: string[]
    openNow?: boolean
  }>
}

export interface ScrapeOptions {
  query: string
  location: { lat: number; lng: number }
  maxResults?: number
}

// Basit cache mekanizması (production'da Redis kullanılabilir)
const cache = new Map<string, { data: PlaceData[]; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 saat

export async function scrapeGoogleMaps(options: ScrapeOptions): Promise<PlaceData[]> {
  const { query, location, maxResults = 10 } = options
  
  // Cache kontrolü
  const cacheKey = `${query}-${location.lat}-${location.lng}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  // MVP için mock data fallback (scraping başarısız olursa)
  const mockData: PlaceData[] = [
    {
      name: 'Örnek Restoran',
      address: `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)} yakınında`,
      rating: 4.5,
      lat: location.lat + 0.01,
      lng: location.lng + 0.01,
      reviews: [
        'Çok güzel bir yer, yemekler lezzetli',
        'Servis biraz yavaş ama genel olarak iyi',
        'Fiyatlar uygun, tekrar gelirim',
        'Gürültülü bir ortam ama eğlenceli',
      ],
    },
    {
      name: 'Popüler Kafe',
      address: `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)} yakınında`,
      rating: 4.2,
      lat: location.lat - 0.01,
      lng: location.lng - 0.01,
      reviews: [
        'Kahve çok iyi, atmosfer güzel',
        'Çalışmak için ideal bir yer',
        'Biraz pahalı ama değer',
      ],
    },
  ]

  let browser: Browser | undefined
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    )

    // Google Maps arama URL'i
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${location.lat},${location.lng},15z`
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 })

    // Sayfanın yüklenmesini bekle
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Mekanları çek
    const places = await page.evaluate((max) => {
      const results: PlaceData[] = []
      
      // Google Maps'teki mekan elementlerini bul
      // Not: Google Maps'in DOM yapısı değişebilir, bu yüzden bu kod güncellenmeli
      const placeElements = document.querySelectorAll('[data-result-index]')
      
      placeElements.forEach((element, index) => {
        if (index >= max) return
        
        try {
          const nameEl = element.querySelector('[data-value="Name"]') || 
                        element.querySelector('h3') ||
                        element.querySelector('[role="button"]')
          const name = nameEl?.textContent?.trim() || 'Unknown'
          
          const addressEl = element.querySelector('[data-value="Address"]') ||
                           element.querySelector('[data-value="Address"]')
          const address = addressEl?.textContent?.trim() || ''
          
          const ratingEl = element.querySelector('[aria-label*="stars"]') ||
                          element.querySelector('[data-value="Rating"]')
          const ratingText = ratingEl?.getAttribute('aria-label') || 
                            ratingEl?.textContent || ''
          const rating = parseFloat(ratingText.match(/(\d+\.?\d*)/)?.[1] || '0')
          
          // Koordinatları bul (Google Maps'ten)
          const linkEl = element.querySelector('a[href*="/maps/place/"]')
          const href = linkEl?.getAttribute('href') || ''
          const coordsMatch = href.match(/@(-?\d+\.?\d+),(-?\d+\.?\d+)/)
          
          results.push({
            name,
            address,
            rating: rating || undefined,
            lat: coordsMatch ? parseFloat(coordsMatch[1]) : undefined,
            lng: coordsMatch ? parseFloat(coordsMatch[2]) : undefined,
          })
        } catch (err) {
          console.error('Error parsing place:', err)
        }
      })
      
      return results
    }, maxResults)

    // Yorumları çekmek için her mekana tıklayıp yorumları al
    // Not: Bu işlem yavaş olabilir, production'da optimize edilmeli
    if (!browser) {
      throw new Error('Browser not initialized')
    }
    
    const browserInstance = browser // TypeScript için
    
    // Yorumları çek - paralel ama rate limiting ile
    const placesWithReviews = await Promise.all(
      places.map(async (place, index) => {
        if (!place.lat || !place.lng) return place
        
        // Rate limiting - her 3 mekanda bir bekle
        if (index > 0 && index % 3 === 0) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
        
        try {
          const placeUrl = `https://www.google.com/maps/place/${encodeURIComponent(place.name)}/@${place.lat},${place.lng}`
          const placePage = await browserInstance.newPage()
          
          // User agent ve viewport ayarla
          await placePage.setUserAgent(
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          )
          await placePage.setViewport({ width: 1920, height: 1080 })
          
          await placePage.goto(placeUrl, { waitUntil: 'networkidle2', timeout: 30000 })
          
          // Yorumların yüklenmesi için bekle
          await new Promise(resolve => setTimeout(resolve, 3000))
          
          // Yorumları scroll et (daha fazla yorum yüklemek için)
          await placePage.evaluate(() => {
            const reviewSection = document.querySelector('[data-review-id]')?.closest('div')
            if (reviewSection) {
              for (let i = 0; i < 3; i++) {
                reviewSection.scrollTop = reviewSection.scrollHeight
                // eslint-disable-next-line no-promise-executor-return
                return new Promise(resolve => setTimeout(resolve, 1000))
              }
            }
          })
          
          // Yorumları çek - iyileştirilmiş selector'lar
          const reviews = await placePage.evaluate(() => {
            const reviewTexts: string[] = []
            const seen = new Set<string>()
            
            // Google Maps'in güncel selector'ları
            const selectors = [
              '.MyEned', // Yorum text container
              '.wiI7pd', // Yorum text
              '[data-review-id] .wiI7pd',
              '[jsaction*="review"] .wiI7pd',
              '.review-text',
              '[aria-label*="review"]',
            ]
            
            for (const selector of selectors) {
              const elements = document.querySelectorAll(selector)
              elements.forEach((el) => {
                const text = el.textContent?.trim()
                if (
                  text && 
                  text.length > 20 && 
                  text.length < 500 &&
                  !text.includes('Yorum') && // Meta text'leri filtrele
                  !text.includes('Review') &&
                  !text.includes('yıldız') &&
                  !text.match(/^\d+$/) // Sadece sayı değil
                ) {
                  const key = text.substring(0, 50).toLowerCase()
                  if (!seen.has(key)) {
                    seen.add(key)
                    reviewTexts.push(text)
                  }
                }
              })
              
              if (reviewTexts.length >= 50) break // Daha fazla yorum
            }
            
            // Eğer hala yorum yoksa, genel text araması
            if (reviewTexts.length < 10) {
              const allTexts = Array.from(document.querySelectorAll('span, p, div'))
                .map(el => el.textContent?.trim())
                .filter(text => 
                  text && 
                  text.length > 30 && 
                  text.length < 400 &&
                  (text.includes('.') || text.includes('!') || text.includes('?')) &&
                  !text.includes('Yorum') &&
                  !text.includes('Review')
                )
              
              allTexts.forEach(text => {
                if (text) {
                  const key = text.substring(0, 50).toLowerCase()
                  if (!seen.has(key) && reviewTexts.length < 50) {
                    seen.add(key)
                    reviewTexts.push(text)
                  }
                }
              })
            }
            
            return reviewTexts.slice(0, 50) // İlk 50 yorum
          })
          
          await placePage.close()
          
          if (reviews.length > 0) {
            console.log(`  📝 Found ${reviews.length} reviews for ${place.name}`)
          }
          
          return {
            ...place,
            reviews: reviews.length > 0 ? reviews : undefined,
          }
        } catch (err) {
          console.error(`Error fetching reviews for ${place.name}:`, err)
          return place
        }
      })
    )

    // Cache'e kaydet
    cache.set(cacheKey, { data: placesWithReviews, timestamp: Date.now() })

    // Eğer hiç mekan bulunamadıysa mock data döndür
    if (placesWithReviews.length === 0) {
      console.warn('No places found from scraping, using mock data')
      cache.set(cacheKey, { data: mockData, timestamp: Date.now() })
      return mockData
    }

    // Cache'e kaydet
    cache.set(cacheKey, { data: placesWithReviews, timestamp: Date.now() })

    return placesWithReviews
  } catch (error) {
    console.error('Scraping error:', error)
    // Scraping başarısız olursa mock data döndür (MVP için)
    console.warn('Using mock data due to scraping error')
    cache.set(cacheKey, { data: mockData, timestamp: Date.now() })
    return mockData
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Mesafe hesaplama (Haversine formülü)
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Dünya yarıçapı (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

