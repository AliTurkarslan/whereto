import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/config/environment'

/**
 * Google Places Photo API Proxy
 * 
 * Client-side'dan direkt çağrı yapmak yerine server-side proxy kullanıyoruz
 * Bu, CORS sorunlarını ve API key güvenliğini çözer
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const photoName = searchParams.get('photoName')
    const maxWidthPx = searchParams.get('maxWidthPx') || '600'

    if (!photoName) {
      return NextResponse.json(
        { error: 'photoName parameter is required' },
        { status: 400 }
      )
    }

    const config = getConfig()
    const apiKey = config.googlePlacesApiKey

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Places API key is not configured' },
        { status: 500 }
      )
    }

    // Yeni Places API (New) formatı
    const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${apiKey}`

    // Fotoğrafı fetch et ve proxy'le
    const response = await fetch(photoUrl, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('Places Photo API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText.substring(0, 200),
        photoName: photoName.substring(0, 100),
      })
      
      return NextResponse.json(
        { 
          error: `Places Photo API error: ${response.status}`,
          details: errorText.substring(0, 200),
        },
        { status: response.status }
      )
    }

    // Fotoğrafı stream olarak döndür
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 24 saat cache
      },
    })
  } catch (error) {
    console.error('Place photo proxy error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
