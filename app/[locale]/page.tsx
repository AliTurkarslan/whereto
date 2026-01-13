import { Wizard } from '@/components/Wizard'
import { FeedbackButton } from '@/components/FeedbackButton'

interface PageProps {
  params: {
    locale: 'tr' | 'en'
  }
}

export default function LocalePage({ params }: PageProps) {
  const locale = params.locale || 'tr'
  return (
    <>
      <Wizard locale={locale} />
      <FeedbackButton locale={locale} />
    </>
  )
}


