# Pepe Dome Finanzregler

Ein interaktiver Rechner für alle, die beim [Pepe Dome](https://pepe-dome.de/de) mitmachen wollen. Er zeigt ohne BWL-Vorwissen, was der Dome jeden Monat kostet, woher das Geld kommt und was passieren muss, damit er sich trägt.

## Was die App kann

- **Rundgang** (`/de`): In fünf Schritten von den festen Kosten über eine einzelne Show bis zum Monatsergebnis.
- **Regler** (`/de/regler`): Acht Hauptregler, dahinter ein Expertenmodus mit allen Zahlen und der Saison pro Monat.
- **Vorlagen**: Unsere Planung, Gutes Jahr, Schwacher Winter, Ohne Förderung, Startjahr.
- **Aufgaben**: Ohne Förderung, Schwacher Winter, Startjahr. Jede startet in einer schwierigen Lage, hat eine Regel und ein Ziel, der Status rechnet live mit.
- **Wirkung pro Schritt**: Unter jedem Hauptregler steht, was ein Schritt mehr im Monat bringt oder kostet. Oben steht der Unterschied zur Planung.
- **Was muss passieren?**: Wie viele Gäste, Shows, Kursteilnehmende oder welcher Ticketpreis allein reichen würden.
- **Speichern** im Browser, **Teilen** per Link, **Herunterladen** als Tabelle (.csv) oder Bericht (.txt).
- Deutsch und Englisch, heller und dunkler Modus.

Es gibt keine Datenbank und keine Anmeldung.

## Die Grundwerte

Das Repo ist öffentlich. Die echten Zahlen stehen deshalb **nicht im Code**, sondern in der Umgebungsvariable `PEPE_DOME_WERTE` als JSON in einer Zeile.

- Lokal: in `.env` (wird nicht committet).
- Online: in Vercel unter *Settings → Environment Variables*. Danach neu deployen.
- Fehlt die Variable, zeigt die App Beispielwerte aus `src/lib/inputs.ts` und weist oben darauf hin.

Es reicht, die Felder anzugeben, die vom Beispiel abweichen. Den kompletten aktuellen Stand gibt dieser Befehl aus, fertig zum Kopieren:

```bash
npm run werte:vorlage
```

Welche Felder es gibt, steht im Typ `Inputs` in `src/lib/model.ts`. Die Saison sind zwei Listen mit je zwölf Werten, beginnend mit März: `activity` (Betrieb in Prozent) und `winterMonths` (Wintermonate: geheizt, Café nur an Showtagen).

**Wichtig:** Die Variable hält die Zahlen aus dem öffentlichen Repo heraus. Wer die App öffnet, sieht die Startwerte trotzdem an den Reglern.

## Rechenregeln

- Alle Beträge sind netto, ohne Mehrwertsteuer.
- Planungsjahr März bis Februar, ein Monat hat 52 / 12 Wochen.
- Die Saison skaliert Shows, Kurse, Workshops, Vermietungen und das Café. Feste Kosten bleiben gleich.
- Wintermonate: Es wird geheizt, und das Café hat nur an Showtagen offen. In den übrigen Monaten kommt der Café-Gewinn an normalen Tagen dazu.
- Kontostand am Anfang = Kontostand + Kredit − Anschaffungen. Beim Kredit wird im ersten Jahr nur Zins gezahlt.

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
