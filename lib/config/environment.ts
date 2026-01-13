/**
 * Environment Configuration
 * 
 * Environment variables'ı validate eder ve type-safe erişim sağlar
 */

import { validateEnvironmentVariables } from '../security/api-key-validation'

export interface AppConfig {
  googlePlacesApiKey: string
  googleAiApiKey?: string
  nodeEnv: 'development' | 'production' | 'test'
  isDevelopment: boolean
  isProduction: boolean
  isTest: boolean
}

let config: AppConfig | null = null

/**
 * Environment config'i initialize et
 */
export function initializeConfig(): AppConfig {
  if (config) {
    return config
  }

  const validation = validateEnvironmentVariables()
  
  // Sadece kritik hatalar için exception fırlat (API key artık opsiyonel)
  if (!validation.isValid && validation.errors.length > 0) {
    // API key hatası artık warning, sadece diğer kritik hatalar için exception
    const criticalErrors = validation.errors.filter(err => !err.includes('API_KEY'))
    if (criticalErrors.length > 0) {
      throw new Error(
        `Environment configuration error:\n${criticalErrors.join('\n')}`
      )
    }
  }
  
  if (validation.warnings.length > 0) {
    console.warn('Environment configuration warnings:')
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`))
  }

  const placesApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  // API key opsiyonel - API'siz mod için
  if (!placesApiKey) {
    console.warn('⚠️  No Google Places API key found. Running in offline mode (database only).')
  }

  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test'

  config = {
    googlePlacesApiKey: placesApiKey || '', // Boş string olabilir (offline mode)
    googleAiApiKey: process.env.GOOGLE_AI_API_KEY,
    nodeEnv,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
  }

  return config
}

/**
 * Config'i al (lazy initialization)
 */
export function getConfig(): AppConfig {
  if (!config) {
    return initializeConfig()
  }
  return config
}

/**
 * Google Maps API Key'i al (client-side safe)
 */
export function getGoogleMapsApiKey(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
}

/**
 * Google Places API Key'i al (server-side)
 */
export function getGooglePlacesApiKey(): string {
  const config = getConfig()
  return config.googlePlacesApiKey
}

/**
 * Config'i reset et (test için)
 */
export function resetConfig(): void {
  config = null
}

