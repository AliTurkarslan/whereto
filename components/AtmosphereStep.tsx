'use client'

import { useState } from 'react'
import { getTranslations } from '@/lib/i18n'
import { Volume2, Music, Heart, Coffee, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AtmospherePreference } from '@/lib/types/user-profile'

interface AtmosphereStepProps {
  locale?: 'tr' | 'en'
  onAtmosphereChange: (atmosphere: AtmospherePreference) => void
  initialAtmosphere?: AtmospherePreference
}

const atmospheres: Array<{ value: AtmospherePreference; label: string; icon: typeof Volume2; color: string; description: string }> = [
  { value: 'quiet', label: 'Sessiz', icon: Volume2, color: 'bg-blue-500 hover:bg-blue-600', description: 'Huzurlu ve sakin' },
  { value: 'lively', label: 'Neşeli', icon: Music, color: 'bg-orange-500 hover:bg-orange-600', description: 'Canlı ve eğlenceli' },
  { value: 'romantic', label: 'Romantik', icon: Heart, color: 'bg-pink-500 hover:bg-pink-600', description: 'Romantik atmosfer' },
  { value: 'casual', label: 'Gündelik', icon: Coffee, color: 'bg-green-500 hover:bg-green-600', description: 'Rahat ve gündelik' },
  { value: 'formal', label: 'Resmi', icon: Briefcase, color: 'bg-indigo-500 hover:bg-indigo-600', description: 'Şık ve resmi' },
  { value: 'any', label: 'Fark Etmez', icon: Coffee, color: 'bg-gray-500 hover:bg-gray-600', description: 'Herhangi bir ortam' },
]

export function AtmosphereStep({ locale = 'tr', onAtmosphereChange, initialAtmosphere }: AtmosphereStepProps) {
  const t = getTranslations(locale)
  const [selected, setSelected] = useState<AtmospherePreference | undefined>(initialAtmosphere)

  const handleSelect = (value: AtmospherePreference) => {
    setSelected(value)
    onAtmosphereChange(value)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">
          {locale === 'tr' ? 'Ortam Tercihiniz?' : 'Atmosphere Preference?'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {locale === 'tr' 
            ? 'Nasıl bir ortam istersiniz? Bu bilgi size uygun yerleri bulmamızı sağlar.'
            : 'What kind of atmosphere do you prefer? This helps us find places that match your preference.'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {atmospheres.map((atmosphere) => {
          const Icon = atmosphere.icon
          const isSelected = selected === atmosphere.value
          
          return (
            <button
              key={atmosphere.value}
              onClick={() => handleSelect(atmosphere.value)}
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
                isSelected ? atmosphere.color : "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="text-center">
                <span className={cn(
                  "text-base font-medium block",
                  isSelected ? "text-primary font-semibold" : "text-foreground"
                )}>
                  {atmosphere.label}
                </span>
                <span className="text-xs text-muted-foreground mt-1 block">
                  {atmosphere.description}
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



