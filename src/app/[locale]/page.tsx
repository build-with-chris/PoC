import { setRequestLocale } from 'next-intl/server'
import Tour from '@/components/Tour'
import ExampleBanner from '@/components/ExampleBanner'
import { getBaseInputs } from '@/lib/base-inputs'

export default async function TourPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const { inputs, source } = getBaseInputs()
  return (
    <>
      {source === 'example' && <ExampleBanner />}
      <Tour base={inputs} />
    </>
  )
}
