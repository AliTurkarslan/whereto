'use client'

import { useState } from 'react'
import { getTranslations } from '@/lib/i18n'
import { Dog, Baby, ParkingCircle, Wifi, Leaf, Sprout } from 'lucide-react'
import { Accessibility } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SpecialNeeds } from '@/lib/types/user-profile'

interface SpecialNeedsStepProps {
  locale?: 'tr' | 'en'
  onSpecialNeedsChange: (needs: SpecialNeeds) => void
  initialSpecialNeeds?: SpecialNeeds
}

const specialNeedsOptions: Array<{ key: keyof SpecialNeeds; label: string; icon: typeof Accessibility; description: string }> = [
  { key: 'wheelchair', label: 'Tekerlekli Sandalye Erişimi', icon: Accessibility, description: 'Engelli erişimi' },
  { key: 'petFriendly', label: 'Evcil Hayvan Dostu', icon: Dog, description: 'Köpek/kedi kabul edilir' },
  { key: 'kidFriendly', label: 'Çocuk Dostu', icon: Baby, description: 'Çocuklar için uygun' },
  { key: 'parking', label: 'Park Yeri', icon: ParkingCircle, description: 'Otopark mevcut' },
  { key: 'wifi', label: 'WiFi', icon: Wifi, description: 'Ücretsiz internet' },
  { key: 'vegetarian', label: 'Vejetaryen Seçenekler', icon: Leaf, description: 'Vejetaryen menü' },
  { key: 'vegan', label: 'Vegan Seçenekler', icon: Sprout, description: 'Vegan menü' },
]

export function SpecialNeedsStep({ locale = 'tr', onSpecialNeedsChange, initialSpecialNeeds }: SpecialNeedsStepProps) {
  const t = getTranslations(locale)
  const [selectedNeeds, setSelectedNeeds] = useState<SpecialNeeds>(initialSpecialNeeds || {})

  const handleToggle = (key: keyof SpecialNeeds) => {
    const updated = {
      ...selectedNeeds,
      [key]: !selectedNeeds[key],
    }
    setSelectedNeeds(updated)
    onSpecialNeedsChange(updated)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">
          {locale === 'tr' ? 'Özel İhtiyaçlar?' : 'Special Needs?'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {locale === 'tr' 
            ? 'Herhangi bir özel ihtiyacınız var mı? Bu bilgi size uygun yerleri bulmamızı sağlar.'
            : 'Do you have any special needs? This helps us find places that accommodate your needs.'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {specialNeedsOptions.map((option) => {
          const Icon = option.icon
          const isSelected = selectedNeeds[option.key] === true
          
          return (
            <button
              key={option.key}
              onClick={() => handleToggle(option.key)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200",
                "hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]",
                isSelected
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div className={cn(
                "p-3 rounded-full transition-all shrink-0",
                isSelected 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <span className={cn(
                  "text-sm font-medium block",
                  isSelected ? "text-primary font-semibold" : "text-foreground"
                )}>
                  {option.label}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5 block">
                  {option.description}
                </span>
              </div>
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
              )}
            </button>
          )
        })}
      </div>
      
      {Object.values(selectedNeeds).some(v => v === true) && (
        <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-sm text-primary text-center">
            {locale === 'tr' 
              ? 'Seçtiğiniz özel ihtiyaçlara uygun yerler gösterilecek.'
              : 'Places matching your special needs will be shown.'}
          </p>
        </div>
      )}
    </div>
  )
}

