import { setRequestLocale } from 'next-intl/server'
import CostsOverview from '@/components/CostsOverview'
import ExampleBanner from '@/components/ExampleBanner'
import { getBaseInputs } from '@/lib/base-inputs'

export default async function CostsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const { inputs, source } = getBaseInputs()
  return (
    <>
      {source === 'example' && <ExampleBanner />}
      <CostsOverview base={inputs} />
    </>
  )
}
