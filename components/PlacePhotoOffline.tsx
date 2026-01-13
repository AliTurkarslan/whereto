'use client'

import { Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface PlacePhotoOfflineProps {
  photos?: Array<{
    name: string
    widthPx?: number
    heightPx?: number
  }>
  placeName: string
  className?: string
}

/**
 * API'siz mod için fotoğraf component'i
 * Database'deki fotoğraf bilgilerini gösterir ama fotoğrafı yükleyemez
 */
export function PlacePhotoOffline({ 
  photos, 
  placeName, 
  className 
}: PlacePhotoOfflineProps) {
  if (!photos || photos.length === 0) {
    return null
  }

  // API key olmadan fotoğraf gösterilemez
  // Placeholder göster
  return (
    <div className={className}>
      <div className="relative group bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg border-2 border-border overflow-hidden">
        <div className="w-full h-48 sm:h-64 flex items-center justify-center">
          <div className="text-center space-y-2">
            <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {photos.length} {photos.length === 1 ? 'fotoğraf' : 'fotoğraf'} mevcut
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              API key gerekli
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
