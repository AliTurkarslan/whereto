/**
 * Google Street View Static API
 * 
 * Mekan fotoğrafları
 * Ücretsiz tier: $7 per 1,000 requests
 */

const STREET_VIEW_API_BASE = 'https://maps.googleapis.com/maps/api/streetview'

export interface StreetViewImage {
  url: string
  width: number
  height: number
}

/**
 * Street View fotoğrafı al
 */
export function getStreetViewImage(
  lat: number,
  lng: number,
  apiKey: string,
  options: {
    width?: number
    height?: number
    fov?: number // Field of view (10-120)
    pitch?: number // Pitch angle (-90 to 90)
    heading?: number // Compass heading (0-360)
  } = {}
): string {
  // Free tier koruması - Street View API kullanımı client-side'da track edilemez
  // Gerçek kullanım server-side'da track edilmeli
  const {
    width = 400,
    height = 300,
    fov = 90,
    pitch = 0,
    heading = 0,
  } = options

  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    size: `${width}x${height}`,
    fov: fov.toString(),
    pitch: pitch.toString(),
    heading: heading.toString(),
    key: apiKey,
  })

  return `${STREET_VIEW_API_BASE}?${params.toString()}`
}

/**
 * Place için en iyi Street View fotoğrafını al
 */
export function getPlaceStreetView(
  lat: number,
  lng: number,
  apiKey: string,
  placeName?: string
): string {
  // Place'e bakacak şekilde heading hesapla (basit)
  // Production'da daha akıllı heading hesaplama yapılabilir
  return getStreetViewImage(lat, lng, apiKey, {
    width: 600,
    height: 400,
    fov: 90,
    pitch: 10, // Biraz yukarı bak
    heading: 0, // Default heading
  })
}


