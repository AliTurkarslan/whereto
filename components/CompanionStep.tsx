'use client'

import { useState } from 'react'
import { getTranslations } from '@/lib/i18n'
import { User, Heart, Users, Baby, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CompanionStepProps {
  locale?: 'tr' | 'en'
  onCompanionChange: (companion: string) => void
  initialCompanion?: string
}

const companions = [
  { value: 'alone', key: 'alone', icon: User, color: 'bg-slate-500 hover:bg-slate-600' },
  { value: 'partner', key: 'partner', icon: Heart, color: 'bg-rose-500 hover:bg-rose-600' },
  { value: 'friends', key: 'friends', icon: Users, color: 'bg-blue-500 hover:bg-blue-600' },
  { value: 'family', key: 'family', icon: Baby, color: 'bg-green-500 hover:bg-green-600' },
  { value: 'colleagues', key: 'colleagues', icon: Briefcase, color: 'bg-indigo-500 hover:bg-indigo-600' },
]

export function CompanionStep({ locale = 'tr', onCompanionChange, initialCompanion }: CompanionStepProps) {
  const t = getTranslations(locale)
  const [selected, setSelected] = useState<string | undefined>(initialCompanion)

  const handleSelect = (value: string) => {
    setSelected(value)
    onCompanionChange(value)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">{t.steps.companion.title}</h2>
        <p className="text-sm text-muted-foreground">
          {locale === 'tr' 
            ? 'Kiminle gidiyorsun? Bu bilgi skorlamayı daha doğru yapmamızı sağlar.'
            : 'Who are you with? This information helps us score places more accurately.'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {companions.map((comp) => {
          const Icon = comp.icon
          const isSelected = selected === comp.value
          
          return (
            <button
              key={comp.value}
              onClick={() => handleSelect(comp.value)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200",
                "hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]",
                isSelected
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div className={cn(
                "p-3 rounded-full text-white transition-all shrink-0",
                isSelected ? comp.color : "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-6 w-6" />
              </div>
              <span className={cn(
                "text-base font-medium flex-1 text-left",
                isSelected ? "text-primary font-semibold" : "text-foreground"
              )}>
                {t.steps.companion[comp.key as keyof typeof t.steps.companion]}
              </span>
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
