import { ReviewCategory } from './review'

export interface ScoredPlace {
  name: string
  address: string
  score: number
  why: string
  risks?: string
  distance?: number
  rating?: number
  lat?: number
  lng?: number
  reviewCategories?: ReviewCategory[]
  analyzedReviewCount?: number
  totalReviewCount?: number
  googleMapsId?: string
  placeId?: string
  // Yeni alanlar
  phone?: string
  website?: string
  openingHours?: {
    weekdayDescriptions?: string[]
    openNow?: boolean
  }
  photos?: Array<{
    name: string
    widthPx?: number
    heightPx?: number
  }>
  editorialSummary?: string
  businessStatus?: string
  plusCode?: string
  priceLevel?: string
  // Kapsamlı Google Places API alanları
  shortFormattedAddress?: string
  addressComponents?: Array<{
    longText: string
    shortText: string
    types: string[]
    languageCode?: string
  }>
  viewport?: {
    low: { latitude: number; longitude: number }
    high: { latitude: number; longitude: number }
  }
  primaryType?: string
  primaryTypeDisplayName?: string
  // Accessibility ve özellikler
  accessibilityOptions?: {
    wheelchairAccessibleParking?: boolean
    wheelchairAccessibleEntrance?: boolean
    wheelchairAccessibleRestroom?: boolean
    wheelchairAccessibleSeating?: boolean
  }
  evChargingOptions?: {
    connectorCount?: number
    connectorAggregation?: Array<{
      type?: string
      count?: number
    }>
  }
  fuelOptions?: {
    fuelPrices?: Array<{
      type: string
      price: {
        units: string
        nanos: number
        currencyCode: string
      }
      updateTime?: string
    }>
  }
  goodForChildren?: boolean
  goodForGroups?: boolean
  goodForWatchingSports?: boolean
  indoorOptions?: {
    indoorSeating?: boolean
    indoorOutdoorSeating?: boolean
  }
  liveMusic?: boolean
  menuForChildren?: boolean
  outdoorSeating?: boolean
  parkingOptions?: {
    parkingLot?: boolean
    parkingGarage?: boolean
    streetParking?: boolean
    valetParking?: boolean
    freeGarageParking?: boolean
    freeParkingLot?: boolean
    paidParkingLot?: boolean
    paidParkingGarage?: boolean
    paidStreetParking?: boolean
    valetParkingAvailable?: boolean
  }
  paymentOptions?: {
    acceptsCreditCards?: boolean
    acceptsDebitCards?: boolean
    acceptsCashOnly?: boolean
    acceptsNfc?: boolean
  }
  reservable?: boolean
  restroom?: boolean
  // Yemek ve içecek seçenekleri
  servesBreakfast?: boolean
  servesBrunch?: boolean
  servesDinner?: boolean
  servesLunch?: boolean
  servesBeer?: boolean
  servesWine?: boolean
  servesCocktails?: boolean
  servesVegetarianFood?: boolean
  // Hizmet seçenekleri
  takeout?: boolean
  delivery?: boolean
  dineIn?: boolean
  subDestinations?: Array<{
    id: string
    displayName: string
  }>
  currentSecondaryOpeningHours?: Array<{
    weekdayDescriptions?: string[]
    openNow?: boolean
  }>
}

