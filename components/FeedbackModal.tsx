'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Checkbox } from './ui/checkbox'
import { Star, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  locale?: 'tr' | 'en'
}

export function FeedbackModal({ isOpen, onClose, locale = 'tr' }: FeedbackModalProps) {
  const [rating, setRating] = useState<number | null>(null)
  const [category, setCategory] = useState<string>('')
  const [feedback, setFeedback] = useState('')
  const [issues, setIssues] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const categories = [
    { value: 'usability', label: locale === 'tr' ? 'Kullanılabilirlik' : 'Usability' },
    { value: 'design', label: locale === 'tr' ? 'Tasarım' : 'Design' },
    { value: 'performance', label: locale === 'tr' ? 'Performans' : 'Performance' },
    { value: 'features', label: locale === 'tr' ? 'Özellikler' : 'Features' },
    { value: 'other', label: locale === 'tr' ? 'Diğer' : 'Other' },
  ]

  const issueOptions = [
    { value: 'slow', label: locale === 'tr' ? 'Yavaş yükleme' : 'Slow loading' },
    { value: 'confusing', label: locale === 'tr' ? 'Kafa karıştırıcı' : 'Confusing' },
    { value: 'missing', label: locale === 'tr' ? 'Eksik özellik' : 'Missing feature' },
    { value: 'bug', label: locale === 'tr' ? 'Hata/Bug' : 'Bug' },
    { value: 'ui', label: locale === 'tr' ? 'Arayüz sorunu' : 'UI issue' },
  ]

  const handleSubmit = async () => {
    if (!rating || !category || !feedback.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          category,
          feedback: feedback.trim(),
          issues,
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
          url: typeof window !== 'undefined' ? window.location.href : '',
          timestamp: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        setIsSubmitted(true)
        setTimeout(() => {
          handleClose()
        }, 2000)
      } else {
        throw new Error('Failed to submit feedback')
      }
    } catch (error) {
      console.error('Feedback submission error:', error)
      alert(locale === 'tr' ? 'Geri bildirim gönderilirken bir hata oluştu. Lütfen tekrar deneyin.' : 'An error occurred while submitting feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitted) {
      setRating(null)
      setCategory('')
      setFeedback('')
      setIssues([])
      setIsSubmitted(false)
    }
    onClose()
  }

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <h3 className="text-xl font-semibold text-center">
              {locale === 'tr' ? 'Teşekkürler!' : 'Thank you!'}
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              {locale === 'tr' 
                ? 'Geri bildiriminiz alındı. Değerli görüşleriniz için teşekkür ederiz!'
                : 'Your feedback has been received. Thank you for your valuable input!'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {locale === 'tr' ? 'Geri Bildirim Ver' : 'Give Feedback'}
          </DialogTitle>
          <DialogDescription>
            {locale === 'tr'
              ? 'Görüşleriniz bizim için çok değerli! Uygulamayı nasıl iyileştirebileceğimizi söyleyin.'
              : 'Your opinion is very valuable to us! Tell us how we can improve the app.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating */}
          <div className="space-y-3">
            <Label>
              {locale === 'tr' ? 'Genel Değerlendirme' : 'Overall Rating'} *
            </Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={cn(
                    "transition-all duration-200 hover:scale-110 active:scale-95",
                    rating && rating >= star ? "text-yellow-400" : "text-gray-300"
                  )}
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-all",
                      rating && rating >= star ? "fill-current" : ""
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-3">
            <Label>
              {locale === 'tr' ? 'Kategori' : 'Category'} *
            </Label>
            <RadioGroup value={category} onValueChange={setCategory}>
              {categories.map((cat) => (
                <div key={cat.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={cat.value} id={cat.value} />
                  <Label htmlFor={cat.value} className="font-normal cursor-pointer">
                    {cat.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Issues (Optional) */}
          <div className="space-y-3">
            <Label>
              {locale === 'tr' ? 'Karşılaştığınız Sorunlar (İsteğe Bağlı)' : 'Issues You Encountered (Optional)'}
            </Label>
            <div className="space-y-2">
              {issueOptions.map((issue) => (
                <div key={issue.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={issue.value}
                    checked={issues.includes(issue.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setIssues([...issues, issue.value])
                      } else {
                        setIssues(issues.filter(i => i !== issue.value))
                      }
                    }}
                  />
                  <Label htmlFor={issue.value} className="font-normal cursor-pointer text-sm">
                    {issue.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback Text */}
          <div className="space-y-3">
            <Label htmlFor="feedback">
              {locale === 'tr' ? 'Detaylı Geri Bildirim' : 'Detailed Feedback'} *
            </Label>
            <Textarea
              id="feedback"
              placeholder={locale === 'tr' 
                ? 'Lütfen görüşlerinizi, önerilerinizi veya karşılaştığınız sorunları detaylı olarak yazın...'
                : 'Please write your opinions, suggestions, or issues you encountered in detail...'}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              {locale === 'tr' ? 'İptal' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!rating || !category || !feedback.trim() || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {locale === 'tr' ? 'Gönderiliyor...' : 'Submitting...'}
                </>
              ) : (
                locale === 'tr' ? 'Gönder' : 'Submit'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}



