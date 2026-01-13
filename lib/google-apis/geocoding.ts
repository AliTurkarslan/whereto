/**
 * Google Geocoding API
 * 
 * Adres ↔ Koordinat dönüşümü
 * Ücretsiz tier: $5 per 1,000 requests
 */

const GEOCODING_API_BASE = 'https://maps.googleapis.com/maps/api/geocode/json'

export interface GeocodingResult {
  lat: number
  lng: number
  formattedAddress: string
  placeId?: string
  addressComponents?: {
    street?: string
    city?: string
    district?: string
    country?: string
  }
}

/**
 * Adres → Koordinat (Forward Geocoding)
 */
export async function geocodeAddress(
  address: string,
  apiKey: string
): Promise<GeocodingResult | null> {
  try {
    const url = `${GEOCODING_API_BASE}?address=${encodeURIComponent(address)}&key=${apiKey}&language=tr`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return null
    }

    const result = data.results[0]
    const location = result.geometry.location

    // Address components parse
    const addressComponents: any = {}
    result.address_components?.forEach((component: any) => {
      if (component.types.includes('route')) {
        addressComponents.street = component.long_name
      }
      if (component.types.includes('locality') || component.types.includes('administrative_area_level_1')) {
        addressComponents.city = component.long_name
      }
      if (component.types.includes('sublocality') || component.types.includes('neighborhood')) {
        addressComponents.district = component.long_name
      }
      if (component.types.includes('country')) {
        addressComponents.country = component.long_name
      }
    })

    return {
      lat: location.lat,
      lng: location.lng,
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
      addressComponents,
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Koordinat → Adres (Reverse Geocoding)
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  apiKey: string
): Promise<GeocodingResult | null> {
  try {
    const url = `${GEOCODING_API_BASE}?latlng=${lat},${lng}&key=${apiKey}&language=tr`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Reverse Geocoding API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return null
    }

    const result = data.results[0]
    const location = result.geometry.location

    const addressComponents: any = {}
    result.address_components?.forEach((component: any) => {
      if (component.types.includes('route')) {
        addressComponents.street = component.long_name
      }
      if (component.types.includes('locality') || component.types.includes('administrative_area_level_1')) {
        addressComponents.city = component.long_name
      }
      if (component.types.includes('sublocality') || component.types.includes('neighborhood')) {
        addressComponents.district = component.long_name
      }
      if (component.types.includes('country')) {
        addressComponents.country = component.long_name
      }
    })

    return {
      lat: location.lat,
      lng: location.lng,
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
      addressComponents,
    }
  } catch (error) {
    console.error('Reverse Geocoding error:', error)
    return null
  }
}


