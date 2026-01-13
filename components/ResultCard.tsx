'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, AlertCircle, CheckCircle2, Star, Navigation, Clock, ExternalLink, DollarSign, Menu } from 'lucide-react'
import { ReviewAnalysis } from './ReviewAnalysis'
import { ReviewCategory } from '@/lib/types/review'
import { getTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { PlacePhoto } from './PlacePhoto'
import { PlacePhotoFromReference } from './PlacePhotoFromReference'
import { PlaceActions } from './PlaceActions'
import { getMapsLink, getDirectionsLink } from '@/lib/google-apis/maps-embed'
import { getPriceLevelDescription, getPriceLevelBadgeColor, getPriceLevelIcon, parsePriceLevel, type PriceLevel } from '@/lib/utils/price-level'
import { getMenuLink } from '@/lib/google-apis/menu-link'

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
  priceLevel?: number // 0-4 (0 = free, 4 = very expensive)
  openingHours?: string[]
  photos?: Array<{
    name: string
    widthPx?: number
    heightPx?: number
  }>
}

interface ResultCardProps {
  place: Place
  locale?: 'tr' | 'en'
  userLocation?: { lat: number; lng: number }
}

export function ResultCard({ place, locale = 'tr', userLocation }: ResultCardProps) {
  const t = getTranslations(locale)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

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

  return (
    <Card className={cn(
      "w-full transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 border-2 animate-in fade-in slide-in-from-bottom-4",
      "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
      "bg-gradient-to-br from-card to-card/95",
      getScoreRingColor(place.score)
    )}>
      <CardHeader className="pb-6 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start gap-3">
              <div className={cn(
                "relative w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-xl flex-shrink-0",
                "ring-4 ring-offset-2 ring-offset-background",
                getScoreColor(place.score),
                place.score >= 80 ? "ring-green-500/30" : place.score >= 60 ? "ring-yellow-500/30" : "ring-orange-500/30"
              )}>
                <span className="text-2xl font-extrabold">{place.score}</span>
                <span className="absolute -top-1 -right-1 text-xs font-bold">%</span>
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-2xl sm:text-3xl font-extrabold mb-2 line-clamp-2 text-foreground leading-tight">
                  {place.name}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="line-clamp-2">{place.address}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs font-semibold px-3 py-1",
                  place.score >= 80 && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                  place.score >= 60 && place.score < 80 && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                  place.score < 60 && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                )}
              >
                {getScoreLabel(place.score)}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Mekan Fotoğrafı - Önce Google Places Photos, yoksa Street View */}
        {apiKey && (
          <div className="overflow-hidden rounded-lg border border-border/50 shadow-sm mb-4">
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

        {/* Temel Bilgiler - Mesafe, Rating, Fiyat */}
        <div className="flex items-center gap-3 flex-wrap">
          {place.distance && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
              <Navigation className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{place.distance.toFixed(1)} km</span>
            </div>
          )}
          {place.rating && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">{place.rating.toFixed(1)}</span>
            </div>
          )}
          {place.priceLevel !== undefined && (
            <div 
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border",
                getPriceLevelBadgeColor(place.priceLevel as PriceLevel)
              )}
              title={getPriceLevelDescription(place.priceLevel as PriceLevel, locale)}
            >
              <span className="text-sm font-semibold">
                {getPriceLevelIcon(place.priceLevel as PriceLevel)}
              </span>
            </div>
          )}
        </div>

        {/* Place Actions (Favorite, Share, Phone, Website, Menu) */}
        <div className="pt-2 border-t border-border/50">
          <PlaceActions
            placeName={place.name}
            placeAddress={place.address}
            placeId={place.placeId}
            phone={place.phone}
            website={place.website}
            locale={locale}
          />
          
          {/* Menu Link - Eğer placeId varsa */}
          {place.placeId && getMenuLink(place.placeId) && (
            <div className="mt-3">
              <a
                href={getMenuLink(place.placeId)!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold text-sm hover:from-purple-600 hover:to-pink-600 active:scale-[0.98] transition-all shadow-md hover:shadow-lg"
              >
                <Menu className="h-4 w-4" />
                <span>{locale === 'tr' ? 'Menüyü Gör' : 'View Menu'}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {/* Opening Hours */}
        {place.openingHours && place.openingHours.length > 0 && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
            <Clock className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <span className="font-semibold text-sm text-foreground block mb-1.5">
                {locale === 'tr' ? 'Çalışma Saatleri' : 'Opening Hours'}
              </span>
              <div className="space-y-1">
                {place.openingHours.slice(0, 3).map((hours, idx) => (
                  <p key={idx} className="text-sm text-muted-foreground">
                    {hours}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Why & Risks - Daha çekici tasarım */}
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 rounded-xl p-5 border-2 border-green-200/50 dark:border-green-900/50 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-500 rounded-lg flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <span className="font-bold text-base text-green-900 dark:text-green-100 block mb-2">
                  {t.results.why}
                </span>
                <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">
                  {place.why}
                </p>
              </div>
            </div>
          </div>

          {place.risks && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 rounded-xl p-5 border-2 border-amber-200/50 dark:border-amber-900/50 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500 rounded-lg flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-base text-amber-900 dark:text-amber-100 block mb-2">
                    {t.results.risks}
                  </span>
                  <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                    {place.risks}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Google Maps Actions - Daha belirgin */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-border/50">
          {/* Google Maps'te Aç - Öncelikli Buton */}
          {place.lat && place.lng && (
            <a
              href={getMapsLink(place)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl font-semibold text-sm hover:from-primary/90 hover:to-primary/80 active:scale-[0.98] transition-all shadow-lg hover:shadow-xl"
            >
              <ExternalLink className="h-5 w-5" />
              <span>{locale === 'tr' ? 'Google Maps\'te Aç' : 'Open in Google Maps'}</span>
            </a>
          )}
          
          {/* Yol Tarifi Butonu */}
          {userLocation && place.lat && place.lng && (
            <a
              href={getDirectionsLink(userLocation, { lat: place.lat, lng: place.lng })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold text-sm hover:bg-secondary/90 active:scale-[0.98] transition-all border-2 border-border hover:border-primary/30 shadow-md hover:shadow-lg"
            >
              <Navigation className="h-5 w-5" />
              <span>{locale === 'tr' ? 'Yol Tarifi Al' : 'Get Directions'}</span>
            </a>
          )}
        </div>

        {place.reviewCategories && place.reviewCategories.length > 0 && (
          <div className="pt-2">
            <ReviewAnalysis 
              categories={place.reviewCategories} 
              locale={locale}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

