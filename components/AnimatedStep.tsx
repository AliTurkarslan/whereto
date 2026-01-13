'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedStepProps {
  children: ReactNode
  step: number
  currentStep: number
  className?: string
}

export function AnimatedStep({ children, step, currentStep, className }: AnimatedStepProps) {
  const isActive = step === currentStep
  const wasActive = step < currentStep

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out",
        isActive && "animate-in fade-in slide-in-from-bottom-4",
        wasActive && "opacity-0 absolute pointer-events-none",
        !isActive && !wasActive && "opacity-0 absolute pointer-events-none",
        className
      )}
    >
      {children}
    </div>
  )
}


