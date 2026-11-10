# Pepe Dome Finanzregler

Ein interaktiver Rechner für alle, die beim [Pepe Dome](https://pepe-dome.de/de) mitmachen wollen. Er zeigt ohne BWL-Vorwissen, was der Dome jeden Monat kostet, woher das Geld kommt und was passieren muss, damit er sich trägt.

## Was die App kann

- **Rundgang** (`/de`): In fünf Schritten von den festen Kosten über eine einzelne Show bis zum Monatsergebnis.
- **Regler** (`/de/regler`): Acht Hauptregler, dahinter ein Expertenmodus mit allen Zahlen und der Saison pro Monat.
- **Vorlagen**: Unsere Planung, Gutes Jahr, Schwacher Winter, Ohne Förderung, Davon leben.
- **Aufgaben**: Davon leben können, Sicherheitsarbeiten stemmen, Ohne Förderung, Schwacher Winter. Jede startet in einer schwierigen Lage, hat eine Regel und ein Ziel, der Status rechnet live mit.
- **Wirkung pro Schritt**: Unter jedem Hauptregler steht, was ein Schritt mehr im Monat bringt oder kostet. Oben steht der Unterschied zur Planung.
- **Was muss passieren?**: Wie viele Gäste, Shows, Kursteilnehmende oder welcher Ticketpreis allein reichen würden.
- **Speichern** im Browser, **Teilen** per Link, **Herunterladen** als Tabelle (.csv) oder Bericht (.txt).
- Deutsch und Englisch, heller und dunkler Modus.

Es gibt keine Datenbank. Die ganze App liegt hinter einer Anmeldung über [Clerk](https://clerk.com), nur `/de/anmelden` und `/en/anmelden` sind offen. Registrieren kann man sich in der App nicht; neue Leute lädst du im Clerk-Dashboard ein.

## Die Grundwerte

Das Repo ist öffentlich. Die echten Zahlen stehen deshalb **nicht im Code**, sondern in der Umgebungsvariable `PEPE_DOME_WERTE` als JSON in einer Zeile.

- Lokal: in `.env` (wird nicht committet).
- Online: in Vercel unter *Settings → Environment Variables*. Danach neu deployen.
- Fehlt die Variable, zeigt die App Beispielwerte aus `src/lib/inputs.ts` und weist oben darauf hin.

Es reicht, die Felder anzugeben, die vom Beispiel abweichen. Den kompletten aktuellen Stand gibt dieser Befehl aus, fertig zum Kopieren:

```bash
npm run werte:vorlage
```

Welche Felder es gibt, steht im Typ `Inputs` in `src/lib/model.ts`. `startMonth` legt fest, in welchem Monat das Planungsjahr beginnt (1 bis 12, Standard 3 = März). Die Saison sind drei Listen mit je zwölf Einträgen, beginnend mit dem Startmonat:

- `activity`: Betrieb in Prozent
- `winterMonths`: Wintermonate, also geheizt und Café nur an Showtagen
- `monthPlan`: fest geplante Monate, z. B. `{"shows":3,"guests":25,"rentals":1}`; ein leeres Objekt `{}` rechnet mit dem Durchschnitt

Den Kontostand kannst du getrennt in `PEPE_DOME_KONTOSTAND` setzen (eine Zahl, z. B. `12345` oder `12.345,67`). Sie ersetzt `startingCash` und lässt sich so pflegen, ohne das große JSON anzufassen.

**Wichtig:** Die Variable hält die Zahlen aus dem öffentlichen Repo heraus. Wer angemeldet ist, sieht die Startwerte an den Reglern.

## Anmeldung (Clerk)

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` und `CLERK_SECRET_KEY` lokal in `.env` und in Vercel setzen.
- Ohne Schlüssel läuft Clerk lokal im Entwicklungsmodus mit temporären Schlüsseln.
- Live-Schlüssel (`pk_live_...`) gelten nur für die Domain, für die die Clerk-Instanz angelegt wurde.
- Im Clerk-Dashboard unter Restrictions den Modus **Waitlist** wählen. Neue Leute fragen über `/de/zugang` an, freigeschaltet wird im Clerk-Dashboard unter Waitlist.

## Rechenregeln

- Alle Beträge sind netto, ohne Mehrwertsteuer.
- Planungsjahr: zwölf Monate ab `startMonth`, ein Monat hat 52 / 12 Wochen.
- Die Saison skaliert Shows, Kurse, Workshops, Vermietungen und das Café. Feste Kosten bleiben gleich.
- Wintermonate: Es wird geheizt, und das Café hat nur an Showtagen offen. In den übrigen Monaten kommt der Café-Gewinn an normalen Tagen dazu.
- Dauermieter (feste Monatsmieten und Mietstunden pro Woche) laufen das ganze Jahr, auch in Pausenmonaten.
- Kontostand am Anfang = Kontostand + einmalige Zuschüsse + Kredit − Anschaffungen.
- Personal = Personen im Kernteam × Gehalt pro Person + Teilzeit und Minijobs. Beim Kredit wird im ersten Jahr nur Zins gezahlt.

Die ganze Rechnung steckt in `src/lib/model.ts` und ist mit `npm test` abgedeckt.

## Entwicklung

```bash
npm install
```

```bash
npm run dev
```

Prüfen vor dem Commit:

```bash
npm run typecheck && npm run lint && npm test
```

## Aufbau

```
src/
├── app/[locale]/page.tsx         Rundgang
├── app/[locale]/regler/page.tsx  Regler
├── components/                   Oberfläche
├── i18n/locales/{de,en}.json     Alle Texte
└── lib/
    ├── model.ts                  Rechenkern
    ├── inputs.ts                 Beispielwerte und Prüfung
    ├── base-inputs.ts            Liest PEPE_DOME_WERTE (nur Server)
    ├── fields.ts                 Regler, Gruppen, Hauptregler
    ├── presets.ts                Vorlagen
    ├── share.ts / storage.ts     Link und Browser-Speicher
    └── export.ts                 CSV und Bericht
```
