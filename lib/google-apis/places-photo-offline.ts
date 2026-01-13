/**
 * Google Places Photo API - Offline Mode
 * 
 * API key olmadan çalışan versiyon
 * Database'deki photo reference'leri kullanarak direkt Google'ın CDN'inden fotoğrafları çeker
 * 
 * NOT: Bu yöntem Google'ın Terms of Service'ine göre çalışmayabilir.
 * Alternatif: Fotoğrafları hiç göstermemek veya placeholder kullanmak.
 */

/**
 * Photo reference'den direkt CDN URL'i oluştur (API key gerektirmez)
 * 
 * UYARI: Bu yöntem Google'ın resmi API'si değil ve ToS'a aykırı olabilir.
 * Sadece test/development için kullanılmalı.
 */
export function getPlacePhotoUrlOffline(
  photoReference: string,
  maxWidth: number = 400,
  maxHeight: number = 400
): string | null {
  // Google'ın CDN'inden direkt fotoğraf çekmeye çalışma
  // Bu yöntem çalışmayabilir ve ToS'a aykırı olabilir
  // Bunun yerine placeholder veya hiç göstermeme tercih edilmeli
  
  return null // API key olmadan fotoğraf gösterilemez
}

/**
 * Photo array'den ilk fotoğrafın placeholder URL'ini al
 */
export function getFirstPhotoUrlOffline(
  photos: Array<{ name: string; widthPx?: number; heightPx?: number }>,
  maxWidth: number = 400
): string | null {
  // API key olmadan fotoğraf gösterilemez
  // Placeholder veya hiç göstermeme tercih edilmeli
  return null
}
