'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Image as ImageIcon, X } from 'lucide-react'
import { getPlaceStreetView } from '@/lib/google-apis/street-view'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PlacePhotoProps {
  lat?: number
  lng?: number
  placeName: string
  apiKey?: string
  className?: string
}

export function PlacePhoto({ lat, lng, placeName, apiKey, className }: PlacePhotoProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  // Client-side component - apiKey prop'u kullanılmalı
  const apiKeyToUse = apiKey || ''
  
  // API key yoksa hiçbir şey gösterme (Street View API key gerektirir)
  if (!apiKeyToUse || apiKeyToUse.trim() === '' || !lat || !lng) {
    return null
  }

  const imageUrl = getPlaceStreetView(lat, lng, apiKeyToUse, placeName)

  // API hatası durumunda hiçbir şey gösterme
  if (imageError) {
    return null
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <div className="relative group">
          <Image
            src={imageUrl}
            alt={placeName}
            width={600}
            height={400}
            className="w-full h-32 object-cover rounded-lg border-2 border-border hover:border-primary transition-all cursor-pointer"
            loading="lazy"
            onError={() => {
              // API limit veya hata durumunda gizle
              setImageError(true)
            }}
            unoptimized // Street View images are external
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-lg flex items-center justify-center">
            <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{placeName}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Image
              src={imageUrl}
              alt={placeName}
              width={1200}
              height={800}
              className="w-full h-auto rounded-lg"
              loading="lazy"
              unoptimized // Street View images are external
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

