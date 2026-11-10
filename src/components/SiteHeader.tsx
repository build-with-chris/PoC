'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Show, UserButton } from '@clerk/nextjs'
import { Link, usePathname, useRouter } from '@/i18n/navigation'

export default function SiteHeader() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const links = [
    { href: '/', label: t('tour') },
    { href: '/regler', label: t('calculator') },
  ]

  const switchLanguage = () => {
    const next = locale === 'de' ? 'en' : 'de'
    // Hash behalten, damit ein geteiltes Szenario beim Sprachwechsel bleibt
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    router.replace(`${pathname}${hash}`, { locale: next })
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight">{t('brand')}</span>
          <span className="hidden text-sm text-muted sm:inline">{t('brandSub')}</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1">
          <Show when="signed-in">
          {links.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
          </Show>
          <button
            type="button"
            onClick={switchLanguage}
            className="ml-1 rounded-md border border-line px-2.5 py-1 text-sm text-muted hover:text-ink"
          >
            {t('switchLanguage')}
          </button>
          <Show when="signed-in">
            <span className="ml-2 flex items-center">
              <UserButton />
            </span>
          </Show>
        </nav>
      </div>
    </header>
  )
}
