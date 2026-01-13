'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
  variant?: 'default' | 'dots'
}

export function LoadingSpinner({ size = 'md', className, text, variant = 'default' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  if (variant === 'dots') {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
        <div className="flex gap-2">
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce transition-all duration-300" style={{ animationDelay: '0ms' }} />
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce transition-all duration-300" style={{ animationDelay: '150ms' }} />
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce transition-all duration-300" style={{ animationDelay: '300ms' }} />
        </div>
        {text && <p className="text-sm text-muted-foreground animate-pulse font-medium">{text}</p>}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <Loader2 className={cn("animate-spin text-primary transition-all duration-300", sizeClasses[size])} />
      {text && <p className="text-sm text-muted-foreground animate-pulse font-medium">{text}</p>}
    </div>
  )
}


