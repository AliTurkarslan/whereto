import type { Config } from 'drizzle-kit'

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql', // ✅ SQLite'dan PostgreSQL'e değiştir
  dbCredentials: {
    url: process.env.DATABASE_URL!, // ✅ Environment variable'dan al
  },
} satisfies Config



