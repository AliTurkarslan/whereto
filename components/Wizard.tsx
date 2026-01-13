'use client'

import { useState, useEffect } from 'react'
import { LocationStep } from './LocationStep'
import { CategoryStep } from './CategoryStep'
import { CompanionStep } from './CompanionStep'
import { BudgetStep } from './BudgetStep'
import { AtmosphereStep } from './AtmosphereStep'
import { MealTypeStep } from './MealTypeStep'
import { SpecialNeedsStep } from './SpecialNeedsStep'
import type { BudgetPreference, AtmospherePreference, MealTypePreference, SpecialNeeds } from '@/lib/types/user-profile'
import { ProgressStepper } from './ProgressStepper'
import { AnimatedStep } from './AnimatedStep'
import { Button } from './ui/button'
import { WelcomeScreen } from './WelcomeScreen'
import { getTranslations } from '@/lib/i18n'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface WizardProps {
  locale?: 'tr' | 'en'
}

interface WizardData {
  location?: { lat: number; lng: number; address: string }
  category?: string
  companion?: string
  budget?: BudgetPreference
  atmosphere?: AtmospherePreference
  mealType?: MealTypePreference
  specialNeeds?: SpecialNeeds
  mode?: 'quick' | 'detailed' // Hızlı veya detaylı mod
}

export function Wizard({ locale = 'tr' }: WizardProps) {
  const t = getTranslations(locale)
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<WizardData>({ mode: 'quick' })
  const [showWelcome, setShowWelcome] = useState(false)
  
  // Mod seçimi (hızlı veya detaylı)
  const isQuickMode = data.mode === 'quick'
  const totalSteps = isQuickMode ? 3 : 7 // Hızlı: 3 adım, Detaylı: 7 adım

  // İlk kullanımda welcome screen göster
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenWelcome = localStorage.getItem('whereto-welcome-seen')
      if (!hasSeenWelcome) {
        setShowWelcome(true)
      }
    }
  }, [])

  const handleLocationChange = (location: { lat: number; lng: number; address: string }) => {
    setData({ ...data, location })
  }

  const handleCategoryChange = (category: string) => {
    setData({ ...data, category })
  }

  const handleCompanionChange = (companion: string) => {
    setData({ ...data, companion })
  }

  const handleBudgetChange = (budget: BudgetPreference) => {
    setData({ ...data, budget })
  }

  const handleAtmosphereChange = (atmosphere: AtmospherePreference) => {
    setData({ ...data, atmosphere })
  }

  const handleMealTypeChange = (mealType: MealTypePreference) => {
    setData({ ...data, mealType })
  }

  const handleSpecialNeedsChange = (specialNeeds: SpecialNeeds) => {
    setData({ ...data, specialNeeds })
  }

  const handleModeChange = (newMode: 'quick' | 'detailed') => {
    setData({ mode: newMode }) // Set mode and clear other data
    setStep(1) // Reset to first step when mode changes
  }

  const [validationError, setValidationError] = useState<string | null>(null)

  const handleNext = () => {
    setValidationError(null) // Clear previous errors
    
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      // Tüm adımlar tamamlandı, validasyon yap
      if (!data.location || !data.category || !data.companion) {
        setValidationError(
          locale === 'tr' 
            ? 'Lütfen tüm alanları doldurun.'
            : 'Please fill in all fields.'
        )
        return
      }

      // Konum validasyonu
      if (!data.location.lat || !data.location.lng || 
          isNaN(data.location.lat) || isNaN(data.location.lng) ||
          data.location.lat === 0 || data.location.lng === 0) {
        setValidationError(
          locale === 'tr'
            ? 'Geçerli bir konum seçin.'
            : 'Please select a valid location.'
        )
        return
      }

      // Sonuç sayfasına git
      const params = new URLSearchParams({
        lat: data.location.lat.toString(),
        lng: data.location.lng.toString(),
        address: data.location.address || '',
        category: data.category,
        companion: data.companion,
      })
      
      // Yeni faktörleri ekle (varsa)
      if (data.budget) params.set('budget', data.budget)
      if (data.atmosphere) params.set('atmosphere', data.atmosphere)
      if (data.mealType) params.set('mealType', data.mealType)
      if (data.specialNeeds) {
        const needs = Object.entries(data.specialNeeds)
          .filter(([_, value]) => value === true)
          .map(([key]) => key)
        if (needs.length > 0) {
          params.set('specialNeeds', needs.join(','))
        }
      }
      
      router.push(`/${locale}/result?${params.toString()}`)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const canProceed = () => {
    if (step === 1) return !!data.location
    if (step === 2) return !!data.category
    if (step === 3) return !!data.companion
    if (step === 4) return !!data.budget || isQuickMode
    if (step === 5) return !!data.atmosphere || isQuickMode
    if (step === 6) return !!data.mealType || isQuickMode
    if (step === 7) return true // Special needs opsiyonel
    return false
  }

  const stepLabels = isQuickMode
    ? [
        t.steps.location.title,
        t.steps.category.title,
        t.steps.companion.title,
      ]
    : [
        t.steps.location.title,
        t.steps.category.title,
        t.steps.companion.title,
        locale === 'tr' ? 'Bütçe' : 'Budget',
        locale === 'tr' ? 'Ortam' : 'Atmosphere',
        locale === 'tr' ? 'Zaman' : 'Time',
        locale === 'tr' ? 'Özel İhtiyaçlar' : 'Special Needs',
      ]

  return (
    <>
      {showWelcome && (
        <WelcomeScreen 
          locale={locale} 
          onDismiss={() => setShowWelcome(false)} 
        />
      )}
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-soft">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gradient px-2">
            {t.common.welcome}
          </h1>
          
          {/* Mod Seçimi (sadece ilk adımda) */}
          {step === 1 && (
            <div className="flex gap-2 justify-center mb-4">
              <button
                onClick={() => handleModeChange('quick')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  isQuickMode
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {locale === 'tr' ? '⚡ Hızlı' : '⚡ Quick'}
              </button>
              <button
                onClick={() => handleModeChange('detailed')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  !isQuickMode
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {locale === 'tr' ? '🔍 Detaylı' : '🔍 Detailed'}
              </button>
            </div>
          )}
          
          <div className="px-4">
            <ProgressStepper 
              currentStep={step} 
              totalSteps={totalSteps} 
              labels={stepLabels}
            />
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-xl border border-border/50 p-4 sm:p-6 space-y-6 relative min-h-[300px]">
          <AnimatedStep step={1} currentStep={step}>
            <LocationStep
              locale={locale}
              onLocationChange={handleLocationChange}
              initialLocation={data.location}
            />
          </AnimatedStep>
          <AnimatedStep step={2} currentStep={step}>
            <CategoryStep
              locale={locale}
              onCategoryChange={handleCategoryChange}
              initialCategory={data.category}
            />
          </AnimatedStep>
          <AnimatedStep step={3} currentStep={step}>
            <CompanionStep
              locale={locale}
              onCompanionChange={handleCompanionChange}
              initialCompanion={data.companion}
            />
          </AnimatedStep>
          
          {/* Detaylı mod adımları */}
          {!isQuickMode && (
            <>
              <AnimatedStep step={4} currentStep={step}>
                <BudgetStep
                  locale={locale}
                  onBudgetChange={handleBudgetChange}
                  initialBudget={data.budget}
                />
              </AnimatedStep>
              <AnimatedStep step={5} currentStep={step}>
                <AtmosphereStep
                  locale={locale}
                  onAtmosphereChange={handleAtmosphereChange}
                  initialAtmosphere={data.atmosphere}
                />
              </AnimatedStep>
              <AnimatedStep step={6} currentStep={step}>
                <MealTypeStep
                  locale={locale}
                  onMealTypeChange={handleMealTypeChange}
                  initialMealType={data.mealType}
                />
              </AnimatedStep>
              <AnimatedStep step={7} currentStep={step}>
                <SpecialNeedsStep
                  locale={locale}
                  onSpecialNeedsChange={handleSpecialNeedsChange}
                  initialSpecialNeeds={data.specialNeeds}
                />
              </AnimatedStep>
            </>
          )}

          {validationError && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive text-center">
                {validationError}
              </p>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            {step > 1 && (
              <Button 
                onClick={handleBack} 
                variant="outline" 
                className="flex-1"
              >
                {t.common.back}
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1"
            >
              {step === totalSteps ? t.common.search : t.common.next}
            </Button>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}

