'use client'

import { useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { ReviewCategory } from '@/lib/types/review'
import { getTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle, TrendingUp } from 'lucide-react'

interface ReviewAnalysisProps {
  categories?: ReviewCategory[]
  locale?: 'tr' | 'en'
}

export function ReviewAnalysis({ categories, locale = 'tr' }: ReviewAnalysisProps) {
  const t = getTranslations(locale)

  if (!categories || categories.length === 0) {
    return null
  }

  const getCategoryName = (categoryKey: string) => {
    return t.results.categories[categoryKey as keyof typeof t.results.categories] || categoryKey
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-950/20'
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-950/20'
    return 'bg-orange-100 dark:bg-orange-950/20'
  }

  return (
    <div className="space-y-3">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="review-analysis" className="border-0">
          <AccordionTrigger className="text-left hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <div className="font-semibold">{t.results.reviewAnalysis}</div>
                <div className="text-xs text-muted-foreground font-normal">
                  {t.results.reviewAnalysisDesc}
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              {categories.map((category, index) => (
                <div
                  key={index}
                  className={cn(
                    "rounded-lg p-4 border transition-all",
                    getScoreBgColor(category.score),
                    "border-border/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">
                      {getCategoryName(category.name)}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {category.score}%
                      </span>
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-300",
                            getScoreColor(category.score)
                          )}
                          style={{ width: `${category.score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sentiment Bar */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">
                        Pozitif: {Math.round(category.positiveRatio * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${category.positiveRatio * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Positive Examples */}
                  {category.positiveExamples && category.positiveExamples.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-green-900 dark:text-green-100">
                          {t.results.positiveExamples}
                        </span>
                      </div>
                      <div className="space-y-1 pl-6">
                        {category.positiveExamples.slice(0, 2).map((example, idx) => (
                          <p
                            key={idx}
                            className="text-xs text-green-800 dark:text-green-200 leading-relaxed"
                          >
                            &ldquo;{example}&rdquo;
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Negative Examples */}
                  {category.negativeExamples && category.negativeExamples.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-4 w-4 text-orange-600" />
                        <span className="text-xs font-medium text-orange-900 dark:text-orange-100">
                          {t.results.negativeExamples}
                        </span>
                      </div>
                      <div className="space-y-1 pl-6">
                        {category.negativeExamples.slice(0, 2).map((example, idx) => (
                          <p
                            key={idx}
                            className="text-xs text-orange-800 dark:text-orange-200 leading-relaxed"
                          >
                            &ldquo;{example}&rdquo;
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

