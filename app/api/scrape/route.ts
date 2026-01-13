import { NextRequest, NextResponse } from 'next/server'
import { scrapeGoogleMaps } from '@/lib/scrapers/google-maps'
import { logger } from '@/lib/logging/logger'

export async function POST(request: NextRequest) {
  let query: string | undefined
  let lat: number | undefined
  let lng: number | undefined
  let maxResults = 10

  try {
    const body = await request.json()
    query = body.query
    lat = body.lat
    lng = body.lng
    maxResults = body.maxResults || 10

    if (!query || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters: query, lat, lng' },
        { status: 400 }
      )
    }

    const places = await scrapeGoogleMaps({
      query,
      location: { lat, lng },
      maxResults,
    })

    return NextResponse.json({ places })
  } catch (error) {
    logger.error('Scrape error', error instanceof Error ? error : new Error(String(error)), { query: query || 'unknown', lat, lng, maxResults })
    return NextResponse.json(
      { error: 'Failed to scrape places' },
      { status: 500 }
    )
  }
}


