import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intl = createIntlMiddleware(routing)

// Nur die Anmeldeseite ist ohne Login erreichbar
const isSignIn = createRouteMatcher(['/:locale/anmelden(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (!isSignIn(req)) {
    const { userId } = await auth()
    if (!userId) {
      const first = req.nextUrl.pathname.split('/')[1]
      const locale = (routing.locales as readonly string[]).includes(first) ? first : routing.defaultLocale
      const url = new URL(`/${locale}/anmelden`, req.url)
      url.searchParams.set('redirect_url', req.nextUrl.pathname + req.nextUrl.search)
      return NextResponse.redirect(url)
    }
  }
  return intl(req)
})

export const config = {
  // Alles ausser Next-Interna und Dateien mit Endung
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
}
