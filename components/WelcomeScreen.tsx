'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { X, Sparkles, MessageSquare, TrendingUp, MapPin } from 'lucide-react'
import { getTranslations } from '@/lib/i18n'
import { useRouter } from 'next/navigation'

interface WelcomeScreenProps {
  locale?: 'tr' | 'en'
  onDismiss: () => void
}

export function WelcomeScreen({ locale = 'tr', onDismiss }: WelcomeScreenProps) {
  const t = getTranslations(locale)
  const router = useRouter()
  const [showHowItWorks, setShowHowItWorks] = useState(false)

  // localStorage'da kontrol et
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenWelcome = localStorage.getItem('whereto-welcome-seen')
      if (hasSeenWelcome) {
        onDismiss()
      }
    }
  }, [onDismiss])

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('whereto-welcome-seen', 'true')
    }
    onDismiss()
  }

  const handleStart = () => {
    handleDismiss()
  }

  if (showHowItWorks) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <CardHeader className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4"
              onClick={() => setShowHowItWorks(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-bold text-gradient">
              {locale === 'tr' ? 'Nasıl Çalışır?' : 'How It Works?'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    {locale === 'tr' ? '1. Konumunu Seç' : '1. Choose Your Location'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'tr' 
                      ? 'Otomatik olarak konumunu algılayabiliriz veya manuel olarak girebilirsin.'
                      : 'We can automatically detect your location or you can enter it manually.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    {locale === 'tr' ? '2. Ne Arıyorsun?' : '2. What Are You Looking For?'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'tr' 
                      ? 'Yemek, kahve, bar, spa gibi kategorilerden birini seç.'
                      : 'Choose a category like food, coffee, bar, spa, etc.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    {locale === 'tr' ? '3. Kiminle?' : '3. Who Are You With?'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'tr' 
                      ? 'Yalnız, sevgili, arkadaş, aile veya iş arkadaşları ile mi?'
                      : 'Alone, with partner, friends, family, or colleagues?'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    {locale === 'tr' ? '4. AI Analiz Sonuçları' : '4. AI Analysis Results'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'tr' 
                      ? 'Binlerce Google yorumunu AI ile analiz ediyoruz ve sana en uygun mekanları uygunluk skoru ile gösteriyoruz. Skor ne kadar yüksekse, o mekan senin için o kadar uygun demektir!'
                      : 'We analyze thousands of Google reviews with AI and show you the most suitable places with a suitability score. The higher the score, the more suitable that place is for you!'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button onClick={handleStart} className="w-full" size="lg">
                {locale === 'tr' ? 'Başlayalım!' : 'Let\'s Start!'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto p-4 bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-gradient">
            {t.common.welcome}
          </CardTitle>
          <p className="text-muted-foreground text-base">
            {locale === 'tr' 
              ? 'Yanlış yer seçme korkusunu ortadan kaldırıyoruz. Binlerce Google yorumunu AI ile analiz ederek, senin durumuna en uygun mekanları gösteriyoruz.'
              : 'We eliminate the fear of choosing the wrong place. We analyze thousands of Google reviews with AI and show you the most suitable places for your situation.'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">1000+</div>
              <div className="text-xs text-muted-foreground">
                {locale === 'tr' ? 'Yorum Analizi' : 'Review Analysis'}
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">AI</div>
              <div className="text-xs text-muted-foreground">
                {locale === 'tr' ? 'Akıllı Skorlama' : 'Smart Scoring'}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleStart} className="w-full" size="lg">
              {locale === 'tr' ? 'Başlayalım!' : 'Let\'s Start!'}
            </Button>
            <Button 
              onClick={() => setShowHowItWorks(true)} 
              variant="outline" 
              className="w-full"
            >
              {locale === 'tr' ? 'Nasıl Çalışır?' : 'How It Works?'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


