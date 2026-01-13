'use client'

import { Badge } from './ui/badge'
import { Award, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BestChoiceBadgeProps {
  isBest: boolean
  locale?: 'tr' | 'en'
  className?: string
}

export function BestChoiceBadge({ isBest, locale = 'tr', className }: BestChoiceBadgeProps) {
  if (!isBest) return null

  return (
    <Badge 
      className={cn(
        "absolute -top-3 -right-3 z-10 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold text-xs shadow-lg border-2 border-white dark:border-gray-900",
        "animate-pulse hover:animate-none hover:scale-110 hover:shadow-xl transition-all duration-300",
        "cursor-default",
        className
      )}
    >
      <Award className="h-3 w-3 mr-1 inline transition-transform duration-300 hover:rotate-12" />
      {locale === 'tr' ? 'En İyi Seçim' : 'Best Choice'}
    </Badge>
  )
}


