/**
 * Google Directions API
 * 
 * Rota hesaplama ve navigasyon
 * Ücretsiz tier: $5 per 1,000 requests
 */

const DIRECTIONS_API_BASE = 'https://maps.googleapis.com/maps/api/directions/json'

export interface RouteInfo {
  distance: {
    text: string
    value: number // meters
  }
  duration: {
    text: string
    value: number // seconds
  }
  steps: Array<{
    instruction: string
    distance: string
    duration: string
  }>
  polyline: string // Encoded polyline for map
}

/**
 * Rota hesapla (origin → destination)
 */
export async function getDirections(
  origin: { lat: number; lng: number } | string,
  destination: { lat: number; lng: number } | string,
  apiKey: string,
  mode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'walking'
): Promise<RouteInfo | null> {
  try {
    const originStr = typeof origin === 'string' 
      ? origin 
      : `${origin.lat},${origin.lng}`
    
    const destStr = typeof destination === 'string'
      ? destination
      : `${destination.lat},${destination.lng}`

    const url = `${DIRECTIONS_API_BASE}?origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}&mode=${mode}&key=${apiKey}&language=tr&alternatives=false`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Directions API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
      return null
    }

    const route = data.routes[0]
    const leg = route.legs[0]

    return {
      distance: {
        text: leg.distance.text,
        value: leg.distance.value,
      },
      duration: {
        text: leg.duration.text,
        value: leg.duration.value,
      },
      steps: leg.steps.map((step: any) => ({
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
        distance: step.distance.text,
        duration: step.duration.text,
      })),
      polyline: route.overview_polyline.points,
    }
  } catch (error) {
    console.error('Directions error:', error)
    return null
  }
}

/**
 * Mesafe ve süre hesapla (basit)
 */
export async function getDistanceMatrix(
  origins: Array<{ lat: number; lng: number }>,
  destinations: Array<{ lat: number; lng: number }>,
  apiKey: string,
  mode: 'driving' | 'walking' | 'transit' = 'walking'
): Promise<Array<{ distance: string; duration: string }> | null> {
  try {
    const originsStr = origins.map(o => `${o.lat},${o.lng}`).join('|')
    const destsStr = destinations.map(d => `${d.lat},${d.lng}`).join('|')

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsStr}&destinations=${destsStr}&mode=${mode}&key=${apiKey}&language=tr`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Distance Matrix API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.status !== 'OK' || !data.rows) {
      return null
    }

    return data.rows[0].elements.map((element: any) => ({
      distance: element.distance?.text || 'N/A',
      duration: element.duration?.text || 'N/A',
    }))
  } catch (error) {
    console.error('Distance Matrix error:', error)
    return null
  }
}


