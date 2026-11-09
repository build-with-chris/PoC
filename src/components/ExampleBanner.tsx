import { getTranslations } from 'next-intl/server'

export default async function ExampleBanner() {
  const t = await getTranslations('banner')
  return (
    <div className="border-b border-line bg-warn-soft">
      <p className="mx-auto max-w-6xl px-4 py-2 text-sm text-warn">{t('example')}</p>
    </div>
  )
}
