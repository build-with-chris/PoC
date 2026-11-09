import { setRequestLocale } from 'next-intl/server'
import Calculator from '@/components/Calculator'
import ExampleBanner from '@/components/ExampleBanner'
import { getBaseInputs } from '@/lib/base-inputs'

export default async function CalculatorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const { inputs, source } = getBaseInputs()
  return (
    <>
      {source === 'example' && <ExampleBanner />}
      <Calculator base={inputs} />
    </>
  )
}
