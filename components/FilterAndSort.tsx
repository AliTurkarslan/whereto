'use client'

import { useState, useMemo, memo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { X, Filter, Search, SortAsc, SortDesc, Check } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { getTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/lib/hooks/useDebounce'

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
  // Özellik filtreleri için
  takeout?: boolean
  delivery?: boolean
  dineIn?: boolean
  outdoorSeating?: boolean
  reservable?: boolean
  goodForChildren?: boolean
  goodForGroups?: boolean
  liveMusic?: boolean
  restroom?: boolean
  servesVegetarianFood?: boolean
  accessibilityOptions?: {
    wheelchairAccessibleEntrance?: boolean
    wheelchairAccessibleSeating?: boolean
    wheelchairAccessibleParking?: boolean
    wheelchairAccessibleRestroom?: boolean
  }
  parkingOptions?: {
    freeParkingLot?: boolean
    freeGarageParking?: boolean
    parkingLot?: boolean
    parkingGarage?: boolean
  }
  paymentOptions?: {
    acceptsCreditCards?: boolean
    acceptsDebitCards?: boolean
    acceptsNfc?: boolean
  }
}

interface FilterAndSortProps {
  places: Place[]
  onFilteredPlacesChange: (places: Place[]) => void
  locale?: 'tr' | 'en'
}

type SortOption = 'score-desc' | 'score-asc' | 'distance-asc' | 'distance-desc' | 'rating-desc' | 'rating-asc' | 'name-asc' | 'name-desc'

export const FilterAndSort = memo(function FilterAndSort({ places, onFilteredPlacesChange, locale = 'tr' }: FilterAndSortProps) {
  const t = getTranslations(locale)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300) // Debounce search input
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100])
  const [maxDistance, setMaxDistance] = useState<number | null>(null)
  const [minRating, setMinRating] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('score-desc')
  const [showFilters, setShowFilters] = useState(false)
  
  // Özellik filtreleri
  const [features, setFeatures] = useState<{
    takeout?: boolean
    delivery?: boolean
    dineIn?: boolean
    outdoorSeating?: boolean
    reservable?: boolean
    goodForChildren?: boolean
    goodForGroups?: boolean
    liveMusic?: boolean
    restroom?: boolean
    vegetarian?: boolean
    wheelchairAccessible?: boolean
    parking?: boolean
    cardPayment?: boolean
  }>({})

  // Filtered and sorted places
  const filteredAndSortedPlaces = useMemo(() => {
    let filtered = [...places]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(place => 
        place.name.toLowerCase().includes(query) ||
        place.address.toLowerCase().includes(query)
      )
    }

    // Score range filter
    filtered = filtered.filter(place => 
      place.score >= scoreRange[0] && place.score <= scoreRange[1]
    )

    // Distance filter
    if (maxDistance !== null) {
      filtered = filtered.filter(place => 
        place.distance !== undefined && place.distance <= maxDistance
      )
    }

    // Rating filter
    if (minRating !== null) {
      filtered = filtered.filter(place => 
        place.rating !== undefined && place.rating >= minRating
      )
    }

    // Özellik filtreleri
    if (features.takeout !== undefined) {
      filtered = filtered.filter(place => place.takeout === features.takeout)
    }
    if (features.delivery !== undefined) {
      filtered = filtered.filter(place => place.delivery === features.delivery)
    }
    if (features.dineIn !== undefined) {
      filtered = filtered.filter(place => place.dineIn === features.dineIn)
    }
    if (features.outdoorSeating !== undefined) {
      filtered = filtered.filter(place => place.outdoorSeating === features.outdoorSeating)
    }
    if (features.reservable !== undefined) {
      filtered = filtered.filter(place => place.reservable === features.reservable)
    }
    if (features.goodForChildren !== undefined) {
      filtered = filtered.filter(place => place.goodForChildren === features.goodForChildren)
    }
    if (features.goodForGroups !== undefined) {
      filtered = filtered.filter(place => place.goodForGroups === features.goodForGroups)
    }
    if (features.liveMusic !== undefined) {
      filtered = filtered.filter(place => place.liveMusic === features.liveMusic)
    }
    if (features.restroom !== undefined) {
      filtered = filtered.filter(place => place.restroom === features.restroom)
    }
    if (features.vegetarian !== undefined) {
      filtered = filtered.filter(place => place.servesVegetarianFood === features.vegetarian)
    }
    if (features.wheelchairAccessible !== undefined) {
      filtered = filtered.filter(place => {
        const accessible = place.accessibilityOptions?.wheelchairAccessibleEntrance ||
                          place.accessibilityOptions?.wheelchairAccessibleSeating ||
                          place.accessibilityOptions?.wheelchairAccessibleParking ||
                          place.accessibilityOptions?.wheelchairAccessibleRestroom
        return accessible === features.wheelchairAccessible
      })
    }
    if (features.parking !== undefined) {
      filtered = filtered.filter(place => {
        const hasParking = place.parkingOptions?.parkingLot ||
                          place.parkingOptions?.parkingGarage ||
                          place.parkingOptions?.freeParkingLot ||
                          place.parkingOptions?.freeGarageParking
        return hasParking === features.parking
      })
    }
    if (features.cardPayment !== undefined) {
      filtered = filtered.filter(place => {
        const acceptsCard = place.paymentOptions?.acceptsCreditCards ||
                           place.paymentOptions?.acceptsDebitCards ||
                           place.paymentOptions?.acceptsNfc
        return acceptsCard === features.cardPayment
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score-desc':
          return b.score - a.score
        case 'score-asc':
          return a.score - b.score
        case 'distance-asc':
          return (a.distance || Infinity) - (b.distance || Infinity)
        case 'distance-desc':
          return (b.distance || Infinity) - (a.distance || Infinity)
        case 'rating-desc':
          return (b.rating || 0) - (a.rating || 0)
        case 'rating-asc':
          return (a.rating || 0) - (b.rating || 0)
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        default:
          return 0
      }
    })

    return filtered
  }, [places, searchQuery, scoreRange, maxDistance, minRating, sortBy, features])

  // Update parent when filtered places change
  useMemo(() => {
    onFilteredPlacesChange(filteredAndSortedPlaces)
  }, [filteredAndSortedPlaces, onFilteredPlacesChange])

  const hasActiveFilters = searchQuery.trim() !== '' || 
    scoreRange[0] !== 0 || scoreRange[1] !== 100 ||
    maxDistance !== null || minRating !== null ||
    Object.values(features).some(v => v !== undefined)

  const clearFilters = () => {
    setSearchQuery('')
    setScoreRange([0, 100])
    setMaxDistance(null)
    setMinRating(null)
    setSortBy('score-desc')
    setFeatures({})
    // Haptic feedback (if available)
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }

  // Calculate max distance from places
  const maxDistanceFromPlaces = useMemo(() => {
    const distances = places
      .map(p => p.distance)
      .filter((d): d is number => d !== undefined)
    return distances.length > 0 ? Math.max(...distances) : 10
  }, [places])

  // Calculate max rating from places
  const maxRatingFromPlaces = useMemo(() => {
    const ratings = places
      .map(p => p.rating)
      .filter((r): r is number => r !== undefined)
    return ratings.length > 0 ? Math.max(...ratings) : 5
  }, [places])

  return (
    <div className="space-y-4">
      {/* Search and Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-200" />
          <Input
            placeholder={locale === 'tr' ? 'Mekan ara...' : 'Search places...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
          />
        </div>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score-desc">
              {locale === 'tr' ? 'Skor (Yüksek → Düşük)' : 'Score (High → Low)'}
            </SelectItem>
            <SelectItem value="score-asc">
              {locale === 'tr' ? 'Skor (Düşük → Yüksek)' : 'Score (Low → High)'}
            </SelectItem>
            <SelectItem value="distance-asc">
              {locale === 'tr' ? 'Mesafe (Yakın → Uzak)' : 'Distance (Near → Far)'}
            </SelectItem>
            <SelectItem value="distance-desc">
              {locale === 'tr' ? 'Mesafe (Uzak → Yakın)' : 'Distance (Far → Near)'}
            </SelectItem>
            <SelectItem value="rating-desc">
              {locale === 'tr' ? 'Puan (Yüksek → Düşük)' : 'Rating (High → Low)'}
            </SelectItem>
            <SelectItem value="rating-asc">
              {locale === 'tr' ? 'Puan (Düşük → Yüksek)' : 'Rating (Low → High)'}
            </SelectItem>
            <SelectItem value="name-asc">
              {locale === 'tr' ? 'İsim (A → Z)' : 'Name (A → Z)'}
            </SelectItem>
            <SelectItem value="name-desc">
              {locale === 'tr' ? 'İsim (Z → A)' : 'Name (Z → A)'}
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Filter Toggle */}
        <Button
          variant={showFilters ? 'default' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
          className="w-full sm:w-auto"
        >
          <Filter className="h-4 w-4 mr-2" />
          {locale === 'tr' ? 'Filtreler' : 'Filters'}
          {hasActiveFilters && (
            <span className="ml-2 px-1.5 py-0.5 bg-primary-foreground text-primary text-xs rounded-full">
              {[
                searchQuery.trim() && '1',
                (scoreRange[0] !== 0 || scoreRange[1] !== 100) && '1',
                maxDistance !== null && '1',
                minRating !== null && '1',
              ].filter(Boolean).length}
            </span>
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">
              {locale === 'tr' ? 'Filtreler' : 'Filters'}
            </h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                {locale === 'tr' ? 'Temizle' : 'Clear'}
              </Button>
            )}
          </div>

          {/* Score Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {locale === 'tr' ? 'Uygunluk Skoru' : 'Suitability Score'}: {scoreRange[0]}% - {scoreRange[1]}%
            </label>
            <Slider
              value={[scoreRange[0], scoreRange[1]]}
              onValueChange={(value) => setScoreRange([value[0], value[1]])}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Distance Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {locale === 'tr' ? 'Maksimum Mesafe' : 'Maximum Distance'} (km)
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={locale === 'tr' ? 'Tümü' : 'All'}
                value={maxDistance === null ? '' : maxDistance}
                onChange={(e) => {
                  const value = e.target.value
                  setMaxDistance(value === '' ? null : Math.max(0, parseFloat(value) || 0))
                }}
                min={0}
                max={maxDistanceFromPlaces}
                step={0.5}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMaxDistance(null)}
                disabled={maxDistance === null}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {locale === 'tr' 
                ? `Maksimum: ${maxDistanceFromPlaces.toFixed(1)} km`
                : `Max: ${maxDistanceFromPlaces.toFixed(1)} km`}
            </p>
          </div>

          {/* Rating Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {locale === 'tr' ? 'Minimum Puan' : 'Minimum Rating'} (⭐)
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={locale === 'tr' ? 'Tümü' : 'All'}
                value={minRating === null ? '' : minRating}
                onChange={(e) => {
                  const value = e.target.value
                  setMinRating(value === '' ? null : Math.max(0, Math.min(5, parseFloat(value) || 0)))
                }}
                min={0}
                max={maxRatingFromPlaces}
                step={0.1}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMinRating(null)}
                disabled={minRating === null}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {locale === 'tr' 
                ? `Maksimum: ${maxRatingFromPlaces.toFixed(1)} ⭐`
                : `Max: ${maxRatingFromPlaces.toFixed(1)} ⭐`}
            </p>
          </div>

          {/* Özellik Filtreleri */}
          <div className="space-y-3 pt-2 border-t border-border">
            <h4 className="text-sm font-semibold">
              {locale === 'tr' ? 'Özellikler' : 'Features'}
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Service Options */}
              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={features.takeout === true}
                  onCheckedChange={(checked) => 
                    setFeatures(prev => ({ ...prev, takeout: checked ? true : undefined }))
                  }
                />
                <span className="text-sm">{locale === 'tr' ? 'Paket Servis' : 'Takeout'}</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={features.delivery === true}
                  onCheckedChange={(checked) => 
                    setFeatures(prev => ({ ...prev, delivery: checked ? true : undefined }))
                  }
                />
                <span className="text-sm">{locale === 'tr' ? 'Teslimat' : 'Delivery'}</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={features.dineIn === true}
                  onCheckedChange={(checked) => 
                    setFeatures(prev => ({ ...prev, dineIn: checked ? true : undefined }))
                  }
                />
                <span className="text-sm">{locale === 'tr' ? 'Yerinde Yemek' : 'Dine In'}</span>
              </label>
              
              {/* Amenities */}
              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={features.outdoorSeating === true}
                  onCheckedChange={(checked) => 
                    setFeatures(prev => ({ ...prev, outdoorSeating: checked ? true : undefined }))
                  }
                />
                <span className="text-sm">{locale === 'tr' ? 'Dış Mekan' : 'Outdoor'}</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={features.reservable === true}
                  onCheckedChange={(checked) => 
                    setFeatures(prev => ({ ...prev, reservable: checked ? true : undefined }))
                  }
                />
                <span className="text-sm">{locale === 'tr' ? 'Rezervasyon' : 'Reservable'}</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={features.restroom === true}
                  onCheckedChange={(checked) => 
                    setFeatures(prev => ({ ...prev, restroom: checked ? true : undefined }))
                  }
                />
                <span className="text-sm">{locale === 'tr' ? 'Tuvalet' : 'Restroom'}</span>
              </label>
              
              {/* Good For */}
              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={features.goodForChildren === true}
                  onCheckedChange={(checked) => 
                    setFeatures(prev => ({ ...prev, goodForChildren: checked ? true : undefined }))
                  }
                />
                <span className="text-sm">{locale === 'tr' ? 'Çocuk Dostu' : 'Kids Friendly'}</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={features.goodForGroups === true}
                  onCheckedChange={(checked) => 
                    setFeatures(prev => ({ ...prev, goodForGroups: checked ? true : undefined }))
                  }
                />
                <span className="text-sm">{locale === 'tr' ? 'Grup İçin' : 'For Groups'}</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={features.liveMusic === true}
                  onCheckedChange={(checked) => 
                    setFeatures(prev => ({ ...prev, liveMusic: checked ? true : undefined }))
                  }
                />
                <span className="text-sm">{locale === 'tr' ? 'Canlı Müzik' : 'Live Music'}</span>
              </label>
              
              {/* Food Options */}
              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={features.vegetarian === true}
                  onCheckedChange={(checked) => 
                    setFeatures(prev => ({ ...prev, vegetarian: checked ? true : undefined }))
                  }
                />
                <span className="text-sm">{locale === 'tr' ? 'Vejetaryen' : 'Vegetarian'}</span>
              </label>
              
              {/* Accessibility */}
              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={features.wheelchairAccessible === true}
                  onCheckedChange={(checked) => 
                    setFeatures(prev => ({ ...prev, wheelchairAccessible: checked ? true : undefined }))
                  }
                />
                <span className="text-sm">{locale === 'tr' ? 'Engelli Erişimi' : 'Wheelchair Access'}</span>
              </label>
              
              {/* Parking */}
              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={features.parking === true}
                  onCheckedChange={(checked) => 
                    setFeatures(prev => ({ ...prev, parking: checked ? true : undefined }))
                  }
                />
                <span className="text-sm">{locale === 'tr' ? 'Otopark' : 'Parking'}</span>
              </label>
              
              {/* Payment */}
              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={features.cardPayment === true}
                  onCheckedChange={(checked) => 
                    setFeatures(prev => ({ ...prev, cardPayment: checked ? true : undefined }))
                  }
                />
                <span className="text-sm">{locale === 'tr' ? 'Kart Ödeme' : 'Card Payment'}</span>
              </label>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
})

