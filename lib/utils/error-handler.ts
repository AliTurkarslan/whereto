/**
 * Error Handling Utilities
 * 
 * Merkezi hata yönetimi ve kullanıcı dostu hata mesajları
 */

export interface AppError {
  code: string
  message: string
  userMessage: string
  statusCode?: number
  context?: Record<string, unknown>
}

export class CustomError extends Error {
  code: string
  userMessage: string
  statusCode: number
  context?: Record<string, unknown>

  constructor(
    code: string,
    message: string,
    userMessage: string,
    statusCode: number = 500,
    context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'CustomError'
    this.code = code
    this.userMessage = userMessage
    this.statusCode = statusCode
    this.context = context
  }
}

/**
 * Hata kodlarına göre kullanıcı dostu mesajlar
 */
export function getUserFriendlyMessage(error: unknown, locale: 'tr' | 'en' = 'tr'): string {
  if (error instanceof CustomError) {
    return error.userMessage
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return locale === 'tr'
        ? 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.'
        : 'Please check your internet connection and try again.'
    }

    // Timeout errors
    if (message.includes('timeout')) {
      return locale === 'tr'
        ? 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.'
        : 'Request timed out. Please try again.'
    }

    // API errors
    if (message.includes('api') || message.includes('service unavailable') || message.includes('503')) {
      return locale === 'tr'
        ? 'Servis şu anda yoğun. Lütfen birkaç dakika sonra tekrar deneyin.'
        : 'Service is currently busy. Please try again in a few minutes.'
    }

    // Rate limit errors
    if (message.includes('rate limit') || message.includes('429')) {
      return locale === 'tr'
        ? 'Çok fazla istek gönderildi. Lütfen birkaç saniye bekleyin.'
        : 'Too many requests. Please wait a few seconds.'
    }

    // Location errors
    if (message.includes('location') || message.includes('konum') || message.includes('geolocation')) {
      return locale === 'tr'
        ? 'Konum bilgisi alınamadı. Lütfen manuel olarak girin.'
        : 'Could not get location. Please enter manually.'
    }

    // Database errors
    if (message.includes('database') || message.includes('sql') || message.includes('query')) {
      return locale === 'tr'
        ? 'Veritabanı hatası oluştu. Lütfen tekrar deneyin.'
        : 'Database error occurred. Please try again.'
    }

    // Generic error
    return locale === 'tr'
      ? 'Bir hata oluştu. Lütfen tekrar deneyin.'
      : 'An error occurred. Please try again.'
  }

  return locale === 'tr'
    ? 'Bilinmeyen bir hata oluştu.'
    : 'An unknown error occurred.'
}

/**
 * Hata koduna göre HTTP status code döndür
 */
export function getStatusCode(error: unknown): number {
  if (error instanceof CustomError) {
    return error.statusCode
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    if (message.includes('not found') || message.includes('404')) return 404
    if (message.includes('unauthorized') || message.includes('401')) return 401
    if (message.includes('forbidden') || message.includes('403')) return 403
    if (message.includes('rate limit') || message.includes('429')) return 429
    if (message.includes('service unavailable') || message.includes('503')) return 503
    if (message.includes('bad request') || message.includes('400')) return 400
  }

  return 500
}

/**
 * Hata loglama ve kullanıcı mesajı oluşturma
 */
export function handleError(error: unknown, context?: Record<string, unknown>): AppError {
  const userMessage = getUserFriendlyMessage(error)
  const statusCode = getStatusCode(error)

  const appError: AppError = {
    code: error instanceof CustomError ? error.code : 'UNKNOWN_ERROR',
    message: error instanceof Error ? error.message : String(error),
    userMessage,
    statusCode,
    context,
  }

  return appError
}



