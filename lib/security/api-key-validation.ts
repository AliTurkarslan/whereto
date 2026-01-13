/**
 * API Key Validation
 * 
 * Google Places API key'lerini validate eder
 */

export interface ApiKeyValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
}

/**
 * Google Places API key formatını kontrol et
 */
export function validateGooglePlacesApiKey(apiKey: string | undefined): ApiKeyValidationResult {
  if (!apiKey) {
    return {
      isValid: false,
      error: 'API key is required',
    }
  }

  // Google API key formatı: genellikle AIzaSy ile başlar
  if (!apiKey.startsWith('AIzaSy')) {
    return {
      isValid: false,
      error: 'Invalid API key format. Google API keys typically start with "AIzaSy"',
    }
  }

  // Minimum uzunluk kontrolü
  if (apiKey.length < 30) {
    return {
      isValid: false,
      error: 'API key is too short',
    }
  }

  // Maksimum uzunluk kontrolü
  if (apiKey.length > 100) {
    return {
      isValid: false,
      error: 'API key is too long',
    }
  }

  return {
    isValid: true,
  }
}

/**
 * Environment variables'ı validate et
 */
export function validateEnvironmentVariables(): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Google Places API Key (opsiyonel - offline mode için)
  const placesApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!placesApiKey) {
    warnings.push('GOOGLE_PLACES_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set. Running in offline mode (database only).')
  } else {
    const validation = validateGooglePlacesApiKey(placesApiKey)
    if (!validation.isValid) {
      warnings.push(`Google Places API Key: ${validation.error}`)
    }
  }

  // Google AI API Key (Gemini)
  const aiApiKey = process.env.GOOGLE_AI_API_KEY
  if (!aiApiKey) {
    warnings.push('GOOGLE_AI_API_KEY is not set (AI analysis will not work)')
  } else {
    const validation = validateGooglePlacesApiKey(aiApiKey)
    if (!validation.isValid) {
      warnings.push(`Google AI API Key: ${validation.error}`)
    }
  }

  // Node Environment
  const nodeEnv = process.env.NODE_ENV
  if (!nodeEnv) {
    warnings.push('NODE_ENV is not set (defaulting to development)')
  } else if (!['development', 'production', 'test'].includes(nodeEnv)) {
    warnings.push(`NODE_ENV has unexpected value: ${nodeEnv}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * API key'i güvenli şekilde mask'le (loglama için)
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 10) {
    return '***'
  }
  return `${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}`
}



