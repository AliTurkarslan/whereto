'use client'

import { Search, MapPin, Filter } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { useRouter } from 'next/navigation'

interface EmptyStateProps {
  type: 'no-results' | 'no-filtered-results' | 'error'
  locale?: 'tr' | 'en'
  onClearFilters?: () => void
  onNewSearch?: () => void
}

export function EmptyState({ type, locale = 'tr', onClearFilters, onNewSearch }: EmptyStateProps) {
  const router = useRouter()

  const handleNewSearch = () => {
    if (onNewSearch) {
      onNewSearch()
    } else {
      router.push(`/${locale}`)
    }
  }

  if (type === 'no-results') {
    return (
      <Card className="border-2 border-dashed border-muted animate-in fade-in slide-in-from-bottom-4 duration-500" role="alert" aria-live="polite">
        <CardContent className="pt-12 pb-12 text-center space-y-6">
          <div className="flex justify-center" aria-hidden="true">
            <div className="rounded-full bg-muted p-4 animate-pulse transition-all duration-300 hover:scale-110 hover:bg-muted/80">
              <Search className="h-8 w-8 text-muted-foreground transition-transform duration-300 hover:scale-110" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              {locale === 'tr' ? 'Mekan bulunamadı' : 'No places found'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {locale === 'tr' 
                ? 'Bu konumda ve kategoride henüz mekan bulunamadı. Farklı bir konum veya kategori deneyebilirsiniz.'
                : 'No places found in this location and category. Try a different location or category.'}
            </p>
          </div>
          <Button
            onClick={handleNewSearch}
            variant="default"
            size="lg"
            className="mt-4 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
          >
            <MapPin className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
            {locale === 'tr' ? 'Yeni Arama Yap' : 'New Search'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (type === 'no-filtered-results') {
    return (
      <Card className="border-2 border-dashed border-muted animate-in fade-in slide-in-from-bottom-4 duration-500" role="alert" aria-live="polite">
        <CardContent className="pt-12 pb-12 text-center space-y-6">
          <div className="flex justify-center" aria-hidden="true">
            <div className="rounded-full bg-muted p-4 animate-pulse transition-all duration-300 hover:scale-110 hover:bg-muted/80">
              <Filter className="h-8 w-8 text-muted-foreground transition-transform duration-300 hover:scale-110" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              {locale === 'tr' ? 'Filtrelere uygun mekan yok' : 'No places match your filters'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {locale === 'tr' 
                ? 'Seçtiğiniz filtrelere uygun mekan bulunamadı. Filtreleri değiştirerek tekrar deneyin.'
                : 'No places match your selected filters. Try adjusting your filters.'}
            </p>
          </div>
          {onClearFilters && (
            <Button
              onClick={onClearFilters}
              variant="outline"
              size="lg"
              className="mt-4 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-md hover:border-primary/50"
            >
              <Filter className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
              {locale === 'tr' ? 'Filtreleri Temizle' : 'Clear Filters'}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return null
}


