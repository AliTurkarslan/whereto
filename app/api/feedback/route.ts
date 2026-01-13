import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { feedback } from '@/lib/db/schema'
import { logger } from '@/lib/logging/logger'
import { sql } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rating, category, feedback: feedbackText, issues, userAgent, url, timestamp } = body

    // Validation
    if (!rating || !category || !feedbackText || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid feedback data' },
        { status: 400 }
      )
    }

    // Insert feedback into database
    // createdAt için default kullan (unixepoch())
    await db.insert(feedback).values({
      rating,
      category,
      feedback: feedbackText,
      issues: issues && issues.length > 0 ? JSON.stringify(issues) : null,
      userAgent: userAgent || null,
      url: url || null,
      // createdAt default olarak unixepoch() kullanacak
    })

    logger.info('Feedback submitted', { rating, category, url })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Feedback submission error', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}

// Get feedback statistics (for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    // Simple secret check (in production, use proper auth)
    if (secret !== process.env.FEEDBACK_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const allFeedback = await db.select().from(feedback).orderBy(sql`${feedback.createdAt} DESC`)

    // Calculate statistics
    const stats = {
      total: allFeedback.length,
      averageRating: allFeedback.length > 0
        ? allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length
        : 0,
      byCategory: {} as Record<string, number>,
      byRating: {} as Record<number, number>,
    }

    allFeedback.forEach((f) => {
      stats.byCategory[f.category] = (stats.byCategory[f.category] || 0) + 1
      stats.byRating[f.rating] = (stats.byRating[f.rating] || 0) + 1
    })

    return NextResponse.json({
      feedback: allFeedback,
      stats,
    })
  } catch (error) {
    logger.error('Feedback retrieval error', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Failed to retrieve feedback' },
      { status: 500 }
    )
  }
}

