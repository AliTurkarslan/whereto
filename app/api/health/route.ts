/**
 * Health Check Endpoint
 * 
 * Sistem sağlığını kontrol eder
 */

import { NextResponse } from 'next/server'
import { getConfig } from '@/lib/config/environment'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

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

  // 2. Database check (PostgreSQL)
  try {
    // DATABASE_URL kontrolü
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    // Basit query test
    await db.execute(sql`SELECT 1 as test`)
    
    // Table existence check - Drizzle execute() direkt array döndürür
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `) as Array<{ table_name: string }>
    
    const tableNames = tables.map(t => t.table_name)
    const requiredTables = ['places', 'reviews', 'analyses']
    const missingTables = requiredTables.filter(
      table => !tableNames.includes(table)
    )
    
    if (missingTables.length > 0) {
      throw new Error(`Missing tables: ${missingTables.join(', ')}`)
    }
    
    health.checks.database = {
      status: 'ok',
      message: `${tableNames.length} tables found`,
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



