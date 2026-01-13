/**
 * Opening Hours Utilities
 * 
 * Mekanların açık/kapalı durumunu kontrol etme ve
 * gece geç saatlerde açık olup olmadığını belirleme
 */

export interface OpeningHours {
  weekdayDescriptions?: string[]
  openNow?: boolean
  periods?: Array<{
    open: { day: number; time: string }
    close?: { day: number; time: string }
  }>
}

/**
 * Şu anki saat ve gün bilgisini al
 */
function getCurrentDateTime(): { day: number; hour: number; minute: number } {
  const now = new Date()
  // JavaScript'te 0 = Pazar, 1 = Pazartesi, ..., 6 = Cumartesi
  // Google Maps API'de de aynı format kullanılıyor
  const day = now.getDay()
  const hour = now.getHours()
  const minute = now.getMinutes()
  return { day, hour, minute }
}

/**
 * Time string'i (HHMM formatında, örn: "0900", "2300") parse et
 */
function parseTime(timeString: string): { hour: number; minute: number } {
  if (!timeString || timeString.length !== 4) {
    return { hour: 0, minute: 0 }
  }
  
  const hour = parseInt(timeString.substring(0, 2), 10)
  const minute = parseInt(timeString.substring(2, 4), 10)
  
  return { hour, minute }
}

/**
 * İki zamanı karşılaştır (dakika cinsinden)
 */
function compareTime(hour1: number, minute1: number, hour2: number, minute2: number): number {
  const totalMinutes1 = hour1 * 60 + minute1
  const totalMinutes2 = hour2 * 60 + minute2
  return totalMinutes1 - totalMinutes2
}

/**
 * Mekan şu anda açık mı kontrol et
 */
export function isPlaceOpen(place: {
  openingHours?: OpeningHours | string | null
}): boolean {
  if (!place.openingHours) {
    return true // Bilgi yoksa varsayılan olarak açık kabul et
  }

  // String ise parse et
  let openingHours: OpeningHours
  if (typeof place.openingHours === 'string') {
    try {
      openingHours = JSON.parse(place.openingHours) as OpeningHours
    } catch {
      return true // Parse edilemezse açık kabul et
    }
  } else {
    openingHours = place.openingHours
  }

  // openNow bilgisi varsa direkt kullan
  if (openingHours.openNow !== undefined) {
    return openingHours.openNow
  }

  // periods bilgisi varsa kontrol et
  if (openingHours.periods && openingHours.periods.length > 0) {
    const { day, hour, minute } = getCurrentDateTime()
    
    // Bugün için period bul
    const todayPeriod = openingHours.periods.find(
      period => period.open.day === day
    )
    
    if (!todayPeriod) {
      return false // Bugün için period yoksa kapalı
    }

    // Açılış saatini kontrol et
    const openTime = parseTime(todayPeriod.open.time)
    if (compareTime(hour, minute, openTime.hour, openTime.minute) < 0) {
      return false // Henüz açılmamış
    }

    // Kapanış saati varsa kontrol et
    if (todayPeriod.close) {
      const closeTime = parseTime(todayPeriod.close.time)
      if (compareTime(hour, minute, closeTime.hour, closeTime.minute) >= 0) {
        // Eğer kapanış saati gece yarısından önceyse (örn: 2200), bugün kapalı
        // Eğer kapanış saati gece yarısından sonraysa (örn: 0200), yarın sabah kapanıyor demektir
        if (closeTime.hour < 12) {
          // Gece yarısından sonra kapanıyor (örn: 0200 = sabah 2)
          // Bu durumda gece yarısından sonra kontrol et
          if (hour < closeTime.hour) {
            return true // Hala açık (gece yarısından sonra ama kapanış saatinden önce)
          }
        }
        return false // Kapanış saatini geçmiş
      }
    }

    return true // Açık
  }

  // weekdayDescriptions varsa basit kontrol (daha az güvenilir)
  if (openingHours.weekdayDescriptions && openingHours.weekdayDescriptions.length > 0) {
    // "Closed" içeriyorsa kapalı
    const todayDescription = openingHours.weekdayDescriptions[getCurrentDateTime().day]
    if (todayDescription && todayDescription.toLowerCase().includes('closed')) {
      return false
    }
    return true
  }

  return true // Bilgi yoksa varsayılan olarak açık
}

/**
 * Gece geç saatlerde (23:00 sonrası) açık mı kontrol et
 */
export function isOpenLate(place: {
  openingHours?: OpeningHours | string | null
}): boolean {
  if (!place.openingHours) {
    return false // Bilgi yoksa varsayılan olarak gece açık değil
  }

  // String ise parse et
  let openingHours: OpeningHours
  if (typeof place.openingHours === 'string') {
    try {
      openingHours = JSON.parse(place.openingHours) as OpeningHours
    } catch {
      return false
    }
  } else {
    openingHours = place.openingHours
  }

  // periods bilgisi varsa kontrol et
  if (openingHours.periods && openingHours.periods.length > 0) {
    const { day } = getCurrentDateTime()
    
    // Bugün ve yarın için period'ları kontrol et
    const todayPeriod = openingHours.periods.find(p => p.open.day === day)
    const tomorrowDay = (day + 1) % 7
    const tomorrowPeriod = openingHours.periods.find(p => p.open.day === tomorrowDay)
    
    // Bugün kapanış saati gece yarısından sonraysa (23:00 sonrası açık)
    if (todayPeriod?.close) {
      const closeTime = parseTime(todayPeriod.close.time)
      // Eğer kapanış saati 23:00 veya sonrasıysa gece açık
      if (closeTime.hour >= 23) {
        return true
      }
      // Eğer kapanış saati gece yarısından sonraysa (00:00-06:00 arası) gece açık
      if (closeTime.hour < 6) {
        return true
      }
    }
    
    // Yarın açılış saati gece yarısından önceyse (gece açık demektir)
    if (tomorrowPeriod?.open) {
      const openTime = parseTime(tomorrowPeriod.open.time)
      // Eğer açılış saati gece yarısından sonra ama 06:00'dan önceyse gece açık
      if (openTime.hour < 6) {
        return true
      }
    }
  }

  // weekdayDescriptions'ta "late night" veya "24 hours" gibi ifadeler varsa
  if (openingHours.weekdayDescriptions) {
    const descriptions = openingHours.weekdayDescriptions.join(' ').toLowerCase()
    if (
      descriptions.includes('24 hours') ||
      descriptions.includes('24 saat') ||
      descriptions.includes('gece') ||
      descriptions.includes('late night') ||
      descriptions.includes('open until') ||
      descriptions.includes('açık')
    ) {
      // Daha detaylı kontrol için periods'a bakmak daha iyi
      // Ama şimdilik bu yeterli
      return true
    }
  }

  return false
}

/**
 * Yakında açılacak mı kontrol et (örn: 30 dakika içinde)
 */
export function isOpeningSoon(
  place: {
    openingHours?: OpeningHours | string | null
  },
  minutesThreshold: number = 30
): boolean {
  if (!place.openingHours) {
    return false
  }

  // String ise parse et
  let openingHours: OpeningHours
  if (typeof place.openingHours === 'string') {
    try {
      openingHours = JSON.parse(place.openingHours) as OpeningHours
    } catch {
      return false
    }
  } else {
    openingHours = place.openingHours
  }

  if (openingHours.periods && openingHours.periods.length > 0) {
    const { day, hour, minute } = getCurrentDateTime()
    const nowMinutes = hour * 60 + minute
    
    // Bugün için period bul
    const todayPeriod = openingHours.periods.find(p => p.open.day === day)
    
    if (!todayPeriod) {
      return false
    }

    const openTime = parseTime(todayPeriod.open.time)
    const openMinutes = openTime.hour * 60 + openTime.minute
    
    // Eğer şu an kapalıysa ve açılış saati threshold içindeyse
    if (nowMinutes < openMinutes) {
      const minutesUntilOpen = openMinutes - nowMinutes
      return minutesUntilOpen <= minutesThreshold
    }
  }

  return false
}



