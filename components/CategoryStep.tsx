'use client'

import { useState } from 'react'
import { getTranslations } from '@/lib/i18n'
import { 
  UtensilsCrossed, Coffee, Wine, Scissors, Sparkles, ShoppingBag, Film, 
  MoreHorizontal, Cookie, Truck, Shirt, Footprints, ShoppingCart, 
  Gamepad2, Music, Circle, Cross, Pill, Smile, Fuel, Car, Landmark, 
  CreditCard, Bed, Dumbbell, Navigation, Map, ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { USER_NEED_CATEGORIES, getAllUserNeedCategories } from '@/lib/config/user-needs-categories'

interface CategoryStepProps {
  locale?: 'tr' | 'en'
  onCategoryChange: (category: string) => void
  initialCategory?: string
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  UtensilsCrossed,
  Coffee,
  Wine,
  Scissors,
  Sparkles,
  ShoppingBag,
  Film,
  MoreHorizontal,
  Cookie,
  Truck,
  Shirt,
  Footprints,
  ShoppingCart,
  Gamepad2,
  Music,
  Circle,
  Cross,
  Pill,
  Smile,
  Fuel,
  Car,
  Landmark,
  CreditCard,
  Bed,
  Dumbbell,
  Navigation,
  Map,
}

export function CategoryStep({ locale = 'tr', onCategoryChange, initialCategory }: CategoryStepProps) {
  const t = getTranslations(locale)
  const [selected, setSelected] = useState<string | undefined>(initialCategory)

  // Kullanıcı ihtiyaç kategorisi seçildiğinde direkt gönder
  // Sistem bu ihtiyaca karşılık gelen Google Maps kategorilerini otomatik olarak arayacak
  const handleSelect = (userNeedId: string) => {
    setSelected(userNeedId)
    onCategoryChange(userNeedId) // Kullanıcı ihtiyaç kategorisini gönder (yemek, kahve, vb.)
  }

  // Kullanıcı ihtiyaç kategorileri (günlük dilde, anlaşılır)
  const userNeedCategories = getAllUserNeedCategories()

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">{t.steps.category.title}</h2>
        <p className="text-sm text-muted-foreground">
          {locale === 'tr' 
            ? 'Ne için dışarı çıkıyorsun? Yorumları analiz edip en uygun yeri seçeceğiz.'
            : 'What are you going out for? We will analyze reviews and choose the best place for you.'}
        </p>
      </div>

      {/* Kullanıcı İhtiyaç Kategorileri - KULLANICI DOSTU */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {locale === 'tr' ? 'Ne için dışarı çıkıyorsun?' : 'What are you going out for?'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {userNeedCategories.map((userNeed) => {
            const IconComponent = userNeed.icon && iconMap[userNeed.icon] ? iconMap[userNeed.icon] : MoreHorizontal
            const isSelected = selected === userNeed.id

            return (
              <button
                key={userNeed.id}
                onClick={() => handleSelect(userNeed.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all duration-200",
                  "hover:scale-105 hover:shadow-lg active:scale-95",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <div className={cn(
                  "p-4 rounded-full text-white transition-all",
                  isSelected ? (userNeed.color || "bg-primary") : "bg-muted text-muted-foreground"
                )}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className={cn(
                    "text-base font-semibold text-center leading-tight",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {userNeed.displayName[locale]}
                  </span>
                  {userNeed.description && (
                    <span className="text-xs text-muted-foreground text-center px-2">
                      {userNeed.description[locale]}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Not: Kullanıcı ihtiyaç kategorisi seçildiğinde, o ihtiyaca karşılık gelen Google Maps kategorileri otomatik olarak aranacak */}
      {/* Örnek: "Yemek" seçilince → restaurant, cafe, bar, bakery, meal_takeaway, meal_delivery aranacak */}
    </div>
  )
}
