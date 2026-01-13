/**
 * Google Time Zone API
 * 
 * Saat dilimi ve yerel saat bilgisi
 * Ücretsiz tier: $5 per 1,000 requests
 */

const TIME_ZONE_API_BASE = 'https://maps.googleapis.com/maps/api/timezone/json'

export interface TimeZoneInfo {
  timeZoneId: string
  timeZoneName: string
  rawOffset: number // seconds
  dstOffset: number // seconds
  localTime: Date
}

/**
 * Koordinat için saat dilimi bilgisi al
 */
export async function getTimeZone(
  lat: number,
  lng: number,
  apiKey: string,
  timestamp?: number // Unix timestamp (optional, defaults to now)
): Promise<TimeZoneInfo | null> {
  try {
    const ts = timestamp || Math.floor(Date.now() / 1000)
    const url = `${TIME_ZONE_API_BASE}?location=${lat},${lng}&timestamp=${ts}&key=${apiKey}`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Time Zone API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.status !== 'OK') {
      return null
    }

    const localTime = new Date((ts + data.rawOffset + data.dstOffset) * 1000)

    return {
      timeZoneId: data.timeZoneId,
      timeZoneName: data.timeZoneName,
      rawOffset: data.rawOffset,
      dstOffset: data.dstOffset,
      localTime,
    }
  } catch (error) {
    console.error('Time Zone error:', error)
    return null
  }
}


