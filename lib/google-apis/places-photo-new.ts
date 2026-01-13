/**
 * Google Places API (New) Photo URL
 * 
 * Yeni Places API (New) için photo URL formatı
 * https://developers.google.com/maps/documentation/places/web-service/photos
 * 
 * NOT: Yeni Places API (New) için photo name kullanılmalı, photo_reference değil!
 */

/**
 * Yeni Places API (New) için photo URL oluştur
 * 
 * Yeni API'de photo name formatı: places/ChIJ.../photos/AZLasH...
 * Bu name'i direkt kullanarak URL oluşturulmalı
 * 
 * @param photoName Photo name (places/ChIJ.../photos/AZLasH...)
 * @param apiKey Google Maps API key
 * @param maxWidthPx Maksimum genişlik (piksel)
 */
export function getPlacePhotoUrlNew(
  photoName: string,
  apiKey: string,
  maxWidthPx: number = 600
): string {
  // Yeni Places API (New) için photo URL formatı:
  // https://places.googleapis.com/v1/{photoName}/media?maxWidthPx={maxWidthPx}&key={apiKey}
  
  // Photo name'den URL oluştur
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${apiKey}`
}

/**
 * Photo array'den ilk fotoğrafın URL'ini al (Yeni API formatı)
 */
export function getFirstPhotoUrlNew(
  photos: Array<{ name: string; widthPx?: number; heightPx?: number }>,
  apiKey: string,
  maxWidthPx: number = 600
): string | null {
  if (!photos || photos.length === 0 || !apiKey) {
    return null
  }
  
  const firstPhoto = photos[0]
  
  if (!firstPhoto.name) {
    return null
  }
  
  return getPlacePhotoUrlNew(firstPhoto.name, apiKey, maxWidthPx)
}
