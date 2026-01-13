/**
 * Google Maps Embed API
 * 
 * Harita embed (ücretsiz, API key gerektirmez)
 */

/**
 * Google Maps Embed URL oluştur
 */
export function getMapsEmbedUrl(
  place: {
    name: string
    lat: number
    lng: number
    address?: string
  },
  options: {
    zoom?: number
    mode?: 'place' | 'directions' | 'search' | 'view' | 'streetview'
    apiKey?: string
  } = {}
): string {
  const { zoom = 15, mode = 'place' } = options
  const apiKey = options.apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyATb5V4QnMjOqvlOzuIhKg6pw6j4IcN8-k'

  if (mode === 'place') {
    const query = place.address || `${place.name} ${place.lat},${place.lng}`
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(query)}&zoom=${zoom}`
  }

  if (mode === 'directions') {
    return `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${place.lat},${place.lng}&destination=${place.lat},${place.lng}&zoom=${zoom}`
  }

  return `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${place.lat},${place.lng}&zoom=${zoom}`
}

/**
 * Google Maps direkt link (yeni sekmede açılır)
 * Place ID varsa mekanın kendisini açar, yoksa adres/koordinat kullanır
 */
export function getMapsLink(
  place: {
    name: string
    lat?: number
    lng?: number
    address?: string
    googleMapsId?: string
    placeId?: string
  }
): string {
  // Önce Place ID'yi kontrol et (googleMapsId veya placeId)
  const placeId = place.googleMapsId || place.placeId
  
  if (placeId) {
    // Place ID ile mekanın kendisini aç
    return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`
  }
  
  // Place ID yoksa, koordinat veya adres kullan
  if (place.lat && place.lng) {
    // Koordinat + isim ile arama (mekanı bulma şansı daha yüksek)
    const query = `${place.name} ${place.lat},${place.lng}`
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  }
  
  // Sadece adres veya isim ile arama
  const query = place.address || place.name
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

/**
 * Directions link (yeni sekmede açılır)
 */
export function getDirectionsLink(
  origin: { lat: number; lng: number } | string,
  destination: { lat: number; lng: number } | string
): string {
  const originStr = typeof origin === 'string' 
    ? origin 
    : `${origin.lat},${origin.lng}`
  
  const destStr = typeof destination === 'string'
    ? destination
    : `${destination.lat},${destination.lng}`

  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}`
}

