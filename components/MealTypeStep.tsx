'use client'

import { useState } from 'react'
import { getTranslations } from '@/lib/i18n'
import { Sun, Sunrise, Sunset, Moon, Coffee } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MealTypePreference } from '@/lib/types/user-profile'

interface MealTypeStepProps {
  locale?: 'tr' | 'en'
  onMealTypeChange: (mealType: MealTypePreference) => void
  initialMealType?: MealTypePreference
}

const mealTypes: Array<{ value: MealTypePreference; label: string; icon: typeof Sun; color: string; description: string }> = [
  { value: 'breakfast', label: 'Kahvaltı', icon: Sunrise, color: 'bg-yellow-500 hover:bg-yellow-600', description: 'Sabah yemeği' },
  { value: 'lunch', label: 'Öğle Yemeği', icon: Sun, color: 'bg-orange-500 hover:bg-orange-600', description: 'Öğlen yemeği' },
  { value: 'dinner', label: 'Akşam Yemeği', icon: Sunset, color: 'bg-red-500 hover:bg-red-600', description: 'Akşam yemeği' },
  { value: 'brunch', label: 'Brunch', icon: Coffee, color: 'bg-amber-500 hover:bg-amber-600', description: 'Geç kahvaltı' },
  { value: 'late-night', label: 'Gece', icon: Moon, color: 'bg-indigo-500 hover:bg-indigo-600', description: 'Geç saatler' },
  { value: 'any', label: 'Fark Etmez', icon: Sun, color: 'bg-gray-500 hover:bg-gray-600', description: 'Herhangi bir zaman' },
]

export function MealTypeStep({ locale = 'tr', onMealTypeChange, initialMealType }: MealTypeStepProps) {
  const t = getTranslations(locale)
  const [selected, setSelected] = useState<MealTypePreference | undefined>(initialMealType)

  const handleSelect = (value: MealTypePreference) => {
    setSelected(value)
    onMealTypeChange(value)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">
          {locale === 'tr' ? 'Ne Zaman?' : 'What Time?'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {locale === 'tr' 
            ? 'Hangi öğün için gidiyorsunuz? Bu bilgi size uygun yerleri bulmamızı sağlar.'
            : 'What meal are you going for? This helps us find places that serve at that time.'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {mealTypes.map((mealType) => {
          const Icon = mealType.icon
          const isSelected = selected === mealType.value
          
          return (
            <button
              key={mealType.value}
              onClick={() => handleSelect(mealType.value)}
              className={cn(
                "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200",
                "hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]",
                isSelected
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div className={cn(
                "p-3 rounded-full text-white transition-all",
                isSelected ? mealType.color : "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="text-center">
                <span className={cn(
                  "text-base font-medium block",
                  isSelected ? "text-primary font-semibold" : "text-foreground"
                )}>
                  {mealType.label}
                </span>
                <span className="text-xs text-muted-foreground mt-1 block">
                  {mealType.description}
                </span>
              </div>
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}



