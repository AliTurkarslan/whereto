'use client'

import { useState, memo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, AlertCircle, CheckCircle2, Star, Navigation, Clock, ExternalLink, ChevronDown, ChevronUp, MessageSquare, Shield, TrendingUp, Building2, Hash, Users, CreditCard, Car, Accessibility } from 'lucide-react'
import { PlaceFeatures } from './PlaceFeatures'
import { ReviewAnalysis } from './ReviewAnalysis'
import { ReviewCategory } from '@/lib/types/review'
import { getTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { getPriceLevelDescription, getPriceLevelBadgeColor, getPriceLevelIcon, type PriceLevel } from '@/lib/utils/price-level'
import { PlacePhoto } from './PlacePhoto'
import { PlacePhotoFromReference } from './PlacePhotoFromReference'
import { PlaceActions } from './PlaceActions'
import { getMapsLink, getDirectionsLink } from '@/lib/google-apis/maps-embed'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { BestChoiceBadge } from './BestChoiceBadge'
import { ScoreDisplay } from './ScoreDisplay'

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
  reviewCategories?: ReviewCategory[]
  phone?: string
  website?: string
  placeId?: string
  googleMapsId?: string
  priceLevel?: number | string
  openingHours?: {
    weekdayDescriptions?: string[]
    openNow?: boolean
  } | string[]
  analyzedReviewCount?: number // Analiz edilen yorum sayısı
  totalReviewCount?: number // Toplam yorum sayısı
  photos?: Array<{
    name: string
    widthPx?: number
    heightPx?: number
  }>
  editorialSummary?: string
  businessStatus?: string
  plusCode?: string
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

interface ResultCardCompactProps {
  place: Place
  locale?: 'tr' | 'en'
  userLocation?: { lat: number; lng: number }
  isBestChoice?: boolean
}

export const ResultCardCompact = memo(function ResultCardCompact({ place, locale = 'tr', userLocation, isBestChoice = false }: ResultCardCompactProps) {
  const t = getTranslations(locale)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  const [isExpanded, setIsExpanded] = useState(false)

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-gradient-to-br from-green-500 to-emerald-600'
    if (score >= 60) return 'bg-gradient-to-br from-yellow-500 to-amber-600'
    return 'bg-gradient-to-br from-orange-500 to-red-500'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return locale === 'tr' ? 'Çok Uygun' : 'Very Suitable'
    if (score >= 60) return locale === 'tr' ? 'Uygun' : 'Suitable'
    return locale === 'tr' ? 'Az Uygun' : 'Less Suitable'
  }

  const getScoreRingColor = (score: number) => {
    if (score >= 80) return 'ring-green-500/20'
    if (score >= 60) return 'ring-yellow-500/20'
    return 'ring-orange-500/20'
  }

  // Güvenilirlik seviyesi hesapla
  const getReliabilityLevel = (reviewCount: number = 0) => {
    if (reviewCount >= 50) return { level: 'high', label: locale === 'tr' ? 'Çok Güvenilir' : 'Very Reliable', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' }
    if (reviewCount >= 20) return { level: 'medium', label: locale === 'tr' ? 'Güvenilir' : 'Reliable', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' }
    if (reviewCount >= 5) return { level: 'low', label: locale === 'tr' ? 'Orta Güvenilir' : 'Moderately Reliable', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' }
    return { level: 'very-low', label: locale === 'tr' ? 'Az Güvenilir' : 'Less Reliable', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' }
  }

  const reliability = getReliabilityLevel(place.analyzedReviewCount || place.totalReviewCount)

  return (
    <Card className={cn(
      "w-full transition-all duration-300 border-2 relative",
      "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
      "group cursor-pointer",
      "hover:shadow-xl hover:scale-[1.01] hover:border-primary/50 hover:-translate-y-0.5",
      "active:scale-[0.99] active:shadow-lg",
      getScoreRingColor(place.score),
      isExpanded && "shadow-xl border-primary/50 scale-[1.01]",
      isBestChoice && "ring-2 ring-yellow-400/50 border-yellow-400/30 shadow-lg shadow-yellow-400/20 hover:ring-yellow-400/70"
    )}>
      <BestChoiceBadge isBest={isBestChoice} locale={locale} />
      {/* Kompakt Header - Her zaman görünür */}
      <CardHeader 
        className="pb-3 pt-4 px-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsExpanded(!isExpanded)
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={locale === 'tr' 
          ? `${place.name} - Detayları ${isExpanded ? 'gizle' : 'göster'}`
          : `${place.name} - ${isExpanded ? 'Hide' : 'Show'} details`}
      >
        <div className="flex items-start gap-3">
          {/* Score Display - Yeni Gelişmiş Tasarım */}
          <ScoreDisplay 
            score={place.score} 
            locale={locale}
            size="md"
            showLabel={false}
            showProgress={true}
            className="flex-shrink-0"
          />

          {/* İsim ve Adres */}
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="text-lg font-bold line-clamp-1 text-foreground leading-tight">
              {place.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="line-clamp-1">{place.address}</span>
            </div>
            
            {/* Temel Bilgiler - Inline badges */}
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {place.distance && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 transition-all duration-200 hover:bg-blue-100 dark:hover:bg-blue-950/50 hover:scale-105 group">
                  <Navigation className="h-3 w-3 text-blue-600 dark:text-blue-400 transition-transform duration-200 group-hover:rotate-12" />
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">{place.distance.toFixed(1)} km</span>
                </div>
              )}
              {place.rating && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 transition-all duration-200 hover:bg-amber-100 dark:hover:bg-amber-950/50 hover:scale-105 group">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500 transition-transform duration-200 group-hover:scale-110" />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{place.rating.toFixed(1)}</span>
                </div>
              )}
              {place.priceLevel !== undefined && (
                <div 
                  className={cn(
                    "px-2 py-0.5 rounded-full border",
                    getPriceLevelBadgeColor(place.priceLevel as PriceLevel)
                  )}
                  title={getPriceLevelDescription(place.priceLevel as PriceLevel, locale)}
                >
                  <span className="text-xs font-semibold">
                    {getPriceLevelIcon(place.priceLevel as PriceLevel)}
                  </span>
                </div>
              )}
              {/* Yorum Sayısı - Sadece Toplam */}
              {place.totalReviewCount !== undefined && place.totalReviewCount > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-900/50">
                  <MessageSquare className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {place.totalReviewCount} {locale === 'tr' ? 'yorum' : 'reviews'}
                  </span>
                </div>
              )}
              {/* Güvenilirlik Badge */}
              {reliability.level !== 'very-low' && (
                <div className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full border",
                  reliability.bg,
                  reliability.color.replace('text-', 'border-').replace('dark:text-', 'dark:border-')
                )}>
                  <Shield className="h-3 w-3" />
                  <span className="text-xs font-semibold">{reliability.label}</span>
                </div>
              )}
              {/* Score Label - Geliştirilmiş */}
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 h-auto",
                  "transition-all duration-200 hover:scale-105",
                  place.score >= 80 && "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-400 border-green-300 dark:border-green-800",
                  place.score >= 60 && place.score < 80 && "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 dark:from-yellow-900/30 dark:to-amber-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800",
                  place.score < 60 && "bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 dark:from-orange-900/30 dark:to-red-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-800"
                )}
              >
                <TrendingUp className={cn(
                  "h-2.5 w-2.5 mr-1",
                  place.score < 60 && "hidden"
                )} />
                {getScoreLabel(place.score)}
              </Badge>
            </div>
            
            {/* Hızlı Özellikler - Kompakt görünüm */}
            {(place.takeout || place.delivery || place.dineIn || place.outdoorSeating || place.reservable || place.goodForChildren) && (
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <PlaceFeatures
                  takeout={place.takeout}
                  delivery={place.delivery}
                  dineIn={place.dineIn}
                  outdoorSeating={place.outdoorSeating}
                  reservable={place.reservable}
                  goodForChildren={place.goodForChildren}
                  goodForGroups={place.goodForGroups}
                  locale={locale}
                  className="gap-1.5"
                />
              </div>
            )}
          </div>

          {/* Google Maps Quick Link */}
          {place.lat && place.lng && (
            <a
              href={getMapsLink(place)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shadow-sm hover:shadow-md"
              onClick={(e) => e.stopPropagation()}
              title={locale === 'tr' ? 'Google Maps\'te Aç' : 'Open in Google Maps'}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </CardHeader>

      {/* Expandable Content */}
      {isExpanded && (
        <CardContent className="pt-0 px-4 pb-4 space-y-4 border-t border-border/50 animate-in slide-in-from-top-2 fade-in duration-300">
          {/* Fotoğraf - Önce Google Places Photos, yoksa Street View */}
          {apiKey && (
            <div className="overflow-hidden rounded-lg border border-border/50 shadow-sm">
              {place.photos && Array.isArray(place.photos) && place.photos.length > 0 ? (
                // Google Places Photos kullan
                <PlacePhotoFromReference
                  photos={place.photos}
                  placeName={place.name}
                  apiKey={apiKey}
                  className="w-full"
                />
              ) : place.lat && place.lng ? (
                // Fallback: Street View
                <PlacePhoto
                  lat={place.lat}
                  lng={place.lng}
                  placeName={place.name}
                  apiKey={apiKey}
                  className="w-full"
                />
              ) : null}
            </div>
          )}


          {/* Why & Risks */}
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 rounded-lg p-4 border border-green-200/50 dark:border-green-900/50">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-green-900 dark:text-green-100">
                      {t.results.why}
                    </span>
                  </div>
                  <p className="text-xs text-green-800 dark:text-green-200 leading-relaxed">
                    {place.why}
                  </p>
                </div>
              </div>
            </div>

            {place.risks && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 rounded-lg p-4 border border-amber-200/50 dark:border-amber-900/50">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold text-sm text-amber-900 dark:text-amber-100 block mb-1">
                      {t.results.risks}
                    </span>
                    <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                      {place.risks}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Opening Hours - Geliştirilmiş */}
          {place.openingHours && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/30 dark:to-slate-900/20 border border-slate-200/50 dark:border-slate-800/50">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-lg flex-shrink-0",
                  typeof place.openingHours === 'object' && 
                  !Array.isArray(place.openingHours) && 
                  place.openingHours.openNow
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-slate-200 dark:bg-slate-800"
                )}>
                  <Clock className={cn(
                    "h-5 w-5",
                    typeof place.openingHours === 'object' && 
                    !Array.isArray(place.openingHours) && 
                    place.openingHours.openNow
                      ? "text-green-600 dark:text-green-400"
                      : "text-slate-600 dark:text-slate-400"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-foreground">
                      {locale === 'tr' ? 'Çalışma Saatleri' : 'Opening Hours'}
                    </span>
                    {typeof place.openingHours === 'object' && 
                     !Array.isArray(place.openingHours) && 
                     place.openingHours.openNow !== undefined && (
                      <Badge 
                        variant={place.openingHours.openNow ? "default" : "secondary"}
                        className={cn(
                          "text-xs font-semibold",
                          place.openingHours.openNow 
                            ? "bg-green-500 text-white animate-pulse"
                            : "bg-slate-500 text-white"
                        )}
                      >
                        {place.openingHours.openNow 
                          ? (locale === 'tr' ? '🟢 Açık' : '🟢 Open')
                          : (locale === 'tr' ? '🔴 Kapalı' : '🔴 Closed')}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    {(() => {
                      // Opening hours'ı güvenli şekilde parse et
                      let hoursToShow: string[] = []
                      
                      if (Array.isArray(place.openingHours)) {
                        hoursToShow = place.openingHours
                      } else if (place.openingHours && typeof place.openingHours === 'object') {
                        if (place.openingHours.weekdayDescriptions) {
                          hoursToShow = place.openingHours.weekdayDescriptions
                        }
                      }
                      
                      return hoursToShow.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {hoursToShow.map((hours, idx) => (
                            <p key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                              <span>{hours}</span>
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          {locale === 'tr' ? 'Çalışma saatleri bilgisi mevcut değil' : 'Opening hours not available'}
                        </p>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Secondary Opening Hours */}
          {place.currentSecondaryOpeningHours && Array.isArray(place.currentSecondaryOpeningHours) && place.currentSecondaryOpeningHours.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
              <h5 className="text-xs font-semibold text-foreground mb-2">
                {locale === 'tr' ? 'Ek Çalışma Saatleri' : 'Secondary Hours'}
              </h5>
              <div className="space-y-1">
                {place.currentSecondaryOpeningHours.map((hours, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground">
                    {typeof hours === 'object' && hours.weekdayDescriptions ? (
                      hours.weekdayDescriptions.map((desc, i) => (
                        <p key={i} className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                          <span>{desc}</span>
                        </p>
                      ))
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Editorial Summary */}
          {place.editorialSummary && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/50">
              <p className="text-xs text-blue-900 dark:text-blue-100 leading-relaxed italic">
                {place.editorialSummary}
              </p>
            </div>
          )}

          {/* Business Status */}
          {place.businessStatus && place.businessStatus !== 'OPERATIONAL' && (
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/50">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                {locale === 'tr' 
                  ? `Durum: ${place.businessStatus === 'CLOSED_PERMANENTLY' ? 'Kalıcı Olarak Kapalı' : 'Geçici Olarak Kapalı'}`
                  : `Status: ${place.businessStatus === 'CLOSED_PERMANENTLY' ? 'Permanently Closed' : 'Temporarily Closed'}`}
              </p>
            </div>
          )}

          {/* Özellikler - Sadeleştirilmiş */}
          <div className="pt-2 border-t border-border/50">
            <h4 className="text-xs font-semibold text-foreground mb-2">
              {locale === 'tr' ? 'Özellikler' : 'Features'}
            </h4>
            <PlaceFeatures
              takeout={place.takeout}
              delivery={place.delivery}
              dineIn={place.dineIn}
              servesBreakfast={place.servesBreakfast}
              servesBrunch={place.servesBrunch}
              servesLunch={place.servesLunch}
              servesDinner={place.servesDinner}
              servesVegetarianFood={place.servesVegetarianFood}
              servesBeer={place.servesBeer}
              servesWine={place.servesWine}
              servesCocktails={place.servesCocktails}
              outdoorSeating={place.outdoorSeating}
              liveMusic={place.liveMusic}
              reservable={place.reservable}
              restroom={place.restroom}
              goodForChildren={place.goodForChildren}
              goodForGroups={place.goodForGroups}
              accessibilityOptions={place.accessibilityOptions}
              paymentOptions={place.paymentOptions}
              parkingOptions={place.parkingOptions}
              locale={locale}
            />
          </div>


          {/* Review Analysis */}
          {place.reviewCategories && place.reviewCategories.length > 0 && (
            <div className="pt-2">
              <ReviewAnalysis 
                categories={place.reviewCategories} 
                locale={locale}
              />
            </div>
          )}

          {/* Place Actions */}
          <div className="pt-2 border-t border-border/50">
            <PlaceActions
              placeName={place.name}
              placeAddress={place.address}
              placeId={place.placeId}
              phone={place.phone}
              website={place.website}
              locale={locale}
            />
          </div>

          {/* Google Maps Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/50">
            {place.lat && place.lng && (
              <a
                href={getMapsLink(place)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-lg font-semibold text-sm hover:from-primary/90 hover:to-primary/80 transition-all shadow-md"
              >
                <ExternalLink className="h-4 w-4" />
                <span>{locale === 'tr' ? 'Google Maps\'te Aç' : 'Open in Google Maps'}</span>
              </a>
            )}
            {userLocation && place.lat && place.lng && (
              <a
                href={getDirectionsLink(userLocation, { lat: place.lat, lng: place.lng })}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-semibold text-sm hover:bg-secondary/90 transition-all border border-border"
              >
                <Navigation className="h-4 w-4" />
                <span>{locale === 'tr' ? 'Yol Tarifi Al' : 'Get Directions'}</span>
              </a>
            )}
          </div>
        </CardContent>
      )}

      {/* Expand/Collapse Button */}
      <div className="px-4 pb-3 border-t border-border/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
          className="w-full justify-between text-xs hover:bg-muted/50 transition-colors"
        >
          <span className="font-medium">{locale === 'tr' ? (isExpanded ? 'Detayları Gizle' : 'Detayları Gör') : (isExpanded ? 'Hide Details' : 'Show Details')}</span>
          <div className={cn(
            "transition-transform duration-200",
            isExpanded && "rotate-180"
          )}>
            <ChevronDown className="h-4 w-4" />
          </div>
        </Button>
      </div>
    </Card>
  )
})

