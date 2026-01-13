'use client'

import { Badge } from '@/components/ui/badge'
import { 
  Car, 
  UtensilsCrossed, 
  Coffee, 
  ShoppingBag, 
  CreditCard, 
  Wifi, 
  Music, 
  Baby, 
  Users, 
  Accessibility, 
  ParkingCircle,
  Sun,
  DoorOpen,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlaceFeaturesProps {
  // Service options
  takeout?: boolean
  delivery?: boolean
  dineIn?: boolean
  
  // Food options
  servesBreakfast?: boolean
  servesBrunch?: boolean
  servesLunch?: boolean
  servesDinner?: boolean
  servesVegetarianFood?: boolean
  servesBeer?: boolean
  servesWine?: boolean
  servesCocktails?: boolean
  
  // Amenities
  outdoorSeating?: boolean
  liveMusic?: boolean
  reservable?: boolean
  restroom?: boolean
  goodForChildren?: boolean
  goodForGroups?: boolean
  
  // Accessibility
  accessibilityOptions?: {
    wheelchairAccessibleParking?: boolean
    wheelchairAccessibleEntrance?: boolean
    wheelchairAccessibleRestroom?: boolean
    wheelchairAccessibleSeating?: boolean
  }
  
  // Payment
  paymentOptions?: {
    acceptsCreditCards?: boolean
    acceptsDebitCards?: boolean
    acceptsCashOnly?: boolean
    acceptsNfc?: boolean
  }
  
  // Parking
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
  
  locale?: 'tr' | 'en'
  className?: string
}

export function PlaceFeatures({
  takeout,
  delivery,
  dineIn,
  servesBreakfast,
  servesBrunch,
  servesLunch,
  servesDinner,
  servesVegetarianFood,
  servesBeer,
  servesWine,
  servesCocktails,
  outdoorSeating,
  liveMusic,
  reservable,
  restroom,
  goodForChildren,
  goodForGroups,
  accessibilityOptions,
  paymentOptions,
  parkingOptions,
  locale = 'tr',
  className
}: PlaceFeaturesProps) {
  const features: Array<{ icon: React.ReactNode; label: string; color: string }> = []

  // Service Options
  if (takeout) {
    features.push({
      icon: <ShoppingBag className="h-3 w-3" />,
      label: locale === 'tr' ? 'Paket Servis' : 'Takeout',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    })
  }
  if (delivery) {
    features.push({
      icon: <Car className="h-3 w-3" />,
      label: locale === 'tr' ? 'Teslimat' : 'Delivery',
      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800'
    })
  }
  if (dineIn) {
    features.push({
      icon: <UtensilsCrossed className="h-3 w-3" />,
      label: locale === 'tr' ? 'Yerinde Yemek' : 'Dine In',
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800'
    })
  }

  // Food Options
  if (servesVegetarianFood) {
    features.push({
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: locale === 'tr' ? 'Vejetaryen' : 'Vegetarian',
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    })
  }
  if (servesBreakfast || servesBrunch || servesLunch || servesDinner) {
    const meals = []
    if (servesBreakfast) meals.push(locale === 'tr' ? 'Kahvaltı' : 'Breakfast')
    if (servesBrunch) meals.push(locale === 'tr' ? 'Brunch' : 'Brunch')
    if (servesLunch) meals.push(locale === 'tr' ? 'Öğle Yemeği' : 'Lunch')
    if (servesDinner) meals.push(locale === 'tr' ? 'Akşam Yemeği' : 'Dinner')
    
    features.push({
      icon: <Coffee className="h-3 w-3" />,
      label: meals.join(', '),
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    })
  }
  if (servesBeer || servesWine || servesCocktails) {
    const drinks = []
    if (servesBeer) drinks.push(locale === 'tr' ? 'Bira' : 'Beer')
    if (servesWine) drinks.push(locale === 'tr' ? 'Şarap' : 'Wine')
    if (servesCocktails) drinks.push(locale === 'tr' ? 'Kokteyl' : 'Cocktails')
    
    features.push({
      icon: <UtensilsCrossed className="h-3 w-3" />,
      label: drinks.join(', '),
      color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800'
    })
  }

  // Amenities
  if (outdoorSeating) {
    features.push({
      icon: <Sun className="h-3 w-3" />,
      label: locale === 'tr' ? 'Dış Mekan' : 'Outdoor Seating',
      color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800'
    })
  }
  if (liveMusic) {
    features.push({
      icon: <Music className="h-3 w-3" />,
      label: locale === 'tr' ? 'Canlı Müzik' : 'Live Music',
      color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-800'
    })
  }
  if (reservable) {
    features.push({
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: locale === 'tr' ? 'Rezervasyon' : 'Reservable',
      color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
    })
  }
  if (restroom) {
    features.push({
      icon: <DoorOpen className="h-3 w-3" />,
      label: locale === 'tr' ? 'Tuvalet' : 'Restroom',
      color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300 border-slate-200 dark:border-slate-800'
    })
  }
  if (goodForChildren) {
    features.push({
      icon: <Baby className="h-3 w-3" />,
      label: locale === 'tr' ? 'Çocuk Dostu' : 'Good for Children',
      color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
    })
  }
  if (goodForGroups) {
    features.push({
      icon: <Users className="h-3 w-3" />,
      label: locale === 'tr' ? 'Grup İçin Uygun' : 'Good for Groups',
      color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
    })
  }

  // Parking
  if (parkingOptions) {
    const parkingTypes: string[] = []
    if (parkingOptions.freeParkingLot || parkingOptions.freeGarageParking) {
      parkingTypes.push(locale === 'tr' ? 'Ücretsiz Otopark' : 'Free Parking')
    } else if (parkingOptions.parkingLot || parkingOptions.parkingGarage) {
      parkingTypes.push(locale === 'tr' ? 'Otopark' : 'Parking')
    }
    if (parkingOptions.valetParkingAvailable || parkingOptions.valetParking) {
      parkingTypes.push(locale === 'tr' ? 'Vale' : 'Valet')
    }
    
    if (parkingTypes.length > 0) {
      features.push({
        icon: <ParkingCircle className="h-3 w-3" />,
        label: parkingTypes.join(', '),
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border-gray-200 dark:border-gray-800'
      })
    }
  }

  // Payment Options
  if (paymentOptions) {
    const paymentTypes: string[] = []
    if (paymentOptions.acceptsCreditCards || paymentOptions.acceptsDebitCards) {
      paymentTypes.push(locale === 'tr' ? 'Kart' : 'Card')
    }
    if (paymentOptions.acceptsNfc) {
      paymentTypes.push('NFC')
    }
    if (paymentOptions.acceptsCashOnly) {
      paymentTypes.push(locale === 'tr' ? 'Sadece Nakit' : 'Cash Only')
    }
    
    if (paymentTypes.length > 0) {
      features.push({
        icon: <CreditCard className="h-3 w-3" />,
        label: paymentTypes.join(', '),
        color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-800'
      })
    }
  }

  // Accessibility
  if (accessibilityOptions) {
    const accessible = 
      accessibilityOptions.wheelchairAccessibleEntrance ||
      accessibilityOptions.wheelchairAccessibleSeating ||
      accessibilityOptions.wheelchairAccessibleParking ||
      accessibilityOptions.wheelchairAccessibleRestroom
    
    if (accessible) {
      features.push({
        icon: <Accessibility className="h-3 w-3" />,
        label: locale === 'tr' ? 'Engelli Erişimi' : 'Wheelchair Accessible',
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
      })
    }
  }

  if (features.length === 0) {
    return null
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {features.map((feature, idx) => (
        <Badge
          key={idx}
          variant="outline"
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border",
            feature.color
          )}
        >
          {feature.icon}
          <span>{feature.label}</span>
        </Badge>
      ))}
    </div>
  )
}

