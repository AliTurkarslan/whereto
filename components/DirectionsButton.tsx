'use client'

import { Button } from '@/components/ui/button'
import { Navigation, ExternalLink } from 'lucide-react'
import { getDirectionsLink } from '@/lib/google-apis/maps-embed'

interface DirectionsButtonProps {
  origin: { lat: number; lng: number } | string
  destination: { lat: number; lng: number }
  placeName: string
  locale?: 'tr' | 'en'
}

export function DirectionsButton({ origin, destination, placeName, locale = 'tr' }: DirectionsButtonProps) {
  const handleDirections = () => {
    const url = getDirectionsLink(origin, destination)
    window.open(url, '_blank')
  }

  return (
    <Button
      onClick={handleDirections}
      variant="outline"
      size="sm"
      className="w-full sm:w-auto"
    >
      <Navigation className="h-4 w-4 mr-2" />
      {locale === 'tr' ? 'Nasıl Giderim?' : 'Get Directions'}
      <ExternalLink className="h-3 w-3 ml-2" />
    </Button>
  )
}


