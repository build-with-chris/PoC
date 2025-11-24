import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "../components/Navbar";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finanz-Prognose | Finanzkalkulator",
  description: "Professioneller Finanzkalkulator für detaillierte Einnahmen- und Ausgabenprognosen. Erstellen Sie Szenarien, analysieren Sie Kennzahlen und planen Sie Ihre Finanzen präzise.",
  keywords: ["Finanzkalkulator", "Finanzprognose", "Einnahmen", "Ausgaben", "Gewinn", "Kostenplanung"],
  authors: [{ name: "Finanz-Team" }],
  openGraph: {
    title: "Finanz-Prognose | Finanzkalkulator",
    description: "Professioneller Finanzkalkulator für detaillierte Einnahmen- und Ausgabenprognosen. Erstellen Sie Szenarien, analysieren Sie Kennzahlen und planen Sie Ihre Finanzen präzise.",
    type: "website",
    locale: "de_DE",
    siteName: "Finanz-Prognose",
  },
  twitter: {
    card: "summary_large_image",
    title: "Finanz-Prognose | Finanzkalkulator",
    description: "Professioneller Finanzkalkulator für detaillierte Einnahmen- und Ausgabenprognosen.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const locales = ['de', 'en'];

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Await the params in Next.js 16
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <main className="pt-16">
            {children}
          </main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
