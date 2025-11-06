import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'

// Can be imported from a shared config
const locales = ['de', 'en'] as const

export default getRequestConfig(async ({ requestLocale }) => {
  // Wait for the request locale
  const locale = await requestLocale

  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as any)) {
    notFound()
  }

  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default
  }
})
