#!/usr/bin/env tsx

/**
 * İyileştirilmiş Google Maps Scraper
 * Daha fazla mekan bulmak için farklı stratejiler kullanır
 */

import puppeteer, { Browser } from 'puppeteer'
import { PlaceData } from '../lib/scrapers/google-maps'

async function scrapeKadikoyPlaces(query: string, maxResults: number = 50) {
  const KADIKOY_LAT = 40.9833
  const KADIKOY_LNG = 29.0167

  console.log(`🔍 Scraping: ${query} in Kadıköy...`)

  let browser: Browser | undefined
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )

    // Google Maps arama URL'i - daha spesifik
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}+Kadıköy/@${KADIKOY_LAT},${KADIKOY_LNG},14z`
    console.log(`📍 URL: ${searchUrl}`)
    
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 })
    await new Promise(resolve => setTimeout(resolve, 5000)) // Daha uzun bekleme

    // Scroll yaparak daha fazla mekan yükle
    console.log('📜 Scrolling to load more places...')
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        const sidebar = document.querySelector('[role="main"]')
        if (sidebar) {
          sidebar.scrollTop = sidebar.scrollHeight
        }
      })
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    // Mekanları çek - daha fazla selector dene
    const places = await page.evaluate((max) => {
      const results: PlaceData[] = []
      const seen = new Set<string>()

      // Farklı selector stratejileri
      const selectors = [
        '[data-result-index]',
        '[role="article"]',
        '.Nv2PK',
        '.THOPZb',
        'a[href*="/maps/place/"]',
      ]

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector)
        console.log(`Found ${elements.length} elements with selector: ${selector}`)

        elements.forEach((element) => {
          if (results.length >= max) return

          try {
            // İsim bul
            const nameSelectors = [
              'h3',
              '[data-value="Name"]',
              '.qBF1Pd',
              '.fontHeadlineSmall',
              'span[aria-label]',
            ]
            
            let name = ''
            for (const nameSel of nameSelectors) {
              const nameEl = element.querySelector(nameSel)
              if (nameEl) {
                name = nameEl.textContent?.trim() || nameEl.getAttribute('aria-label') || ''
                if (name) break
              }
            }

            if (!name || name === 'Unknown' || seen.has(name)) return
            seen.add(name)

            // Adres bul
            const addressSelectors = [
              '[data-value="Address"]',
              '.W4Efsd',
              '.W4Efsd:last-of-type',
              'span[aria-label*="Address"]',
            ]
            
            let address = ''
            for (const addrSel of addressSelectors) {
              const addrEl = element.querySelector(addrSel)
              if (addrEl) {
                address = addrEl.textContent?.trim() || ''
                if (address && address.length > 5) break
              }
            }

            // Rating bul
            let rating: number | undefined
            const ratingSelectors = [
              '[aria-label*="stars"]',
              '[data-value="Rating"]',
              '.MW4etd',
            ]
            
            for (const ratingSel of ratingSelectors) {
              const ratingEl = element.querySelector(ratingSel)
              if (ratingEl) {
                const ratingText = ratingEl.getAttribute('aria-label') || ratingEl.textContent || ''
                const match = ratingText.match(/(\d+\.?\d*)/)
                if (match) {
                  rating = parseFloat(match[1])
                  break
                }
              }
            }

            // Koordinatları bul
            const linkEl = element.querySelector('a[href*="/maps/place/"]') || element.closest('a[href*="/maps/place/"]')
            const href = linkEl?.getAttribute('href') || ''
            const coordsMatch = href.match(/@(-?\d+\.?\d+),(-?\d+\.?\d+)/)

            if (name && (coordsMatch || address)) {
              results.push({
                name,
                address: address || 'Kadıköy',
                rating,
                lat: coordsMatch ? parseFloat(coordsMatch[1]) : undefined,
                lng: coordsMatch ? parseFloat(coordsMatch[2]) : undefined,
              })
            }
          } catch (err) {
            console.error('Error parsing place:', err)
          }
        })

        if (results.length >= max) break
      }

      return results
    }, maxResults)

    console.log(`✅ Found ${places.length} places`)

    // Koordinatları olmayan mekanlar için Google Maps'ten koordinat çek
    const placesWithCoords = await Promise.all(
      places.map(async (place) => {
        if (place.lat && place.lng) return place

        try {
          // İsim ve adres ile koordinat ara
          const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(place.name + ' ' + place.address)}`
          const searchPage = await browser!.newPage()
          await searchPage.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 })
          await new Promise(resolve => setTimeout(resolve, 2000))

          const coords = await searchPage.evaluate(() => {
            const url = window.location.href
            const match = url.match(/@(-?\d+\.?\d+),(-?\d+\.?\d+)/)
            if (match) {
              return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
            }
            return null
          })

          await searchPage.close()

          if (coords) {
            return { ...place, lat: coords.lat, lng: coords.lng }
          }
        } catch (err) {
          console.error(`Error getting coordinates for ${place.name}:`, err)
        }

        return place
      })
    )

    return placesWithCoords.filter(p => p.lat && p.lng)
  } catch (error) {
    console.error('Scraping error:', error)
    return []
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Test
if (require.main === module) {
  scrapeKadikoyPlaces('restaurant', 20)
    .then((places) => {
      console.log('\n📊 Results:')
      places.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} - ${p.address} (${p.lat}, ${p.lng})`)
      })
      process.exit(0)
    })
    .catch((error) => {
      console.error('Error:', error)
      process.exit(1)
    })
}

export { scrapeKadikoyPlaces }

