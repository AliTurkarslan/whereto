'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressStepperProps {
  currentStep: number
  totalSteps: number
  labels?: string[]
}

export function ProgressStepper({ currentStep, totalSteps, labels }: ProgressStepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const step = index + 1
          const isCompleted = step < currentStep
          const isCurrent = step === currentStep
          const isUpcoming = step > currentStep

          return (
            <div key={step} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "bg-primary border-primary text-primary-foreground scale-110 shadow-lg shadow-primary/50",
                    isUpcoming && "bg-background border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step}</span>
                  )}
                </div>
                {labels && labels[index] && (
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium transition-colors duration-300",
                      isCurrent && "text-primary",
                      isCompleted && "text-muted-foreground",
                      isUpcoming && "text-muted-foreground/50"
                    )}
                  >
                    {labels[index]}
                  </span>
                )}
              </div>

              {/* Connector Line */}
              {index < totalSteps - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-all duration-300",
                    step < currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


