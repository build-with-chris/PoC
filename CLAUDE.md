# Claude Code - Projekt-Kontext

## Projekt-Übersicht

Dies ist eine **Finanz-Tracking-Anwendung** für Fitnessstudios und ähnliche Unternehmen. Die App ermöglicht die Verwaltung von Einnahmen, Ausgaben, Schulden und bietet detaillierte Prognose- und Planungstools.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React Server Components)
- **Database**: PostgreSQL mit Prisma ORM
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **Charts**: Recharts
- **Deployment**: Vercel

## Projekt-Struktur

```
src/app/
├── actions/              # Server Actions für Transaktionen
├── api/                  # API Routes
│   ├── analyze-preview/  # Preview-Analyse
│   ├── forecast/         # Prognose-Daten
│   ├── import/          # CSV-Import
│   └── weekly-data/     # Wöchentliche Statistiken
├── components/          # Wiederverwendbare Komponenten
│   ├── KPICards.tsx     # Dashboard-KPIs
│   ├── Navbar.tsx       # Navigation
│   ├── TransactionForm.tsx
│   └── TransactionList.tsx
├── debts/              # Schulden-Übersicht
├── forecast/           # 12-Monats-Prognose
├── import/             # CSV-Import-Seite
├── preview/            # Umsatzplanung-Calculator
└── page.tsx            # Dashboard (Hauptseite)
```

## Wichtige Code-Konventionen

### 1. Server vs. Client Components

- **Server Components** (Standard): Alle page.tsx Dateien im app/ Ordner
  - Verwenden `async` für Datenbankzugriffe
  - Nutzen Prisma direkt
  - Keine `useState`, `useEffect`, etc.

- **Client Components** (`'use client'`): Interaktive Komponenten
  - Forms, Charts, Interaktionen
  - Beispiele: TransactionForm, forecast/page.tsx, preview/page.tsx

### 2. Datenbankzugriff

```typescript
import { prisma } from '@/lib/prisma'

// In Server Components direkt nutzen
const transactions = await prisma.transaction.findMany({ ... })
```

### 3. Server Actions

```typescript
// In actions/transactions.ts
'use server'
import { revalidatePath } from 'next/cache'

export async function createTransaction(formData: FormData) {
  // ... Prisma Operation
  revalidatePath('/') // Cache invalidieren
}
```

### 4. Styling-Patterns

```typescript
// Dark Mode Support ist implementiert
className="text-zinc-900 dark:text-zinc-50"
className="bg-white dark:bg-zinc-900"

// Konsistente Farben
- Einnahmen: green (text-green-600 dark:text-green-400)
- Ausgaben: red (text-red-600 dark:text-red-400)
- Highlight: blue/orange
```

## Wichtige Features und deren Implementierung

### 1. Preview-Calculator (src/app/preview/page.tsx)

**Wichtigste Berechnungslogik:**
- **Kurse**: Pro-Teilnehmer-Preise (10-30€) mit Trainerkosten
  - Formel: `(preis × teilnehmer - trainerkosten) × kurse/woche`
- **Workshops**: Gewinn pro Teilnehmer (10-30€)
  - Formel: `(gewinn × teilnehmer × workshops/monat) / 4.33`
- Wochen-zu-Monat-Konvertierung: `× 4.33`

### 2. Forecast (src/app/forecast/page.tsx)

- Verwendet Recharts für Visualisierung
- 3 Szenarien: Base, Optimistisch (+20%), Pessimistisch (-20%)
- Break-Even-Berechnung

### 3. Schulden-Tracking (src/app/debts/page.tsx)

- Nutzt `isAdvanced`, `advancedBy`, `isSettled` Felder
- Gruppiert nach Person

### 4. CSV-Import (src/app/import/page.tsx)

- Nutzt PapaParse
- Mapping von CSV-Spalten zu Transaktions-Feldern
- Bulk-Import über API

## Datenbank-Schema (Prisma)

```prisma
model Transaction {
  id          String   @id @default(cuid())
  date        DateTime
  amount      Decimal  @db.Decimal(10,2)
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  counterparty String?
  note        String?
  
  // Advanced Payment Tracking
  isAdvanced  Boolean  @default(false)
  advancedBy  String?
  isSettled   Boolean  @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Category {
  id           String        @id @default(cuid())
  name         String
  type         String        // "income" oder "expense"
  color        String?
  transactions Transaction[]
}
```

## Häufige Aufgaben

### Neue Seite hinzufügen
1. Erstelle Ordner in `src/app/neue-seite/`
2. Erstelle `page.tsx` (Server oder Client Component)
3. Füge Link in `Navbar.tsx` hinzu

### Datenbank-Schema ändern
1. Ändere `prisma/schema.prisma`
2. Führe aus: `npm run db:migrate`
3. Aktualisiere TypeScript-Types

### Neue API Route
1. Erstelle `src/app/api/route-name/route.ts`
2. Exportiere `GET`, `POST`, etc. Funktionen
3. Nutze `NextResponse.json()` für Responses

### Neue Server Action
1. Füge zu `src/app/actions/transactions.ts` hinzu
2. Markiere mit `'use server'`
3. Nutze `revalidatePath()` für Cache-Invalidierung

## Deployment

- **Plattform**: Vercel
- **Datenbank**: Vercel Postgres
- **Build Command**: Automatisch (`npm run build`)
- **Env Variables**: `DATABASE_URL`, `POSTGRES_URL_NON_POOLING`

### Vercel-spezifische Konfiguration
- `vercel.json`: Build-Konfiguration
- `package.json`: `postinstall` Script für Prisma Generate
- Build Script beinhaltet: Prisma Generate → Migrate → Next Build

## Entwickler-Notizen

### Bekannte Besonderheiten
- Alle Beträge sind `Decimal` in Prisma, müssen zu `Number()` konvertiert werden
- Datumsangaben sind ISO-Strings im Frontend, `DateTime` in Prisma
- Dark Mode wird über Tailwind's `dark:` Prefix gesteuert
- Recharts benötigt responsive Container: `<ResponsiveContainer width="100%" height={300}>`

### Best Practices für dieses Projekt
1. Immer `revalidatePath()` nach Datenänderungen nutzen
2. Fehlerbehandlung mit try/catch bei Server Actions
3. Loading States bei Client Components (`useState` für loading)
4. Konsistente Farbgebung und Dark Mode Support
5. Responsive Design mit Tailwind's `md:`, `lg:` Breakpoints
6. TypeScript-Types aus Prisma nutzen: `Prisma.TransactionCreateInput`

## Häufige Probleme & Lösungen

### Problem: Prisma Client nicht gefunden
```bash
npm run db:generate
```

### Problem: Migrations schlagen fehl
```bash
npm run db:reset  # Vorsicht: Löscht alle Daten!
```

### Problem: Stale Cache
```typescript
import { revalidatePath } from 'next/cache'
revalidatePath('/')  // oder spezifischer Pfad
```

### Problem: TypeScript-Fehler nach Schema-Änderung
```bash
npm run db:generate  # Regeneriert Prisma Client Types
```

## Nächste geplante Features

- [ ] Export-Funktion (PDF/Excel Reports)
- [ ] Mehrbenutzer-Support mit Authentifizierung
- [ ] Budget-Planung und Alarme
- [ ] Erweiterte Filter und Suche
- [ ] Dashboard-Widgets anpassbar machen
- [ ] Mobile App (React Native?)

## Wichtige Links

- [Next.js 16 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Recharts](https://recharts.org)
- [Vercel Deployment](https://vercel.com/docs)

## Kontakt & Wartung

Bei Fragen zu diesem Projekt, siehe README.md für Deployment-Anleitungen oder erstelle ein GitHub Issue.
