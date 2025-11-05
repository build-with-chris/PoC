# Finanz-Tracking App

Eine umfassende Finanz-Tracking-Anwendung für Fitnessstudios und ähnliche Unternehmen, gebaut mit Next.js 16, Prisma und TypeScript.

## Features

- **Dashboard**: KPI-Übersicht mit Einnahmen, Kosten und Deckungsbeitrag
- **Transaktionsverwaltung**: Erfassung von Einnahmen und Ausgaben mit Kategorisierung
- **Schulden-Tracking**: Verwaltung vorgestreckter Beträge
- **CSV-Import**: Bulk-Import von Transaktionen
- **Prognose**: 12-Monats-Vorhersage mit verschiedenen Szenarien
- **Preview-Calculator**: Detaillierte Umsatzplanung mit realistischen Berechnungen
  - Kurse: Pro-Teilnehmer-Preise mit Trainerkosten
  - Workshops: Gewinn pro Teilnehmer
  - Vermietung und Fixeinnahmen
- **Dark Mode**: Vollständige Unterstützung für helles und dunkles Theme
- **Responsive Design**: Optimiert für Desktop und Mobile

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL mit Prisma ORM
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **Language**: TypeScript

## Lokale Entwicklung

### Voraussetzungen

- Node.js 18+
- PostgreSQL-Datenbank

### Installation

1. Repository klonen:
```bash
git clone <repository-url>
cd PoC
```

2. Dependencies installieren:
```bash
npm install
```

3. Umgebungsvariablen einrichten:
```bash
cp .env.example .env
```

Füge deine Datenbank-URL in `.env` ein:
```
DATABASE_URL="postgresql://user:password@localhost:5432/finanztracking"
```

4. Datenbank migrieren und seeden:
```bash
npm run db:migrate
npm run db:seed
```

5. Development Server starten:
```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser.

## Deployment auf Vercel

### 1. Vercel Postgres Datenbank erstellen

1. Gehe zu [vercel.com](https://vercel.com) und logge dich ein
2. Navigiere zu deinem Projekt (oder erstelle ein neues)
3. Gehe zu **Storage** → **Create Database** → **Postgres**
4. Erstelle eine neue Postgres-Datenbank
5. Kopiere die Umgebungsvariablen aus dem **`.env.local`** Tab

### 2. Umgebungsvariablen konfigurieren

1. Gehe zu **Settings** → **Environment Variables**
2. Füge folgende Variablen hinzu:
   - `DATABASE_URL` (von Vercel Postgres)
   - `POSTGRES_URL_NON_POOLING` (von Vercel Postgres, für Migrations)

### 3. Deploy

#### Option A: GitHub Integration (empfohlen)

1. Verbinde dein GitHub-Repository mit Vercel
2. Vercel deployt automatisch bei jedem Push zu `main`
3. Die erste Deployment wird automatisch die Datenbank migrieren

#### Option B: Vercel CLI

```bash
# Vercel CLI installieren
npm i -g vercel

# Einloggen
vercel login

# Deploy
vercel --prod
```

### 4. Datenbank initialisieren (nur beim ersten Deploy)

Nach dem ersten erfolgreichen Deployment:

1. Öffne die Vercel-Konsole für dein Projekt
2. Gehe zu **Deployments** → wähle das letzte Deployment
3. Klicke auf **...** → **Redeploy**
4. Die Migrations laufen automatisch während des Build-Prozesses

Optional: Seed-Daten hinzufügen (über Vercel CLI):
```bash
vercel env pull .env.local
npm run db:seed
```

## Verfügbare Scripts

```bash
npm run dev              # Development Server
npm run build            # Production Build (mit Prisma Generate & Migrate)
npm run start            # Production Server
npm run lint             # ESLint

# Database
npm run db:migrate       # Neue Migration erstellen (dev)
npm run db:migrate:prod  # Migrations ausführen (production)
npm run db:seed          # Seed-Daten einfügen
npm run db:studio        # Prisma Studio öffnen
npm run db:generate      # Prisma Client generieren
npm run db:reset         # Datenbank zurücksetzen
```

## Projektstruktur

```
PoC/
├── src/
│   └── app/
│       ├── actions/         # Server Actions
│       ├── api/             # API Routes
│       ├── components/      # React Components
│       ├── debts/          # Schulden-Seite
│       ├── forecast/       # Prognose-Seite
│       ├── import/         # CSV-Import-Seite
│       ├── preview/        # Preview-Calculator
│       └── page.tsx        # Dashboard
├── prisma/
│   ├── schema.prisma       # Datenbankschema
│   └── seed.ts             # Seed-Daten
├── lib/
│   └── prisma.ts           # Prisma Client
└── vercel.json             # Vercel Konfiguration
```

## Datenbank-Schema

Die App verwendet folgende Haupttabellen:

- **Transaction**: Einnahmen und Ausgaben
  - Felder: date, amount, categoryId, counterparty, note
  - Advanced Payments: isAdvanced, advancedBy, isSettled
- **Category**: Kategorisierung von Transaktionen
  - Felder: name, type (income/expense), color

## Troubleshooting

### Prisma Client Fehler

```bash
npm run db:generate
```

### Migrations schlagen fehl

```bash
# Development
npm run db:reset

# Production (Vercel)
# Redeploy über Vercel Dashboard
```

### Build-Fehler auf Vercel

Stelle sicher, dass:
- `DATABASE_URL` und `POSTGRES_URL_NON_POOLING` gesetzt sind
- Die Datenbank erreichbar ist
- `postinstall` Script in package.json vorhanden ist

## License

MIT

## Kontakt

Bei Fragen oder Problemen, bitte ein Issue erstellen.
