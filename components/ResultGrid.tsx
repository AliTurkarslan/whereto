'use client'

import { ResultCard } from './ResultCard'

interface Place {
  name: string
  address: string
  score: number
  why: string
  risks?: string
  distance?: number
  rating?: number
  lat?: number
  lng?: number
}

interface ResultGridProps {
  places: Place[]
  locale?: 'tr' | 'en'
  userLocation?: { lat: number; lng: number }
}

export function ResultGrid({ places, locale, userLocation }: ResultGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {places.map((place, index) => (
        <div key={index} id={`place-${place.name}`} className="scroll-mt-4">
          <ResultCard 
            place={place} 
            locale={locale}
            userLocation={userLocation}
          />
        </div>
      ))}
    </div>
  )
}

