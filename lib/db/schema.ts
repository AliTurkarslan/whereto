import { pgTable, text, integer, real, boolean, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

// Mekanlar tablosu
export const places = pgTable('places', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
  rating: real('rating'),
  reviewCount: integer('review_count'),
  category: text('category'), // restaurant, cafe, bar, etc. (spesifik place type)
  categoryGroup: text('category_group'), // restaurants, hotels, things_to_do, etc. (ana kategori grubu)
  googleMapsId: text('google_maps_id').unique(),
  lastScrapedAt: timestamp('last_scraped_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  // Yeni alanlar - Google Places API'den gelen ek bilgiler
  phone: text('phone'),
  website: text('website'),
  openingHours: text('opening_hours'), // JSON string: {weekdayDescriptions: string[], openNow?: boolean}
  photos: text('photos'), // JSON string: Array<{name: string, widthPx?: number, heightPx?: number}>
  editorialSummary: text('editorial_summary'),
  businessStatus: text('business_status'),
  plusCode: text('plus_code'),
  priceLevel: text('price_level'), // FREE, INEXPENSIVE, MODERATE, EXPENSIVE, VERY_EXPENSIVE
  // Fiyat ve kültür bilgileri
  averagePriceRange: text('average_price_range'), // JSON string: Array<{category: string, minPrice: number, maxPrice: number, currency: string}>
  cuisineType: text('cuisine_type'), // "turkish", "italian", "chinese", vb.
  cuisineTypes: text('cuisine_types'), // JSON string: Array<string> (birden fazla kültür)
  cuisineConfidence: real('cuisine_confidence'), // 0-1 (güven skoru)
  // Ortam ve özel özellikler (öneri motoru için)
  atmosphere: text('atmosphere'), // 'quiet', 'lively', 'romantic', 'casual', 'formal'
  wheelchairAccessible: boolean('wheelchair_accessible'),
  petFriendly: boolean('pet_friendly'),
  kidFriendly: boolean('kid_friendly'), // goodForChildren zaten var, ama yorumlardan da çıkarılabilir
  parking: boolean('parking'),
  wifi: boolean('wifi'),
  vegetarian: boolean('vegetarian'),
  vegan: boolean('vegan'),
  // Kapsamlı Google Places API alanları
  shortFormattedAddress: text('short_formatted_address'),
  addressComponents: text('address_components'), // JSON string
  viewport: text('viewport'), // JSON string
  primaryType: text('primary_type'),
  primaryTypeDisplayName: text('primary_type_display_name'),
  iconBackgroundColor: text('icon_background_color'),
  iconMaskBaseUri: text('icon_mask_base_uri'),
  utcOffset: text('utc_offset'),
  // Accessibility ve özellikler
  accessibilityOptions: text('accessibility_options'), // JSON string
  // ❌ evChargingOptions, fuelOptions, indoorOptions kaldırıldı - API'den çekilmiyor ve database'de yok
  goodForChildren: boolean('good_for_children'), // ✅ PostgreSQL boolean
  goodForGroups: boolean('good_for_groups'),
  goodForWatchingSports: boolean('good_for_watching_sports'),
  liveMusic: boolean('live_music'),
  menuForChildren: boolean('menu_for_children'),
  outdoorSeating: boolean('outdoor_seating'),
  parkingOptions: text('parking_options'), // JSON string
  paymentOptions: text('payment_options'), // JSON string
  reservable: boolean('reservable'),
  restroom: boolean('restroom'),
  // Yemek ve içecek seçenekleri
  servesBreakfast: boolean('serves_breakfast'),
  servesBrunch: boolean('serves_brunch'),
  servesDinner: boolean('serves_dinner'),
  servesLunch: boolean('serves_lunch'),
  servesBeer: boolean('serves_beer'),
  servesWine: boolean('serves_wine'),
  servesCocktails: boolean('serves_cocktails'),
  servesVegetarianFood: boolean('serves_vegetarian_food'),
  // Hizmet seçenekleri
  takeout: boolean('takeout'),
  delivery: boolean('delivery'),
  dineIn: boolean('dine_in'),
  score: integer('score'), // Places tablosunda score (analyses'den kopyalanabilir)
  subDestinations: text('sub_destinations'), // JSON string
  currentSecondaryOpeningHours: text('current_secondary_opening_hours'), // JSON string
})

// Yorumlar tablosu
export const reviews = pgTable('reviews', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  placeId: integer('place_id').notNull().references(() => places.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  rating: integer('rating'), // 1-5
  author: text('author'),
  date: timestamp('date'),
  createdAt: timestamp('created_at').defaultNow(),
})

// AI Analiz sonuçları
export const analyses = pgTable('analyses', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  placeId: integer('place_id').notNull().references(() => places.id, { onDelete: 'cascade' }),
  category: text('category').notNull(), // restaurant, cafe, etc. (Google Maps kategorisi)
  companion: text('companion').notNull(), // alone, partner, etc.
  score: integer('score').notNull(), // 0-100
  why: text('why').notNull(),
  risks: text('risks'),
  reviewCategories: text('review_categories'), // JSON string
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Kullanıcı geri bildirimleri
export const feedback = pgTable('feedback', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  rating: integer('rating').notNull(), // 1-5
  category: text('category').notNull(), // usability, design, performance, features, other
  feedback: text('feedback').notNull(),
  issues: text('issues'), // JSON array of issue types
  userAgent: text('user_agent'),
  url: text('url'),
  createdAt: timestamp('created_at').defaultNow(),
})

// Relations
export const placesRelations = relations(places, ({ many }) => ({
  reviews: many(reviews),
  analyses: many(analyses),
}))

export const reviewsRelations = relations(reviews, ({ one }) => ({
  place: one(places, {
    fields: [reviews.placeId],
    references: [places.id],
  }),
}))

export const analysesRelations = relations(analyses, ({ one }) => ({
  place: one(places, {
    fields: [analyses.placeId],
    references: [places.id],
  }),
}))

// Types
export type Place = typeof places.$inferSelect
export type NewPlace = typeof places.$inferInsert
export type Review = typeof reviews.$inferSelect
export type NewReview = typeof reviews.$inferInsert
export type Analysis = typeof analyses.$inferSelect
export type NewAnalysis = typeof analyses.$inferInsert
export type Feedback = typeof feedback.$inferSelect
export type NewFeedback = typeof feedback.$inferInsert

