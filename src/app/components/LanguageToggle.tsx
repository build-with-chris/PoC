'use client'
import { useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'

export default function LanguageToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const toggleLanguage = () => {
    const newLocale = locale === 'de' ? 'en' : 'de'
    // Replace the locale in the current path
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(newPath)
  }

  return (
    <button
      onClick={toggleLanguage}
      className="ml-2 px-3 py-2 rounded-md text-sm font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
      aria-label="Toggle language"
    >
      {locale === 'de' ? 'EN' : 'DE'}
    </button>
  )
}
