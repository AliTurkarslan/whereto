'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Heart, Share2, Phone, Globe, ExternalLink, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getMapsLink } from '@/lib/google-apis/maps-embed'
import { getMenuLink } from '@/lib/google-apis/menu-link'

interface PlaceActionsProps {
  placeName: string
  placeAddress: string
  placeId?: string
  phone?: string
  website?: string
  locale?: 'tr' | 'en'
}

export function PlaceActions({ 
  placeName, 
  placeAddress, 
  placeId,
  phone, 
  website, 
  locale = 'tr' 
}: PlaceActionsProps) {
  const [isFavorite, setIsFavorite] = useState(false)

  // Load favorite status from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const favorites = JSON.parse(localStorage.getItem('whereto-favorites') || '[]')
      setIsFavorite(favorites.some((fav: { name: string; address: string }) => 
        fav.name === placeName && fav.address === placeAddress
      ))
    }
  }, [placeName, placeAddress])

  const toggleFavorite = () => {
    if (typeof window !== 'undefined') {
      const favorites = JSON.parse(localStorage.getItem('whereto-favorites') || '[]')
      const placeKey = { name: placeName, address: placeAddress }
      
      if (isFavorite) {
        const updated = favorites.filter((fav: { name: string; address: string }) => 
          !(fav.name === placeName && fav.address === placeAddress)
        )
        localStorage.setItem('whereto-favorites', JSON.stringify(updated))
        setIsFavorite(false)
      } else {
        favorites.push(placeKey)
        localStorage.setItem('whereto-favorites', JSON.stringify(favorites))
        setIsFavorite(true)
      }
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: placeName,
      text: `${placeName} - ${placeAddress}`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(
          `${shareData.title}\n${shareData.text}\n${shareData.url}`
        )
        alert(locale === 'tr' ? 'Link kopyalandı!' : 'Link copied!')
      }
    } catch (error) {
      // User cancelled or error occurred
      console.log('Share cancelled or failed:', error)
    }
  }

  const handleCall = () => {
    if (phone) {
      window.location.href = `tel:${phone}`
    }
  }

  const handleWebsite = () => {
    if (website) {
      window.open(website.startsWith('http') ? website : `https://${website}`, '_blank')
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Favorite Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleFavorite}
        className={cn(
          "transition-all duration-200 hover:scale-105 active:scale-95",
          isFavorite && "bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 shadow-sm"
        )}
        title={locale === 'tr' ? (isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle') : (isFavorite ? 'Remove from favorites' : 'Add to favorites')}
      >
        <Heart className={cn("h-4 w-4 transition-all duration-200", isFavorite && "fill-red-600 scale-110")} />
        <span className="hidden sm:inline ml-1">
          {locale === 'tr' ? (isFavorite ? 'Favorilerde' : 'Favorilere Ekle') : (isFavorite ? 'Favorited' : 'Add to Favorites')}
        </span>
      </Button>

      {/* Share Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-primary/5"
        title={locale === 'tr' ? 'Paylaş' : 'Share'}
      >
        <Share2 className="h-4 w-4 transition-transform duration-200 hover:rotate-12" />
        <span className="hidden sm:inline ml-1">
          {locale === 'tr' ? 'Paylaş' : 'Share'}
        </span>
      </Button>

      {/* Phone Button */}
      {phone && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleCall}
          className="transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-green-50 hover:border-green-200 hover:text-green-600"
          title={locale === 'tr' ? 'Ara' : 'Call'}
        >
          <Phone className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
          <span className="hidden sm:inline ml-1">
            {locale === 'tr' ? 'Ara' : 'Call'}
          </span>
        </Button>
      )}

      {/* Website Button */}
      {website && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleWebsite}
          className="transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
          title={locale === 'tr' ? 'Website' : 'Website'}
        >
          <Globe className="h-4 w-4 transition-transform duration-200 hover:rotate-12" />
          <span className="hidden sm:inline ml-1">
            {locale === 'tr' ? 'Website' : 'Website'}
          </span>
        </Button>
      )}

      {/* Menu Button */}
      {placeId && getMenuLink(placeId) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(getMenuLink(placeId)!, '_blank')}
          className="transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600"
          title={locale === 'tr' ? 'Menüyü Gör' : 'View Menu'}
        >
          <Menu className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
          <span className="hidden sm:inline ml-1">
            {locale === 'tr' ? 'Menü' : 'Menu'}
          </span>
        </Button>
      )}

    </div>
  )
}

