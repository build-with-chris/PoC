import { Waitlist } from '@clerk/nextjs'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export default async function AccessRequestPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('auth')
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">{t('requestTitle')}</h1>
      <p className="mt-2 mb-8 text-center text-muted">{t('requestIntro')}</p>
      <Waitlist signInUrl={`/${locale}/anmelden`} afterJoinWaitlistUrl={`/${locale}/zugang`} />
      <Link href="/anmelden" className="mt-6 text-sm text-muted underline hover:text-ink">
        {t('toSignIn')}
      </Link>
    </div>
  )
}
