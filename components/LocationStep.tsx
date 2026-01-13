'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MapPin, Loader2 } from 'lucide-react'
import { getTranslations } from '@/lib/i18n'
import { geocodeAddress } from '@/lib/google-apis/geocoding'

interface LocationStepProps {
  locale?: 'tr' | 'en'
  onLocationChange: (location: { lat: number; lng: number; address: string }) => void
  initialLocation?: { lat: number; lng: number; address: string }
}

export function LocationStep({ locale = 'tr', onLocationChange, initialLocation }: LocationStepProps) {
  const t = getTranslations(locale)
  const [location, setLocation] = useState(initialLocation?.address || '')
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectedLocation, setDetectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(initialLocation || null)

  useEffect(() => {
    if (initialLocation) {
      setDetectedLocation(initialLocation)
      setLocation(initialLocation.address)
    }
  }, [initialLocation])

  const detectLocation = async () => {
    setIsDetecting(true)
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            
            // Google Reverse Geocoding API kullan (daha güvenilir)
            const { getGoogleMapsApiKey } = await import('@/lib/config/environment')
            const apiKey = getGoogleMapsApiKey()
            
            if (apiKey) {
              try {
                const { reverseGeocode } = await import('@/lib/google-apis/geocoding')
                const geocoded = await reverseGeocode(latitude, longitude, apiKey)
                
                if (geocoded) {
                  const loc = { 
                    lat: geocoded.lat, 
                    lng: geocoded.lng, 
                    address: geocoded.formattedAddress 
                  }
                  setDetectedLocation(loc)
                  setLocation(geocoded.formattedAddress)
                  onLocationChange(loc)
                  setIsDetecting(false)
                  return
                }
              } catch (error) {
                console.warn('Google Reverse Geocoding failed, using fallback:', error)
              }
            }

            // Fallback: Nominatim reverse geocoding
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              )
              const data = await response.json()
              const address = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
              
              const loc = { lat: latitude, lng: longitude, address }
              setDetectedLocation(loc)
              setLocation(address)
              onLocationChange(loc)
            } catch (error) {
              const address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
              const loc = { lat: latitude, lng: longitude, address }
              setDetectedLocation(loc)
              setLocation(address)
              onLocationChange(loc)
            }
          },
          (error) => {
            console.error('Geolocation error:', error)
            setIsDetecting(false)
          }
        )
      }
    } catch (error) {
      console.error('Location detection error:', error)
    } finally {
      setIsDetecting(false)
    }
  }

  const handleManualSubmit = async () => {
    if (location.trim()) {
      setIsDetecting(true)
      try {
        // Önce Google Geocoding API dene (daha güvenilir)
        const { getGoogleMapsApiKey } = await import('@/lib/config/environment')
        const apiKey = getGoogleMapsApiKey()
        
        if (apiKey) {
          const geocoded = await geocodeAddress(location.trim(), apiKey)
          if (geocoded) {
            const loc = {
              lat: geocoded.lat,
              lng: geocoded.lng,
              address: geocoded.formattedAddress
            }
            setDetectedLocation(loc)
            onLocationChange(loc)
            setIsDetecting(false)
            return
          }
        }

        // Fallback: Nominatim geocoding API
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location.trim())}&limit=1`
        )
        const data = await response.json()
        
        if (data && data.length > 0) {
          const result = data[0]
          const loc = {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            address: result.display_name || location.trim()
          }
          setDetectedLocation(loc)
          onLocationChange(loc)
        } else {
          // Geocoding başarısız, Kadıköy default koordinatları
          const loc = {
            lat: 40.9833,
            lng: 29.0167,
            address: location.trim()
          }
          setDetectedLocation(loc)
          onLocationChange(loc)
        }
      } catch (error) {
        const { logger } = await import('@/lib/logging/logger')
        logger.error('Geocoding error', error instanceof Error ? error : new Error(String(error)), { location: location.trim() })
        // Hata durumunda Kadıköy default koordinatları
        const loc = {
          lat: 40.9833,
          lng: 29.0167,
          address: location.trim()
        }
        setDetectedLocation(loc)
        onLocationChange(loc)
      } finally {
        setIsDetecting(false)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">{t.steps.location.title}</h2>
        <p className="text-sm text-muted-foreground">
          {locale === 'tr' 
            ? 'Konumunu seçerek yakınındaki en uygun mekanları bulabilirsin.'
            : 'Select your location to find the most suitable places nearby.'}
        </p>
      </div>
      
      {detectedLocation && (
        <div className="flex items-center gap-3 p-4 bg-primary/10 border-2 border-primary/20 rounded-xl">
          <div className="p-2 bg-primary rounded-full">
            <MapPin className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium">{t.steps.location.autoDetected}</p>
            <p className="text-sm font-semibold text-foreground">{detectedLocation.address}</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Button
          onClick={detectLocation}
          disabled={isDetecting}
          variant="default"
          size="lg"
          className="w-full"
        >
          {isDetecting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {t.common.loading}
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-5 w-5" />
              {t.steps.location.autoDetected}
            </>
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">veya</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder={t.steps.location.placeholder}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
            className="flex-1"
            disabled={isDetecting}
          />
          <Button 
            onClick={handleManualSubmit} 
            variant="outline"
            disabled={isDetecting || !location.trim()}
          >
            {t.steps.location.manual}
          </Button>
        </div>
      </div>
    </div>
  )
}

