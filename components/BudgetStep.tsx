'use client'

import { useState } from 'react'
import { getTranslations } from '@/lib/i18n'
import { DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BudgetPreference } from '@/lib/types/user-profile'

interface BudgetStepProps {
  locale?: 'tr' | 'en'
  onBudgetChange: (budget: BudgetPreference) => void
  initialBudget?: BudgetPreference
}

const budgets: Array<{ value: BudgetPreference; label: string; icon: string; color: string }> = [
  { value: 'budget', label: 'Ekonomik', icon: '$', color: 'bg-green-500 hover:bg-green-600' },
  { value: 'moderate', label: 'Orta Seviye', icon: '$$', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { value: 'premium', label: 'Premium', icon: '$$$', color: 'bg-purple-500 hover:bg-purple-600' },
  { value: 'any', label: 'Fark Etmez', icon: '$$$$', color: 'bg-gray-500 hover:bg-gray-600' },
]

export function BudgetStep({ locale = 'tr', onBudgetChange, initialBudget }: BudgetStepProps) {
  const t = getTranslations(locale)
  const [selected, setSelected] = useState<BudgetPreference | undefined>(initialBudget)

  const handleSelect = (value: BudgetPreference) => {
    setSelected(value)
    onBudgetChange(value)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">
          {locale === 'tr' ? 'Bütçe Tercihiniz?' : 'Budget Preference?'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {locale === 'tr' 
            ? 'Ne kadar harcamak istersiniz? Bu bilgi size uygun yerleri bulmamızı sağlar.'
            : 'How much do you want to spend? This helps us find places that match your budget.'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {budgets.map((budget) => {
          const isSelected = selected === budget.value
          
          return (
            <button
              key={budget.value}
              onClick={() => handleSelect(budget.value)}
              className={cn(
                "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200",
                "hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]",
                isSelected
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div className={cn(
                "p-4 rounded-full text-white text-2xl font-bold transition-all",
                isSelected ? budget.color : "bg-muted text-muted-foreground"
              )}>
                {budget.icon}
              </div>
              <span className={cn(
                "text-base font-medium",
                isSelected ? "text-primary font-semibold" : "text-foreground"
              )}>
                {budget.label}
              </span>
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



