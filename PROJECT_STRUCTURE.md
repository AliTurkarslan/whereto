# 📁 WhereTo - Proje Yapısı

## 🎯 Genel Bakış

WhereTo, kullanıcıların yanlış yer seçme korkusunu ortadan kaldıran, yakın mekanları uygunluk skoru ile gösteren bir Next.js uygulamasıdır.

## 📂 Dosya Yapısı

```
WhereTo/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (metadata, fonts, global scripts)
│   ├── page.tsx                 # Root redirect page
│   ├── globals.css              # Global styles & CSS variables
│   ├── [locale]/                # Internationalized routes
│   │   ├── page.tsx             # Main wizard page
│   │   └── result/
│   │       └── page.tsx         # Results page
│   └── api/                     # API routes
│       ├── recommend/
│       │   └── route.ts         # Recommendation API
│       └── scrape/
│           └── route.ts        # Scraping API (legacy)
│
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── accordion.tsx
│   ├── Wizard.tsx               # Main wizard component
│   ├── LocationStep.tsx         # Step 1: Location input
│   ├── CategoryStep.tsx         # Step 2: Category selection
│   ├── CompanionStep.tsx        # Step 3: Companion selection
│   ├── ResultCard.tsx           # Place result card
│   ├── MapView.tsx              # Map visualization
│   ├── ReviewAnalysis.tsx       # Review categorization display
│   ├── ProgressStepper.tsx      # Progress indicator
│   ├── AnimatedStep.tsx        # Step animation wrapper
│   ├── LoadingSpinner.tsx      # Loading indicator
│   ├── SkeletonCard.tsx        # Loading skeleton
│   ├── ErrorDisplay.tsx         # Error display component
│   ├── DirectionsButton.tsx    # Directions button
│   └── PlacePhoto.tsx          # Street View photo
│
├── lib/                         # Utility libraries
│   ├── ai/
│   │   └── gemini.ts           # Google Gemini AI integration
│   ├── scrapers/
│   │   ├── google-maps.ts      # Puppeteer scraper (fallback)
│   │   ├── google-places-api.ts # Google Places API
│   │   └── reviews-fetcher.ts  # Review fetching utilities
│   ├── google-apis/            # Google APIs integration
│   │   ├── index.ts
│   │   ├── geocoding.ts        # Geocoding API
│   │   ├── directions.ts       # Directions API
│   │   ├── street-view.ts      # Street View API
│   │   ├── maps-embed.ts      # Maps Embed API
│   │   └── time-zone.ts       # Time Zone API
│   ├── db/                     # Database layer
│   │   ├── index.ts            # Database connection
│   │   ├── schema.ts           # Drizzle schema
│   │   └── migrations.ts       # Migration utilities
│   ├── cache/
│   │   └── analysis-cache.ts  # AI analysis caching
│   ├── types/
│   │   ├── place.ts            # Place types
│   │   └── review.ts           # Review types
│   ├── utils/
│   │   ├── cost-tracker.ts     # API cost tracking
│   │   └── index.ts            # General utilities
│   └── i18n/
│       └── index.ts            # Internationalization
│
├── locales/                     # Translation files
│   ├── tr.json                 # Turkish translations
│   └── en.json                 # English translations
│
├── scripts/                     # Utility scripts
│   ├── sync-places.ts         # Place synchronization
│   ├── sync-reviews-only.ts   # Review synchronization
│   ├── sync-kadikoy.ts        # Kadıköy sync (all categories)
│   ├── sync-kadikoy-safe.ts  # Kadıköy sync (free tier safe)
│   ├── check-database.ts      # Database status check
│   └── clear-mock-data.ts     # Clear mock data
│
├── public/                      # Static assets
│
├── database.sqlite              # SQLite database
├── database.sqlite-wal          # SQLite WAL file
├── database.sqlite-shm          # SQLite shared memory
│
├── .env.local                  # Environment variables (gitignored)
├── .gitignore                   # Git ignore rules
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── drizzle.config.ts           # Drizzle ORM configuration
├── package.json                # Dependencies & scripts
│
└── docs/                        # Documentation (markdown files)
    ├── PROJECT_STRUCTURE.md    # This file
    ├── COST_ANALYSIS.md        # Cost analysis
    ├── GOOGLE_APIS_INTEGRATION.md
    ├── GOOGLE_PLACES_API_SETUP.md
    ├── DATABASE_SETUP.md
    ├── KADIKOY_SETUP.md
    └── ...
```

## 🏗️ Mimari Kararlar

### 1. Next.js App Router
- **Neden**: Modern Next.js routing, server components, streaming
- **Kullanım**: App directory structure, route handlers

### 2. TypeScript
- **Neden**: Type safety, better DX, fewer runtime errors
- **Kullanım**: Strict mode, type definitions

### 3. Database: SQLite (Drizzle ORM)
- **Neden**: 
  - Lightweight, no server needed
  - Easy migration to PostgreSQL later
  - Perfect for MVP
- **Kullanım**: Drizzle ORM for type-safe queries

### 4. Styling: Tailwind CSS + shadcn/ui
- **Neden**: 
  - Utility-first, fast development
  - Consistent design system
  - Accessible components
- **Kullanım**: Global CSS variables, component library

### 5. AI: Google Gemini
- **Neden**: 
  - Free tier available
  - Good Turkish support
  - Review analysis capabilities
- **Kullanım**: Review categorization, sentiment analysis

### 6. Maps: Leaflet + Google APIs
- **Neden**: 
  - Leaflet: Open source, flexible
  - Google APIs: Rich data, reliable
- **Kullanım**: Map visualization, geocoding, directions

## 🔄 Data Flow

### 1. Initial Sync (Background Job)
```
Google Places API → Places Data → Database
                    ↓
              Reviews (Scraping) → Database
                    ↓
              AI Analysis → Database
```

### 2. User Search Flow
```
User Input → API Request → Database Query → Results
                                    ↓
                            AI Analysis (cached)
                                    ↓
                            Response → UI
```

### 3. API Request Flow
```
Client → /api/recommend → getPlacesWithAnalyses()
                              ↓
                    Database Query
                              ↓
                    Return Scored Places
```

## 📦 Dependencies

### Core
- `next`: 14.2.0 - React framework
- `react`: 18.3.0 - UI library
- `typescript`: 5.5.0 - Type safety

### Database
- `drizzle-orm`: 0.45.1 - Type-safe ORM
- `drizzle-kit`: 0.31.8 - Migration tool
- `better-sqlite3`: 12.5.0 - SQLite driver

### AI & APIs
- `@google/generative-ai`: 0.21.0 - Gemini AI
- Google Maps Platform APIs (via fetch)

### UI
- `tailwindcss`: 3.4.0 - CSS framework
- `lucide-react`: 0.427.0 - Icons
- `@radix-ui/*`: UI primitives
- `leaflet`: 1.9.4 - Maps
- `react-leaflet`: 4.2.1 - React wrapper

### Scraping
- `puppeteer`: 24.34.0 - Browser automation
- `playwright`: 1.57.0 - Alternative scraper

### Utilities
- `zod`: 3.23.0 - Validation
- `clsx`: 2.1.1 - Class utilities
- `dotenv`: 17.2.3 - Environment variables

## 🔐 Environment Variables

```bash
# Required
GOOGLE_AI_API_KEY=your_gemini_api_key
GOOGLE_PLACES_API_KEY=your_places_api_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key

# Optional
NODE_ENV=production|development
```

## 🚀 Scripts

```bash
# Development
npm run dev              # Start dev server

# Build
npm run build            # Production build
npm run start            # Start production server

# Database
npm run db:push          # Push schema to database
npm run db:studio        # Open Drizzle Studio
npm run db:check         # Check database status

# Sync
npm run sync:places      # Sync places for category
npm run sync:reviews     # Sync reviews only
npm run sync:kadikoy:safe # Safe Kadıköy sync
```

## 📝 Code Style

### TypeScript
- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Explicit return types for functions

### React
- Functional components only
- Hooks for state management
- Server components where possible

### File Naming
- Components: PascalCase (`ResultCard.tsx`)
- Utilities: camelCase (`getPlaces.ts`)
- Types: PascalCase (`PlaceData.ts`)
- Constants: UPPER_SNAKE_CASE (`MAX_RESULTS`)

## 🧪 Testing Strategy

### Current
- Manual testing
- Type checking via TypeScript
- Build verification

### Future
- Unit tests (Jest/Vitest)
- E2E tests (Playwright)
- API tests

## 🔒 Security

### API Keys
- Never commit to git
- Use environment variables
- Restrict API key permissions

### Database
- SQLite file permissions
- No sensitive data in database
- Regular backups

### Client-Side
- No API keys exposed
- Server-side API calls only
- Input validation

## 📊 Performance

### Optimizations
- Database caching
- AI analysis caching
- Lazy loading (maps, images)
- Code splitting

### Monitoring
- API usage tracking
- Cost tracking
- Error logging

## 🐛 Known Issues

1. **Hydration Warning**: Fixed by adding `suppressHydrationWarning`
2. **Scraping Rate Limits**: Handled with delays and fallbacks
3. **API Costs**: Monitored via cost tracker

## 🔄 Migration Path

### Future Improvements
1. PostgreSQL migration (production)
2. Redis caching (performance)
3. Background job queue (Bull/BullMQ)
4. Real-time updates (WebSockets)
5. Mobile app (React Native)

## 📚 Documentation

- `COST_ANALYSIS.md`: API cost analysis
- `GOOGLE_APIS_INTEGRATION.md`: Google APIs guide
- `DATABASE_SETUP.md`: Database setup guide
- `KADIKOY_SETUP.md`: Kadıköy sync guide

## 👥 Contributing

1. Follow TypeScript strict mode
2. Use existing component patterns
3. Add tests for new features
4. Update documentation
5. Follow commit message conventions

## 📄 License

MIT


