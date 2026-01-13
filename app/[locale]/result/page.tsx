'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useParams, useRouter } from 'next/navigation'
import { MapView } from '@/components/MapView'
import { SkeletonCard } from '@/components/SkeletonCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { getTranslations } from '@/lib/i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { ReviewCategory } from '@/lib/types/review'
import { FilterAndSort } from '@/components/FilterAndSort'
import { ViewToggle, ViewMode } from '@/components/ViewToggle'
import { GoogleMapsBulkAction } from '@/components/GoogleMapsBulkAction'
import { EmptyState } from '@/components/EmptyState'
import { ResultCardCompact } from '@/components/ResultCardCompact'
import { FeedbackButton } from '@/components/FeedbackButton'
import { logger } from '@/lib/logging/logger'

export interface Place {
  name: string
  address: string
  score: number
  why: string
  risks?: string
  distance?: number
  rating?: number
  lat?: number
  lng?: number
  reviewCategories?: ReviewCategory[]
  analyzedReviewCount?: number
  totalReviewCount?: number
  googleMapsId?: string
  placeId?: string
  // Yeni alanlar
  phone?: string
  website?: string
  openingHours?: {
    weekdayDescriptions?: string[]
    openNow?: boolean
  } | string[]
  photos?: Array<{
    name: string
    widthPx?: number
    heightPx?: number
  }>
  editorialSummary?: string
  businessStatus?: string
  plusCode?: string
  priceLevel?: string | number
  // Kapsamlı Google Places API alanları
  shortFormattedAddress?: string
  addressComponents?: Array<{
    longText: string
    shortText: string
    types: string[]
    languageCode?: string
  }>
  viewport?: {
    low: { latitude: number; longitude: number }
    high: { latitude: number; longitude: number }
  }
  primaryType?: string
  primaryTypeDisplayName?: string
  accessibilityOptions?: {
    wheelchairAccessibleParking?: boolean
    wheelchairAccessibleEntrance?: boolean
    wheelchairAccessibleRestroom?: boolean
    wheelchairAccessibleSeating?: boolean
  }
  evChargingOptions?: {
    connectorCount?: number
    connectorAggregation?: Array<{
      type?: string
      count?: number
    }>
  }
  fuelOptions?: {
    fuelPrices?: Array<{
      type: string
      price: {
        units: string
        nanos: number
        currencyCode: string
      }
      updateTime?: string
    }>
  }
  goodForChildren?: boolean
  goodForGroups?: boolean
  goodForWatchingSports?: boolean
  indoorOptions?: {
    indoorSeating?: boolean
    indoorOutdoorSeating?: boolean
  }
  liveMusic?: boolean
  menuForChildren?: boolean
  outdoorSeating?: boolean
  parkingOptions?: {
    parkingLot?: boolean
    parkingGarage?: boolean
    streetParking?: boolean
    valetParking?: boolean
    freeGarageParking?: boolean
    freeParkingLot?: boolean
    paidParkingLot?: boolean
    paidParkingGarage?: boolean
    paidStreetParking?: boolean
    valetParkingAvailable?: boolean
  }
  paymentOptions?: {
    acceptsCreditCards?: boolean
    acceptsDebitCards?: boolean
    acceptsCashOnly?: boolean
    acceptsNfc?: boolean
  }
  reservable?: boolean
  restroom?: boolean
  servesBreakfast?: boolean
  servesBrunch?: boolean
  servesDinner?: boolean
  servesLunch?: boolean
  servesBeer?: boolean
  servesWine?: boolean
  servesCocktails?: boolean
  servesVegetarianFood?: boolean
  takeout?: boolean
  delivery?: boolean
  dineIn?: boolean
  subDestinations?: Array<{
    id: string
    displayName: string
  }>
  currentSecondaryOpeningHours?: Array<{
    weekdayDescriptions?: string[]
    openNow?: boolean
  }>
}

export default function ResultPage() {
  const searchParams = useSearchParams()
  const params = useParams()
  const router = useRouter()
  const locale = (params.locale as 'tr' | 'en') || 'tr'
  const t = getTranslations(locale)
  
  const [places, setPlaces] = useState<Place[]>([])
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Default view mode: split (bölünmüş görünüm)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('whereto-view-mode')
      if (saved && (saved === 'list' || saved === 'split')) {
        return saved as ViewMode
      }
    }
    // Default: split (bölünmüş görünüm)
    return 'split'
  })

  // Save view mode to localStorage
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('whereto-view-mode', mode)
    }
  }

  // Responsive view mode adjustment - mobilde split yerine list kullan
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const isMobile = window.innerWidth < 1024
        // Eğer mobilde split görünümü seçiliyse, liste'ye geç
        if (isMobile && viewMode === 'split') {
          setViewMode('list')
        }
      }
    }

    // İlk yüklemede kontrol et
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 1024
      if (isMobile && viewMode === 'split') {
        setViewMode('list')
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [viewMode])

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const lat = searchParams.get('lat')
        const lng = searchParams.get('lng')
        const address = searchParams.get('address')
        const category = searchParams.get('category')
        const companion = searchParams.get('companion')

        if (!lat || !lng || !category || !companion) {
          setError('Eksik parametreler: Konum, kategori ve yanındaki bilgisi gereklidir.')
          setLoading(false)
          return
        }

        // Koordinat validasyonu
        const latNum = parseFloat(lat)
        const lngNum = parseFloat(lng)
        
        if (isNaN(latNum) || isNaN(lngNum) || latNum === 0 || lngNum === 0) {
          setError('Geçersiz konum koordinatları. Lütfen tekrar deneyin.')
          setLoading(false)
          return
        }

        // Yeni faktörleri URL'den al
        const budget = searchParams.get('budget')
        const atmosphere = searchParams.get('atmosphere')
        const mealType = searchParams.get('mealType')
        const specialNeedsParam = searchParams.get('specialNeeds')

        const response = await fetch('/api/recommend', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lat: latNum,
            lng: lngNum,
            address: address || '',
            category,
            companion,
            budget: budget || undefined,
            atmosphere: atmosphere || undefined,
            mealType: mealType || undefined,
            specialNeeds: specialNeedsParam || undefined,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.details || errorData.error || 'Öneriler alınırken bir hata oluştu'
          throw new Error(errorMessage)
        }

        const data = await response.json()
        if (data.error) {
          throw new Error(data.details || data.error)
        }
        
        // Places array kontrolü
        if (!Array.isArray(data.places)) {
          logger.warn('Invalid places data', { data, error: 'Places data is not an array' })
          setPlaces([])
          setFilteredPlaces([])
        } else {
          setPlaces(data.places)
          setFilteredPlaces(data.places) // İlk yüklemede tüm mekanları göster
        }
      } catch (err) {
        logger.error('Fetch error', err instanceof Error ? err : new Error(String(err)), { 
          lat: searchParams.get('lat'), 
          lng: searchParams.get('lng'), 
          category: searchParams.get('category'), 
          companion: searchParams.get('companion') 
        })
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft p-4 sm:p-6 animate-in fade-in duration-300">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header with loading state */}
          <div className="text-center py-8 space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-gradient animate-pulse">
                {t.results.title}
              </h1>
              <div className="h-2 w-32 bg-muted rounded-full mx-auto animate-pulse" />
            </div>
            <LoadingSpinner size="lg" text={t.common.loading} className="mt-6" variant="dots" />
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '200ms' }}>
              <p className="text-sm text-muted-foreground font-medium">
                {locale === 'tr' 
                  ? 'Size en uygun mekanları buluyoruz...'
                  : 'Finding the best places for you...'}
              </p>
              <p className="text-xs text-muted-foreground/70">
                {locale === 'tr'
                  ? 'Bu işlem birkaç saniye sürebilir'
                  : 'This may take a few seconds'}
              </p>
            </div>
          </div>
          
          {/* Skeleton cards with staggered animation */}
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className="animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${i * 100}ms`, animationDuration: '400ms' }}
              >
                <SkeletonCard variant={viewMode === 'list' ? 'compact' : 'full'} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-soft animate-in fade-in duration-300">
        <div className="max-w-md w-full">
          <ErrorDisplay 
            error={error} 
            onRetry={() => {
              setError(null)
              setLoading(true)
              window.location.reload()
            }}
            locale={locale}
          />
        </div>
      </div>
    )
  }

  const userLat = searchParams.get('lat')
  const userLng = searchParams.get('lng')
  const userLocation = userLat && userLng
    ? { lat: parseFloat(userLat), lng: parseFloat(userLng) }
    : undefined

  return (
    <div className="min-h-screen bg-gradient-soft p-4 sm:p-6 animate-in fade-in duration-500">
      <a href="#results" className="skip-to-content">
        {locale === 'tr' ? 'İçeriğe geç' : 'Skip to content'}
      </a>
      <FeedbackButton locale={locale} />
      <div className="max-w-7xl mx-auto space-y-6" id="results" role="main" aria-label={locale === 'tr' ? 'Mekan sonuçları' : 'Place results'}>
        <div className="text-center py-4 sm:py-6 space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gradient">
            {t.results.title}
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg px-2">
            {searchParams.get('address')} • {t.steps.category[searchParams.get('category') as keyof typeof t.steps.category]}
          </p>
          {places.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="text-primary font-semibold">{places.length}</span>
                <span>{locale === 'tr' ? 'mekan analiz edildi' : 'places analyzed'}</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center gap-1">
                <span className="text-primary">⭐</span>
                <span>{locale === 'tr' ? 'En uygun olanlar üstte' : 'Most suitable at top'}</span>
              </div>
              {filteredPlaces.length > 0 && filteredPlaces[0].score >= 70 && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                    {locale === 'tr' ? 'En iyi seçim işaretlendi' : 'Best choice marked'}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {places.length === 0 ? (
          <EmptyState
            type="no-results"
            locale={locale}
            onNewSearch={() => router.push(`/${locale}`)}
          />
        ) : (
          <>
            {/* Filter, Sort, and View Toggle */}
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                {/* View Toggle and Google Maps Action - Üstte, daha görünür */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-card/50 rounded-lg border border-border/50 backdrop-blur-sm shadow-sm">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-sm font-medium text-foreground">
                      <span className="text-primary font-bold text-base">{filteredPlaces.length}</span>{' '}
                      {locale === 'tr' 
                        ? 'mekan bulundu'
                        : 'places found'}
                    </div>
                    <GoogleMapsBulkAction
                      places={filteredPlaces}
                      locale={locale}
                    />
                  </div>
                  <ViewToggle
                    viewMode={viewMode}
                    onViewModeChange={handleViewModeChange}
                    locale={locale}
                  />
                </div>
                
                {/* Filter and Sort */}
                <FilterAndSort
                  places={places}
                  onFilteredPlacesChange={setFilteredPlaces}
                  locale={locale}
                />
              </div>
            </div>

            {/* Results based on view mode */}
            {filteredPlaces.length === 0 ? (
              <EmptyState
                type="no-filtered-results"
                locale={locale}
                onClearFilters={() => {
                  // FilterAndSort component'ine clear filters sinyali göndermek için
                  // Şimdilik sadece filteredPlaces'ı reset ediyoruz
                  setFilteredPlaces(places)
                }}
              />
            ) : (
              <>
                {/* List View - Kompakt kartlar */}
                {viewMode === 'list' && (
                  <div className="space-y-3">
                    {filteredPlaces.map((place, index) => {
                      // En yüksek skorlu mekanı "En İyi Seçim" olarak işaretle
                      const isBestChoice = index === 0 && filteredPlaces.length > 0 && place.score >= 70
                      return (
                        <div 
                          key={`${place.name}-${index}`} 
                          id={`place-${place.name}`} 
                          className="scroll-mt-4 animate-in fade-in slide-in-from-bottom-4 transition-all duration-300"
                          style={{ 
                            animationDelay: `${Math.min(index * 50, 500)}ms`,
                            animationDuration: '400ms',
                            animationFillMode: 'both'
                          }}
                        >
                          <ResultCardCompact 
                            place={place} 
                            locale={locale}
                            userLocation={userLocation}
                            isBestChoice={isBestChoice}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Split View (Map + List) - Desktop için optimize */}
                {viewMode === 'split' && (
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.2fr] gap-4 lg:gap-6">
                    {/* Map Side - Sol taraf */}
                    <div className="space-y-4 order-2 lg:order-1 sticky top-4 self-start">
                      <MapView 
                        places={filteredPlaces} 
                        userLocation={userLocation}
                        locale={locale}
                        onPlaceClick={(place) => {
                          const element = document.getElementById(`place-${place.name}`)
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            element.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
                            setTimeout(() => {
                              element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
                            }, 2000)
                          }
                        }}
                        className="h-[400px] lg:h-[calc(100vh-200px)] lg:sticky lg:top-4"
                      />
                    </div>
                    
                    {/* List Side - Sağ taraf, scrollable, kompakt kartlar */}
                    <div className="space-y-3 order-1 lg:order-2">
                      {filteredPlaces.map((place, index) => {
                        const isBestChoice = index === 0 && filteredPlaces.length > 0 && place.score >= 70
                        return (
                          <div 
                            key={`${place.name}-${index}`} 
                            id={`place-${place.name}`} 
                            className="scroll-mt-4 animate-in fade-in slide-in-from-right-4"
                            style={{ 
                              animationDelay: `${Math.min(index * 50, 500)}ms`,
                              animationDuration: '300ms',
                              animationFillMode: 'both'
                            }}
                          >
                            <ResultCardCompact 
                              place={place} 
                              locale={locale}
                              userLocation={userLocation}
                              isBestChoice={isBestChoice}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

