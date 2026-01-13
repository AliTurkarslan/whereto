'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SkeletonCardProps {
  variant?: 'compact' | 'full'
}

export function SkeletonCard({ variant = 'full' }: SkeletonCardProps) {
  if (variant === 'compact') {
    return (
      <Card className="w-full animate-pulse border">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-3 min-w-0">
              <div className="h-5 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="flex gap-2">
                <div className="h-6 bg-muted rounded-full w-16" />
                <div className="h-6 bg-muted rounded-full w-20" />
              </div>
            </div>
            <div className="w-12 h-12 bg-muted rounded-full flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full animate-pulse border transition-all duration-300")}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3 min-w-0">
            <div className="h-7 bg-muted rounded-lg w-3/4" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
          <div className="w-16 h-16 bg-muted rounded-full flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Image skeleton */}
        <div className="h-48 bg-muted rounded-lg" />
        
        {/* Info badges */}
        <div className="flex gap-4 flex-wrap">
          <div className="h-5 bg-muted rounded-full w-20" />
          <div className="h-5 bg-muted rounded-full w-16" />
          <div className="h-5 bg-muted rounded-full w-24" />
        </div>
        
        {/* Action buttons skeleton */}
        <div className="flex gap-2 flex-wrap">
          <div className="h-9 bg-muted rounded-lg w-32" />
          <div className="h-9 bg-muted rounded-lg w-28" />
        </div>
        
        {/* Why section */}
        <div className="bg-muted rounded-lg p-4 space-y-2">
          <div className="h-4 bg-muted-foreground/20 rounded w-1/4" />
          <div className="h-4 bg-muted-foreground/20 rounded w-full" />
          <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
        </div>
        
        {/* Risks section */}
        <div className="bg-muted rounded-lg p-4 space-y-2">
          <div className="h-4 bg-muted-foreground/20 rounded w-1/4" />
          <div className="h-4 bg-muted-foreground/20 rounded w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

