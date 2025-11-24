import { redirect } from 'next/navigation'

export default async function Home({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // Umleitung zur Prognose-Seite - das ist die einzige relevante Funktion
  redirect(`/${locale}/preview`)
}
