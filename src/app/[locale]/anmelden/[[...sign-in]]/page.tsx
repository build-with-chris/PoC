import { SignIn } from '@clerk/nextjs'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export default async function SignInPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('auth')
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
      <p className="mt-2 mb-8 text-center text-muted">{t('intro')}</p>
      <SignIn
        path={`/${locale}/anmelden`}
        routing="path"
        fallbackRedirectUrl={`/${locale}`}
        withSignUp={false}
      />
      <p className="mt-6 text-sm text-muted">
        {t('noAccess')}{' '}
        <Link href="/zugang" className="underline hover:text-ink">
          {t('requestLink')}
        </Link>
      </p>
    </div>
  )
}
