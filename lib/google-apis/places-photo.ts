/**
 * Google Places Photo API
 * 
 * Photo reference'den fotoğraf URL'i oluşturur
 * https://developers.google.com/maps/documentation/places/web-service/photos
 */

/**
 * Google Places Photo URL oluştur
 * 
 * @param photoReference Photo reference (places API'den gelen)
 * @param apiKey Google Maps API key
 * @param maxWidth Maksimum genişlik (varsayılan: 400)
 * @param maxHeight Maksimum yükseklik (varsayılan: 400)
 */
export function getPlacePhotoUrl(
  photoReference: string,
  apiKey: string,
  maxWidth: number = 400,
  maxHeight: number = 400
): string {
  // Free tier koruması - Photo API kullanımını kaydet (client-side'da çalışmaz, sadece URL oluşturur)
  // Gerçek kullanım server-side'da track edilmeli
  
  // Photo reference'den URL oluştur
  // Format: https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=PHOTO_REFERENCE&key=API_KEY
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&maxheight=${maxHeight}&photo_reference=${photoReference}&key=${apiKey}`
}

/**
 * Photo reference'i extract et (photo name'dan)
 * 
 * Google Places API'den gelen photo name formatı:
 * places/ChIJ.../photos/AZLasHp...
 * 
 * Photo reference'i extract etmek için son kısmı al
 */
export function extractPhotoReference(photoName: string): string | null {
  // Photo name formatı: places/ChIJ.../photos/AZLasHp...
  const parts = photoName.split('/')
  const photoIndex = parts.findIndex(part => part === 'photos')
  
  if (photoIndex >= 0 && photoIndex < parts.length - 1) {
    return parts[photoIndex + 1]
  }
  
  // Eğer direkt photo reference ise
  if (photoName.startsWith('AZLasH')) {
    return photoName
  }
  
  return null
}

/**
 * Photo array'den ilk fotoğrafın URL'ini al
 */
export function getFirstPhotoUrl(
  photos: Array<{ name: string; widthPx?: number; heightPx?: number }>,
  apiKey: string,
  maxWidth: number = 400
): string | null {
  if (!photos || photos.length === 0 || !apiKey) {
    return null
  }
  
  const firstPhoto = photos[0]
  const photoReference = extractPhotoReference(firstPhoto.name)
  
  if (!photoReference) {
    return null
  }
  
  return getPlacePhotoUrl(photoReference, apiKey, maxWidth)
}



