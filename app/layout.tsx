import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'WhereTo - Pişman Olmazsın',
    template: '%s | WhereTo',
  },
  description: 'Yanlış yer seçme korkusunu ortadan kaldır. Yakın mekanları uygunluk skoru ile görüntüle.',
  keywords: ['mekan önerisi', 'restoran', 'kafe', 'bar', 'kuaför', 'spa', 'alışveriş', 'eğlence'],
  authors: [{ name: 'WhereTo' }],
  creator: 'WhereTo',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://whereto.app',
    title: 'WhereTo - Pişman Olmazsın',
    description: 'Yanlış yer seçme korkusunu ortadan kaldır',
    siteName: 'WhereTo',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WhereTo - Pişman Olmazsın',
    description: 'Yanlış yer seçme korkusunu ortadan kaldır',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { getGoogleMapsApiKey } = require('@/lib/config/environment')
  const apiKey = getGoogleMapsApiKey()
  
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
        {/* Google Maps JavaScript API - Body içinde lazy load */}
        {apiKey && (
          <Script
            id="google-maps-api"
            src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`}
            strategy="lazyOnload"
          />
        )}
      </body>
    </html>
  )
}
