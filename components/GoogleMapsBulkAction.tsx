'use client'

import { Button } from '@/components/ui/button'
import { ExternalLink, MapPin } from 'lucide-react'
import { getMapsLink } from '@/lib/google-apis/maps-embed'

interface Place {
  name: string
  address: string
  lat?: number
  lng?: number
}

interface GoogleMapsBulkActionProps {
  places: Place[]
  locale?: 'tr' | 'en'
}

export function GoogleMapsBulkAction({ places, locale = 'tr' }: GoogleMapsBulkActionProps) {
  const validPlaces = places.filter(p => p.lat && p.lng)

  if (validPlaces.length === 0) return null

  // İlk mekanın koordinatlarını merkez olarak kullan
  const centerPlace = validPlaces[0]
  
  // Google Maps'te tüm mekanları göster (search query ile)
  const handleOpenAllInGoogleMaps = () => {
    // Tüm mekan isimlerini birleştir
    const placeNames = validPlaces.map(p => p.name).join(', ')
    
    // Google Maps search URL
    const searchQuery = encodeURIComponent(placeNames)
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`
    
    window.open(mapsUrl, '_blank')
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleOpenAllInGoogleMaps}
      className="flex items-center gap-2"
    >
      <ExternalLink className="h-4 w-4" />
      <span className="hidden sm:inline">
        {locale === 'tr' 
          ? `Tümünü Google Maps'te Gör (${validPlaces.length})`
          : `View All in Google Maps (${validPlaces.length})`}
      </span>
      <span className="sm:hidden">
        {locale === 'tr' ? 'Google Maps' : 'Google Maps'}
      </span>
    </Button>
  )
}


