'use client'

import { Button } from '@/components/ui/button'
import { List, Map } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

export type ViewMode = 'list' | 'split'

interface ViewToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  locale?: 'tr' | 'en'
}

export function ViewToggle({ viewMode, onViewModeChange, locale = 'tr' }: ViewToggleProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Sadece Liste ve Bölünmüş görünüm
  const availableModes: Array<{ mode: ViewMode; icon: typeof List | typeof Map; label: string; tooltip: string }> = [
    { mode: 'split', icon: Map, label: locale === 'tr' ? 'Bölünmüş' : 'Split', tooltip: locale === 'tr' ? 'Harita ve liste birlikte' : 'Map and list together' },
    { mode: 'list', icon: List, label: locale === 'tr' ? 'Liste' : 'List', tooltip: locale === 'tr' ? 'Sadece liste' : 'List only' },
  ]

  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border/50 backdrop-blur-sm">
      {availableModes.map((view) => {
        const Icon = view.icon
        const isActive = viewMode === view.mode
        
        return (
          <Button
            key={view.mode}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange(view.mode)}
            className={cn(
              "relative transition-all duration-200",
              isActive && "shadow-sm scale-105 ring-2 ring-primary/20",
              !isActive && "hover:bg-muted hover:scale-105 hover:shadow-sm"
            )}
            title={view.tooltip}
            aria-label={view.tooltip}
            role="radio"
            aria-checked={isActive}
          >
            <Icon className={cn("h-4 w-4 transition-transform", isActive && "scale-110")} />
            <span className="hidden sm:inline ml-2 text-xs font-medium">
              {view.label}
            </span>
            {isActive && (
              <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-pulse" />
            )}
          </Button>
        )
      })}
    </div>
  )
}
