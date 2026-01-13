import { db } from '../lib/db'
import { feedback } from '../lib/db/schema'
import { sql } from 'drizzle-orm'

async function viewFeedback() {
  try {
    console.log('📊 Fetching feedback data...\n')
    
    const allFeedback = await db.select().from(feedback).orderBy(feedback.createdAt)

    if (allFeedback.length === 0) {
      console.log('❌ No feedback found.')
      return
    }

    // Calculate statistics
    const total = allFeedback.length
    const averageRating = allFeedback.reduce((sum, f) => sum + f.rating, 0) / total
    
    const byCategory: Record<string, number> = {}
    const byRating: Record<number, number> = {}

    allFeedback.forEach((f) => {
      byCategory[f.category] = (byCategory[f.category] || 0) + 1
      byRating[f.rating] = (byRating[f.rating] || 0) + 1
    })

    console.log('📈 Statistics:')
    console.log(`   Total Feedback: ${total}`)
    console.log(`   Average Rating: ${averageRating.toFixed(2)}/5`)
    console.log('\n📂 By Category:')
    Object.entries(byCategory).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} (${((count / total) * 100).toFixed(1)}%)`)
    })
    console.log('\n⭐ By Rating:')
    Object.entries(byRating).sort(([a], [b]) => Number(b) - Number(a)).forEach(([rating, count]) => {
      console.log(`   ${rating} stars: ${count} (${((count / total) * 100).toFixed(1)}%)`)
    })

    console.log('\n📝 Recent Feedback (Last 10):')
    console.log('─'.repeat(80))
    allFeedback.slice(-10).reverse().forEach((f, index) => {
      console.log(`\n${index + 1}. Rating: ${f.rating}/5 | Category: ${f.category}`)
      console.log(`   Feedback: ${f.feedback.substring(0, 100)}${f.feedback.length > 100 ? '...' : ''}`)
      if (f.issues) {
        try {
          const issues = JSON.parse(f.issues)
          if (Array.isArray(issues) && issues.length > 0) {
            console.log(`   Issues: ${issues.join(', ')}`)
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      console.log(`   Date: ${f.createdAt}`)
    })

    console.log('\n✅ Done!')
  } catch (error) {
    console.error('❌ Error fetching feedback:', error)
    throw error
  }
}

viewFeedback()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })



