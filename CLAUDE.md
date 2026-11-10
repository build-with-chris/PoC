# Pepe Dome Finanzregler

Interaktiver Rechner für Mitwirkende des Pepe Dome (Ort für zeitgenössischen Zirkus in München). Zielgruppe hat keinen BWL-Hintergrund. Leitfrage der App: "Was muss passieren, damit es sich trägt?"

## Stack

Next.js 16 (App Router), next-intl (de, en), Tailwind CSS 4, Recharts, zod. Anmeldung über Clerk (`src/proxy.ts` schützt alles außer `/[locale]/anmelden` und `/[locale]/zugang`). Keine Datenbank. Deployment auf Vercel.

## Regeln für dieses Repo

- **Keine echten Zahlen in den Code.** Das Repo ist öffentlich. Echte Grundwerte stehen nur in der Umgebungsvariable `PEPE_DOME_WERTE` (lokal `.env`, online Vercel). `EXAMPLE_INPUTS` in `src/lib/inputs.ts` sind bewusst erfundene Beispielwerte.
- `src/lib/base-inputs.ts` nur auf dem Server importieren.
- Rechnung nur in `src/lib/model.ts`, als reine Funktionen. Neue Regeln dort, mit Test in `src/lib/model.test.ts`.
- Neues Eingabefeld: `Inputs` in `model.ts`, Beispielwert in `inputs.ts`, Regler in `fields.ts`, Texte in beiden Sprachdateien unter `fields.<key>`.
- Alle sichtbaren Texte in `src/i18n/locales/de.json` und `en.json`. Du-Ton wie auf pepe-dome.de, einfache Sprache, keine Gedankenstriche.
- Farben nur über die Tokens in `src/app/globals.css` (`bg-surface`, `text-ink`, `text-plus`, `text-minus` ...), dann passt der dunkle Modus automatisch.

## Prüfen

```bash
npm run typecheck && npm run lint && npm test
```

Danach `npm run dev` und Rundgang (`/de`) sowie Regler (`/de/regler`) ansehen.
