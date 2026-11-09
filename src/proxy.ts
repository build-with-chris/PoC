import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Alles ausser Next-Interna und Dateien mit Endung
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
}
