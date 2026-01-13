import type { Config } from 'drizzle-kit'
import { config } from 'dotenv'
import { resolve } from 'path'

// Environment variables'ı yükle (.env.local)
config({ path: resolve(process.cwd(), '.env.local') })

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql', // ✅ SQLite'dan PostgreSQL'e değiştir
  dbCredentials: {
    url: process.env.DATABASE_URL!, // ✅ Environment variable'dan al
  },
} satisfies Config

