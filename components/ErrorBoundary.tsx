'use client'

import React, { Component, ReactNode } from 'react'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logging/logger'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  locale?: 'tr' | 'en'
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to logger
    logger.error('ErrorBoundary caught an error', error, {
      componentStack: errorInfo.componentStack,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
          locale={this.props.locale || 'tr'}
        />
      )
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error | null
  onReset: () => void
  locale: 'tr' | 'en'
}

function ErrorFallback({ error, onReset, locale }: ErrorFallbackProps) {
  const router = useRouter()

  const messages = {
    tr: {
      title: 'Bir hata oluştu',
      description: 'Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin veya ana sayfaya dönün.',
      retry: 'Tekrar Dene',
      home: 'Ana Sayfaya Dön',
    },
    en: {
      title: 'An error occurred',
      description: 'Sorry, an unexpected error occurred. Please refresh the page or return to the home page.',
      retry: 'Retry',
      home: 'Back to Home',
    },
  }

  const t = messages[locale]

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-soft">
      <Card className="border-destructive/50 bg-destructive/5 max-w-md w-full">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-xl text-foreground">{t.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.description}</p>
              {error && process.env.NODE_ENV === 'development' && (
                <details className="mt-4 text-left">
                  <summary className="text-xs text-muted-foreground cursor-pointer">
                    Error Details (Development Only)
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                    {error.message}
                    {'\n'}
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button onClick={onReset} variant="default" className="w-full sm:w-auto">
                <RefreshCw className="mr-2 h-4 w-4" />
                {t.retry}
              </Button>
              <Button
                onClick={() => router.push(`/${locale}`)}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Home className="mr-2 h-4 w-4" />
                {t.home}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



