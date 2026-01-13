#!/usr/bin/env tsx

/**
 * Background Job: Mekanları scrape et ve database'e kaydet
 * 
 * Kullanım:
 * npm run sync:places -- --query "restaurant" --lat 41.0082 --lng 28.9784
 * veya
 * npm run sync:places -- --city "Istanbul"
 */

// Environment variables'ı yükle
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { scrapeGoogleMaps, PlaceData } from '../lib/scrapers/google-maps'
import { searchPlacesComprehensive, getPlaceDetails } from '../lib/scrapers/google-places-api'
import { fetchReviews, fetchReviewsBatch } from '../lib/scrapers/reviews-fetcher'
import { scorePlaces } from '../lib/ai/gemini'
import { db } from '../lib/db'
import { places, reviews, analyses } from '../lib/db/schema'
import { eq, and } from 'drizzle-orm'

interface SyncOptions {
  query: string
  lat: number
  lng: number
  category: string
  companions?: string[]
}

export async function syncPlaces(options: SyncOptions) {
  const { query, lat, lng, category, companions = ['alone', 'partner', 'friends', 'family', 'colleagues'] } = options

  console.log(`🔄 Syncing places for: ${query} at ${lat}, ${lng}`)

  // 1. Google Places API ile mekanları çek
  let scrapedPlaces: PlaceData[] = []
  
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (apiKey) {
    console.log('📍 Using Google Places API (Free tier protected)...')
    try {
      // Daha fazla mekan için limit artırıldı
      scrapedPlaces = await searchPlacesComprehensive(query, { lat, lng }, apiKey, 100)
      console.log(`📦 Places API found ${scrapedPlaces.length} places`)
      
      // Yorumları çekme - Scraping ile (ücretsiz, ama yavaş)
      // İlk 30 mekan için yorum çek (zaman alır, bu yüzden limit)
      console.log('📝 Fetching reviews via scraping (this may take a while)...')
      const reviewsMap = await fetchReviewsBatch(scrapedPlaces.slice(0, 30), apiKey, 3) // İlk 30 mekan için yorum çek
      
      // Yorumları place'lere ekle
      scrapedPlaces = scrapedPlaces.map(place => {
        const key = `${place.lat}-${place.lng}-${place.name}`
        const placeReviews = reviewsMap.get(key)
        if (placeReviews && placeReviews.length > 0) {
          return { ...place, reviews: placeReviews }
        }
        return place
      })
      
      const placesWithReviews = scrapedPlaces.filter(p => p.reviews && p.reviews.length > 0)
      console.log(`✅ Found reviews for ${placesWithReviews.length}/${scrapedPlaces.length} places`)
    } catch (error) {
      console.warn('Places API failed, falling back to scraping:', error)
      // Fallback to scraping
      scrapedPlaces = await scrapeGoogleMaps({
        query,
        location: { lat, lng },
        maxResults: 50,
      })
      console.log(`📦 Scraper found ${scrapedPlaces.length} places`)
    }
  } else {
    console.warn('⚠️  No Google Places API key found, using scraping...')
    scrapedPlaces = await scrapeGoogleMaps({
      query,
      location: { lat, lng },
      maxResults: 50,
    })
    console.log(`📦 Scraper found ${scrapedPlaces.length} places`)
  }

  for (const placeData of scrapedPlaces) {
    if (!placeData.lat || !placeData.lng) continue

    // 2. Place'i database'e kaydet veya güncelle
    const [existingPlace] = await db
      .select()
      .from(places)
      .where(
        and(
          eq(places.lat, placeData.lat!),
          eq(places.lng, placeData.lng!),
          eq(places.name, placeData.name)
        )
      )
      .limit(1)
    
    let place = existingPlace

    if (!place) {
      const [inserted] = await db
        .insert(places)
        .values({
          name: placeData.name,
          address: placeData.address,
          lat: placeData.lat,
          lng: placeData.lng,
          rating: placeData.rating,
          reviewCount: placeData.reviewCount,
          category: query,
          lastScrapedAt: new Date(),
        })
        .returning()
      
      place = inserted
      console.log(`✅ Created place: ${place.name}`)
    } else {
      // Update existing place
      await db
        .update(places)
        .set({
          rating: placeData.rating,
          reviewCount: placeData.reviewCount,
          lastScrapedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(places.id, place.id))
      
      console.log(`🔄 Updated place: ${place.name}`)
    }

    // 3. Reviews'ları kaydet
    if (placeData.reviews && placeData.reviews.length > 0) {
      // Eski yorumları sil (yenileri ekleyeceğiz)
      await db.delete(reviews).where(eq(reviews.placeId, place.id))

      // Yeni yorumları ekle
      const reviewsToInsert = placeData.reviews.map((reviewText) => ({
        placeId: place.id,
        text: reviewText,
        createdAt: new Date(),
      }))

      if (reviewsToInsert.length > 0) {
        await db.insert(reviews).values(reviewsToInsert)
        console.log(`  📝 Saved ${reviewsToInsert.length} reviews`)
      }
    }

    // 4. Database'den yorumları çek (varsa) - sync'te yorum yoksa
    if (!placeData.reviews || placeData.reviews.length === 0) {
      const dbReviews = await db
        .select()
        .from(reviews)
        .where(eq(reviews.placeId, place.id))
        .limit(50)
      
      if (dbReviews.length > 0) {
        placeData.reviews = dbReviews.map(r => r.text)
        console.log(`  📝 Using ${dbReviews.length} reviews from database`)
      }
    }

    // 5. Her companion için AI analiz yap ve kaydet
    for (const companion of companions) {
      const scoredPlaces = await scorePlaces([placeData], {
        category,
        companion,
        userLocation: { lat, lng },
      })

      if (scoredPlaces.length > 0) {
        const scored = scoredPlaces[0]

        // Mevcut analizi kontrol et
        const [existing] = await db
          .select()
          .from(analyses)
          .where(
            and(
              eq(analyses.placeId, place.id),
              eq(analyses.category, category),
              eq(analyses.companion, companion)
            )
          )
          .limit(1)

        const analysisData = {
          placeId: place.id,
          category,
          companion,
          score: scored.score,
          why: scored.why,
          risks: scored.risks || null,
          reviewCategories: scored.reviewCategories
            ? JSON.stringify(scored.reviewCategories)
            : null,
          updatedAt: new Date(),
        }

        if (existing) {
          await db
            .update(analyses)
            .set(analysisData)
            .where(eq(analyses.id, existing.id))
        } else {
          await db.insert(analyses).values({
            ...analysisData,
            createdAt: new Date(),
          })
        }

        console.log(`  🤖 Analyzed for ${companion}: ${scored.score}%`)
      }
    }
  }

  console.log(`✅ Sync completed for ${scrapedPlaces.length} places`)
}

// CLI için
if (require.main === module) {
  const args = process.argv.slice(2)
  const query = args.find((a) => a.startsWith('--query='))?.split('=')[1] || 'restaurant'
  const lat = parseFloat(args.find((a) => a.startsWith('--lat='))?.split('=')[1] || '41.0082')
  const lng = parseFloat(args.find((a) => a.startsWith('--lng='))?.split('=')[1] || '28.9784')
  const category = args.find((a) => a.startsWith('--category='))?.split('=')[1] || 'food'

  syncPlaces({ query, lat, lng, category })
    .then(() => {
      console.log('✅ Sync job completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Sync job failed:', error)
      process.exit(1)
    })
}

