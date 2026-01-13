'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Navigation, Maximize2, Minimize2, Map as MapIcon, Satellite, Layers, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getMapsLink, getDirectionsLink } from '@/lib/google-apis/maps-embed'

// Leaflet default icon sorununu düzelt
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

// Dynamic import to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
)

interface Place {
  name: string
  address: string
  lat?: number
  lng?: number
  score?: number
  rating?: number
  distance?: number
  googleMapsId?: string
  placeId?: string
}

interface MapViewProps {
  places: Place[]
  userLocation?: { lat: number; lng: number }
  className?: string
  onPlaceClick?: (place: Place) => void
  height?: string
  showHighScoreOnly?: boolean
  locale?: 'tr' | 'en'
  onOpenInGoogleMaps?: (place: Place) => void
}

// Score'a göre renk belirle
function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981' // green
  if (score >= 60) return '#f59e0b' // amber
  return '#ef4444' // red
}

// Özel marker icon oluştur
function createCustomIcon(score: number, isUser: boolean = false, isHover: boolean = false) {
  const color = isUser ? '#3b82f6' : getScoreColor(score)
  const size = isHover ? 40 : 32
  const strokeWidth = isHover ? 3 : 2
  
  const svgIcon = `
    <svg width="${size}" height="${size * 1.25}" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24s16-14 16-24c0-8.837-7.163-16-16-16z" fill="${color}" stroke="#fff" stroke-width="${strokeWidth}"/>
      <circle cx="16" cy="16" r="8" fill="#fff"/>
      <text x="16" y="20" font-size="10" font-weight="bold" text-anchor="middle" fill="${color}">${Math.round(score)}</text>
    </svg>
  `
  
  return L.divIcon({
    className: `custom-marker ${isHover ? 'marker-hover' : ''}`,
    html: svgIcon,
    iconSize: [size, size * 1.25],
    iconAnchor: [size / 2, size * 1.25],
    popupAnchor: [0, -(size * 1.25)],
  })
}

// Kullanıcı konumu için özel icon
function createUserIcon() {
  const svgIcon = `
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="#fff" stroke-width="2"/>
      <circle cx="12" cy="12" r="6" fill="#fff"/>
    </svg>
  `
  
  return L.divIcon({
    className: 'user-marker',
    html: svgIcon,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  })
}

// Map Controls Component
function MapControls({ 
  userLocation, 
  onReturnToUser, 
  onShowAll,
  onToggleHighScore,
  showHighScoreOnly,
  locale = 'tr'
}: {
  userLocation?: { lat: number; lng: number }
  onReturnToUser: () => void
  onShowAll: () => void
  onToggleHighScore: () => void
  showHighScoreOnly: boolean
  locale?: 'tr' | 'en'
}) {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
      {userLocation && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReturnToUser}
          className="bg-background/95 backdrop-blur-sm shadow-lg"
          title={locale === 'tr' ? 'Konumuma dön' : 'Return to my location'}
        >
          <Navigation className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={onShowAll}
        className="bg-background/95 backdrop-blur-sm shadow-lg"
        title={locale === 'tr' ? 'Tümünü göster' : 'Show all'}
      >
        <MapIcon className="h-4 w-4" />
      </Button>
      <Button
        variant={showHighScoreOnly ? 'default' : 'outline'}
        size="sm"
        onClick={onToggleHighScore}
        className="bg-background/95 backdrop-blur-sm shadow-lg"
        title={locale === 'tr' ? 'Sadece yüksek skorlu mekanlar' : 'High score only'}
      >
        <Layers className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function MapView({ places, userLocation, className, onPlaceClick, height, showHighScoreOnly: initialShowHighScoreOnly = false, locale = 'tr', onOpenInGoogleMaps }: MapViewProps) {
  const [showHighScoreOnly, setShowHighScoreOnly] = useState(initialShowHighScoreOnly)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const validPlaces = useMemo(() => {
    let filtered = places.filter((p) => p.lat && p.lng)
    if (showHighScoreOnly) {
      filtered = filtered.filter((p) => (p.score || 0) >= 80)
    }
    return filtered
  }, [places, showHighScoreOnly])

  // Map control handlers
  const handleReturnToUser = () => {
    // Scroll to top of results (user location is shown on map)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleShowAll = () => {
    // Scroll to map
    const mapElement = document.querySelector('.leaflet-container')
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleToggleFullscreen = () => {
    if (!isFullscreen) {
      const mapContainer = document.querySelector('.leaflet-container')?.parentElement
      if (mapContainer) {
        mapContainer.requestFullscreen?.()
        setIsFullscreen(true)
      }
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])
  
  // Center ve bounds hesapla (hooks her zaman aynı sırada çağrılmalı)
  const mapCenter = useMemo(() => {
    if (validPlaces.length > 0) {
      const avgLat = validPlaces.reduce((sum, p) => sum + p.lat!, 0) / validPlaces.length
      const avgLng = validPlaces.reduce((sum, p) => sum + p.lng!, 0) / validPlaces.length
      return [avgLat, avgLng] as [number, number]
    } else if (userLocation) {
      return [userLocation.lat, userLocation.lng] as [number, number]
    }
    return [41.0082, 28.9784] as [number, number] // İstanbul default
  }, [validPlaces, userLocation])

  // Zoom seviyesi - mekanların dağılımına göre
  const zoom = useMemo(() => {
    if (validPlaces.length === 0) return 13
    if (validPlaces.length === 1) return 15
    
    // Mekanlar arası mesafeyi hesapla
    const distances: number[] = []
    for (let i = 0; i < validPlaces.length; i++) {
      for (let j = i + 1; j < validPlaces.length; j++) {
        const p1 = validPlaces[i]
        const p2 = validPlaces[j]
        const dist = Math.sqrt(
          Math.pow(p1.lat! - p2.lat!, 2) + Math.pow(p1.lng! - p2.lng!, 2)
        )
        distances.push(dist)
      }
    }
    const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length
    
    if (avgDist > 0.05) return 11 // Çok dağınık
    if (avgDist > 0.02) return 12 // Orta
    return 13 // Yakın
  }, [validPlaces])

  if (validPlaces.length === 0 && !userLocation) {
    return (
      <div className={`h-96 bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center border-2 border-dashed ${className || ''}`}>
        <div className="text-center space-y-2">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
          <p className="text-muted-foreground font-medium">Harita verisi yok</p>
        </div>
      </div>
    )
  }

      return (
        <div className={className}>
          <div className="relative rounded-xl overflow-hidden border-2 border-border shadow-lg">
            <MapContainer
              center={mapCenter}
              zoom={zoom}
              className={height ? `w-full z-0 ${height}` : "h-96 w-full z-0"}
              scrollWheelZoom={true}
              zoomControl={true}
            >
          {/* Modern tile layer - CartoDB Positron (Google Maps benzeri) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            // Alternatif: Google Maps benzeri görünüm için
            // url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Kullanıcı konumu - mavi nokta */}
          {userLocation && (
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={8}
              pathOptions={{
                fillColor: '#3b82f6',
                fillOpacity: 0.8,
                color: '#fff',
                weight: 3,
              }}
            >
              <Popup>
                <div className="flex items-center gap-2 p-1">
                  <Navigation className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-sm">Sen buradasın</span>
                </div>
              </Popup>
            </CircleMarker>
          )}
          
          {/* Mekanlar - score'a göre renkli marker'lar */}
          {validPlaces.map((place, index) => {
            const score = place.score || 50
            const icon = createCustomIcon(score)
            
            return (
              <Marker
                key={`${place.name}-${index}`}
                position={[place.lat!, place.lng!]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    if (onPlaceClick) {
                      onPlaceClick(place)
                    }
                  },
                  mouseover: (e) => {
                    const marker = e.target
                    marker.setZIndexOffset(1000)
                    marker.setIcon(createCustomIcon(score, false, true)) // Hover state
                  },
                  mouseout: (e) => {
                    const marker = e.target
                    marker.setZIndexOffset(0)
                    marker.setIcon(icon) // Normal state
                  },
                }}
              >
                <Popup className="custom-popup">
                  <div className="min-w-[240px] space-y-3">
                    <div>
                      <h3 className="font-bold text-base mb-1">{place.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{place.address}</p>
                    </div>
                    
                    <div className="flex items-center gap-3 pt-2 border-t border-border">
                      {place.score !== undefined && (
                        <div className="flex items-center gap-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getScoreColor(score) }}
                          />
                          <span className="text-sm font-semibold">{score}%</span>
                          <span className="text-xs text-muted-foreground">uygun</span>
                        </div>
                      )}
                      
                      {place.rating && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">⭐</span>
                          <span className="text-sm font-medium">{place.rating.toFixed(1)}</span>
                        </div>
                      )}
                      
                      {place.distance && (
                        <div className="text-xs text-muted-foreground">
                          {place.distance.toFixed(1)} km
                        </div>
                      )}
                    </div>

                    {/* Google Maps Link in Popup */}
                    {place.lat && place.lng && (
                      <div className="pt-2 border-t border-border">
                        <a
                          href={getMapsLink(place)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (onOpenInGoogleMaps) {
                              onOpenInGoogleMaps(place)
                            }
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>{locale === 'tr' ? 'Google Maps\'te Aç' : 'Open in Google Maps'}</span>
                        </a>
                        {userLocation && (
                          <a
                            href={getDirectionsLink(userLocation, { lat: place.lat!, lng: place.lng! })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full mt-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-xs font-medium hover:bg-secondary/80 transition-colors border border-border"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Navigation className="h-3 w-3" />
                            <span>{locale === 'tr' ? 'Yol Tarifi' : 'Directions'}</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
        
        {/* Harita üstü bilgi */}
        <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-border z-[1000]">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-medium">
              {validPlaces.length} mekan
              {showHighScoreOnly && ' (80%+)'}
            </span>
          </div>
        </div>

        {/* Map Controls */}
        <MapControls
          userLocation={userLocation}
          onReturnToUser={handleReturnToUser}
          onShowAll={handleShowAll}
          onToggleHighScore={() => setShowHighScoreOnly(!showHighScoreOnly)}
          showHighScoreOnly={showHighScoreOnly}
          locale={locale}
        />
        
        {/* Fullscreen Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleFullscreen}
          className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm shadow-lg z-[1000]"
          title={isFullscreen ? (locale === 'tr' ? 'Tam ekrandan çık' : 'Exit fullscreen') : (locale === 'tr' ? 'Tam ekran' : 'Fullscreen')}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-border z-[1000]">
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>80%+ Uygun</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>60-79% Uygun</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>&lt;60% Uygun</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
