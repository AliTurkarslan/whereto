'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ScoreDisplayProps {
  score: number
  locale?: 'tr' | 'en'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showProgress?: boolean
  className?: string
}

export function ScoreDisplay({ 
  score, 
  locale = 'tr', 
  size = 'md',
  showLabel = true,
  showProgress = true,
  className 
}: ScoreDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return {
      bg: 'from-emerald-500 via-green-500 to-emerald-600',
      ring: 'ring-emerald-500/30',
      text: 'text-emerald-700 dark:text-emerald-300',
      progress: 'bg-emerald-500',
      label: locale === 'tr' ? 'Mükemmel' : 'Excellent'
    }
    if (score >= 60) return {
      bg: 'from-amber-500 via-yellow-500 to-amber-600',
      ring: 'ring-amber-500/30',
      text: 'text-amber-700 dark:text-amber-300',
      progress: 'bg-amber-500',
      label: locale === 'tr' ? 'İyi' : 'Good'
    }
    return {
      bg: 'from-orange-500 via-red-500 to-orange-600',
      ring: 'ring-orange-500/30',
      text: 'text-orange-700 dark:text-orange-300',
      progress: 'bg-orange-500',
      label: locale === 'tr' ? 'Orta' : 'Average'
    }
  }

  const getScoreTrend = (score: number) => {
    if (score >= 80) return { icon: TrendingUp, text: locale === 'tr' ? 'Çok Uygun' : 'Very Suitable' }
    if (score >= 60) return { icon: TrendingUp, text: locale === 'tr' ? 'Uygun' : 'Suitable' }
    return { icon: TrendingDown, text: locale === 'tr' ? 'Dikkatli Ol' : 'Be Careful' }
  }

  const colors = getScoreColor(score)
  const trend = getScoreTrend(score)
  const TrendIcon = trend.icon

  const sizeClasses = {
    sm: {
      container: 'w-12 h-12',
      text: 'text-base',
      percent: 'text-[8px]',
      ring: 'ring-2'
    },
    md: {
      container: 'w-16 h-16',
      text: 'text-xl',
      percent: 'text-[10px]',
      ring: 'ring-2'
    },
    lg: {
      container: 'w-20 h-20',
      text: 'text-2xl',
      percent: 'text-xs',
      ring: 'ring-4'
    }
  }

  const sizeConfig = sizeClasses[size]

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Circular Score Badge */}
      <div className={cn(
        "relative flex items-center justify-center rounded-full",
        "bg-gradient-to-br shadow-lg",
        colors.bg,
        colors.ring,
        sizeConfig.container,
        sizeConfig.ring,
        "transition-all duration-300 hover:scale-110 hover:shadow-xl"
      )}>
        {/* Score Text */}
        <div className="flex flex-col items-center justify-center">
          <span className={cn("font-extrabold text-white leading-none", sizeConfig.text)}>
            {score}
          </span>
          <span className={cn("text-white font-bold leading-none", sizeConfig.percent)}>%</span>
        </div>

        {/* Circular Progress Ring */}
        {showProgress && (
          <svg 
            className="absolute inset-0 w-full h-full transform -rotate-90" 
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="4"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - score / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
        )}

        {/* Pulse Animation for High Scores */}
        {score >= 80 && (
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
        )}
      </div>

      {/* Label and Trend */}
      {showLabel && (
        <div className="flex flex-col items-center gap-1">
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
            colors.text,
            "bg-white/50 dark:bg-black/20 backdrop-blur-sm"
          )}>
            <TrendIcon className="h-3 w-3" />
            <span>{trend.text}</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">
            {colors.label}
          </span>
        </div>
      )}

      {/* Progress Bar (Alternative) */}
      {showProgress && size === 'lg' && (
        <div className="w-full max-w-[120px] h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              colors.progress
            )}
            style={{ width: `${score}%` }}
          />
        </div>
      )}
    </div>
  )
}



