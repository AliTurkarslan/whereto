'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react'
// Server-side proxy kullanıldığı için direkt API çağrılarına gerek yok
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PlacePhotoFromReferenceProps {
  photos: Array<{
    name: string
    widthPx?: number
    heightPx?: number
  }>
  placeName: string
  apiKey?: string
  className?: string
}

export function PlacePhotoFromReference({ 
  photos, 
  placeName, 
  apiKey, 
  className 
}: PlacePhotoFromReferenceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [imageError, setImageError] = useState(false)
  
  if (!photos || photos.length === 0) {
    return null
  }

  // Server-side proxy kullan (CORS ve API key güvenliği için)
  const firstPhoto = photos[0]
  if (!firstPhoto || !firstPhoto.name) {
    return null
  }
  
  // Server-side proxy URL'i oluştur
  const firstPhotoUrl = `/api/place-photo?photoName=${encodeURIComponent(firstPhoto.name)}&maxWidthPx=600`

  // API hatası durumunda hiçbir şey gösterme
  if (imageError) {
    return null
  }

  const currentPhoto = photos[currentPhotoIndex]
  // Server-side proxy URL'i kullan
  const currentPhotoUrl = `/api/place-photo?photoName=${encodeURIComponent(currentPhoto.name)}&maxWidthPx=1200`

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <div className="relative group">
          <Image
            src={firstPhotoUrl}
            alt={placeName}
            width={600}
            height={400}
            className="w-full h-48 sm:h-64 object-cover rounded-lg border-2 border-border hover:border-primary transition-all cursor-pointer"
            loading="lazy"
            onError={() => {
              // API limit veya hata durumunda gizle
              setImageError(true)
            }}
            unoptimized // Google Places photos are external
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ImageIcon className="h-6 w-6 text-white" />
              {photos.length > 1 && (
                <span className="text-white text-sm font-medium">
                  {photos.length} {photos.length === 1 ? 'fotoğraf' : 'fotoğraf'}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{placeName}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Image
              src={currentPhotoUrl}
              alt={`${placeName} - Fotoğraf ${currentPhotoIndex + 1}`}
              width={1200}
              height={800}
              className="w-full h-auto rounded-lg"
              loading="lazy"
              unoptimized
            />
            
            {/* Navigation buttons */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={prevPhoto}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={nextPhoto}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentPhotoIndex + 1} / {photos.length}
                </div>
              </>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
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

