/**
 * Health Check Endpoint
 * 
 * Sistem sağlığını kontrol eder
 */

import { NextResponse } from 'next/server'
import { getConfig } from '@/lib/config/environment'
import Database from 'better-sqlite3'
import path from 'path'

export async function GET() {
  const health: {
    status: 'healthy' | 'unhealthy'
    timestamp: string
    checks: Record<string, { status: 'ok' | 'error'; message?: string }>
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {},
  }

  // 1. Environment config check
  try {
    const config = getConfig()
    health.checks.config = {
      status: 'ok',
      message: `Environment: ${config.nodeEnv}`,
    }
  } catch (error) {
    health.status = 'unhealthy'
    health.checks.config = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  // 2. Database check
  try {
    const dbPath = path.join(process.cwd(), 'database.sqlite')
    const db = new Database(dbPath)
    
    // Basit query test
    db.prepare('SELECT 1').get()
    
    // Table existence check
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as Array<{ name: string }>
    
    const requiredTables = ['places', 'reviews', 'analyses']
    const missingTables = requiredTables.filter(
      table => !tables.some(t => t.name === table)
    )
    
    if (missingTables.length > 0) {
      throw new Error(`Missing tables: ${missingTables.join(', ')}`)
    }
    
    db.close()
    
    health.checks.database = {
      status: 'ok',
      message: `${tables.length} tables found`,
    }
  } catch (error) {
    health.status = 'unhealthy'
    health.checks.database = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  // 3. API keys check (sadece varlık kontrolü, format kontrolü değil)
  try {
    const config = getConfig()
    const hasPlacesKey = !!config.googlePlacesApiKey
    const hasAiKey = !!config.googleAiApiKey
    
    health.checks.apiKeys = {
      status: hasPlacesKey ? 'ok' : 'error',
      message: `Places API: ${hasPlacesKey ? 'OK' : 'Missing'}, AI API: ${hasAiKey ? 'OK' : 'Missing'}`,
    }
    
    if (!hasPlacesKey) {
      health.status = 'unhealthy'
    }
  } catch (error) {
    health.status = 'unhealthy'
    health.checks.apiKeys = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  return NextResponse.json(health, {
    status: health.status === 'healthy' ? 200 : 503,
  })
}



