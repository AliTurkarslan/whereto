'use client'

import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { getTranslations } from '@/lib/i18n'
import { useRouter } from 'next/navigation'

interface ErrorDisplayProps {
  error: string
  onRetry?: () => void
  locale?: 'tr' | 'en'
}

export function ErrorDisplay({ error, onRetry, locale = 'tr' }: ErrorDisplayProps) {
  const t = getTranslations(locale)
  const router = useRouter()

  const getErrorMessage = (error: string) => {
    // Kullanıcı dostu hata mesajları
    if (error.toLowerCase().includes('network') || error.toLowerCase().includes('fetch')) {
      return locale === 'tr' 
        ? 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.'
        : 'Please check your internet connection and try again.'
    }
    if (error.toLowerCase().includes('timeout')) {
      return locale === 'tr'
        ? 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.'
        : 'Request timed out. Please try again.'
    }
    if (error.toLowerCase().includes('location') || error.toLowerCase().includes('konum')) {
      return locale === 'tr'
        ? 'Konum bilgisi alınamadı. Lütfen manuel olarak girin.'
        : 'Could not get location. Please enter manually.'
    }
    return error
  }

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="pt-8 pb-8">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2 max-w-md">
            <h3 className="font-semibold text-xl text-foreground">
              {locale === 'tr' ? 'Bir hata oluştu' : 'An error occurred'}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {getErrorMessage(error)}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {onRetry && (
              <Button 
                onClick={onRetry} 
                variant="default"
                className="w-full sm:w-auto"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {locale === 'tr' ? 'Tekrar Dene' : 'Retry'}
              </Button>
            )}
            <Button 
              onClick={() => router.push(`/${locale}`)} 
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Home className="mr-2 h-4 w-4" />
              {locale === 'tr' ? 'Ana Sayfaya Dön' : 'Back to Home'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

