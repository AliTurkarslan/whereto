'use client'

import { useState } from 'react'
import { MessageSquare, X } from 'lucide-react'
import { Button } from './ui/button'
import { FeedbackModal } from './FeedbackModal'
import { cn } from '@/lib/utils'

interface FeedbackButtonProps {
  locale?: 'tr' | 'en'
  className?: string
}

export function FeedbackButton({ locale = 'tr', className }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300",
          "h-14 w-14 p-0 bg-primary text-primary-foreground",
          "hover:scale-110 active:scale-95",
          "animate-in fade-in slide-in-from-bottom-4",
          className
        )}
        title={locale === 'tr' ? 'Geri Bildirim Ver' : 'Give Feedback'}
        aria-label={locale === 'tr' ? 'Geri Bildirim Ver' : 'Give Feedback'}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
      <FeedbackModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        locale={locale}
      />
    </>
  )
}



