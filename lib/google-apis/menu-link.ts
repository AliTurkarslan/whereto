/**
 * Menu Link Utilities
 * 
 * Google Maps menu link helper functions
 */

/**
 * Get Google Maps menu link for a place
 * 
 * Google Maps'te menü bilgisi place page'de bir sekme olarak görünür.
 * Doğrudan menü sekmesine gitmek için place page'e gidip menü sekmesine scroll yapabiliriz.
 * Ancak Google Maps'in doğrudan menü URL'i yok, bu yüzden place page'e gidip
 * kullanıcının menü sekmesine tıklamasını bekleriz.
 * 
 * Alternatif: Eğer website varsa ve menü linki varsa, oraya yönlendirebiliriz.
 * 
 * @param placeId Google Maps Place ID
 * @returns Menu link URL or null if placeId is not provided
 */
export function getMenuLink(placeId: string | undefined): string | null {
  if (!placeId) return null
  
  // Google Maps place page - menü sekmesi genellikle sayfada görünür
  // Place ID ile place page'e gidiyoruz, kullanıcı menü sekmesine tıklayabilir
  // Format: https://www.google.com/maps/place/?q=place_id:PLACE_ID
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`
}

/**
 * Get Google Maps menu link with action (tries to open menu tab directly)
 * 
 * Not: Google Maps'in doğrudan menü sekmesine gitme URL'i yok.
 * Bu fonksiyon place page'e gider, kullanıcı menü sekmesine tıklayabilir.
 * 
 * @param placeId Google Maps Place ID
 * @returns Menu link URL with menu action or null if placeId is not provided
 */
export function getMenuLinkWithAction(placeId: string | undefined): string | null {
  if (!placeId) return null
  
  // Place page'e git - menü sekmesi genellikle görünür
  // Kullanıcı menü sekmesine tıklayarak menüyü görüntüleyebilir
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`
}

