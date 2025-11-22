# Financial Scenario - Dokumentation

## Übersicht

Die zentrale Datenstruktur `FinancialScenario` verwaltet alle Input-Werte (Regler) und berechneten Kennzahlen für die Finanzkalkulator-App.

## Struktur

### FinancialScenario
```typescript
{
  id: string                    // UUID
  name: string                  // Name der Konfiguration
  createdAt: string             // ISO 8601 Datum
  updatedAt: string             // ISO 8601 Datum
  inputs: FinancialInputs       // Alle Regler-Werte
  metrics: FinancialMetrics     // Alle berechneten Kennzahlen
}
```

### FinancialInputs
Enthält alle Input-Werte:
- **Einnahmen**: `profitraining`, `ticketPrice`, `ticketsPerWeek`, `course1PricePerParticipant`, etc.
- **Kosten**: `rent`, `salaries`, `marketing`, `technology`, `heatingCosts`, etc.

### FinancialMetrics
Enthält alle berechneten Werte:
- `baseWeeklyRevenue`, `baseWeeklyCosts`
- `totalRevenue`, `totalCosts`, `totalProfit`, `profitMargin`
- `historicalRevenue`, `projectedRevenue`, etc.

## Verwendung

### In einer React-Komponente

```tsx
import { useFinancialScenario } from '@/hooks/useFinancialScenario'

function MyComponent() {
  const {
    scenario,
    inputs,
    metrics,
    updateInput,
    updateInputs,
  } = useFinancialScenario('Mein Szenario')

  // Einzelnen Wert aktualisieren
  updateInput('rent', 2000)

  // Mehrere Werte auf einmal aktualisieren
  updateInputs({
    rent: 2000,
    salaries: 1800,
    ticketPrice: 20
  })

  // Metrics werden automatisch neu berechnet
  console.log(metrics.totalProfit)
}
```

## Speichern und Laden

### localStorage

```tsx
import {
  saveScenarioToLocalStorage,
  loadScenarioFromLocalStorage,
  loadAllScenariosFromLocalStorage,
} from '@/utils/scenario-storage'

// Speichern
saveScenarioToLocalStorage(scenario)

// Laden
const loaded = loadScenarioFromLocalStorage(scenario.id)

// Alle laden
const allScenarios = loadAllScenariosFromLocalStorage()
```

### Export/Import als JSON

```tsx
import {
  exportScenarioAsJSON,
  importScenarioFromJSON,
  downloadScenarioAsFile,
} from '@/utils/scenario-storage'

// Export
const json = exportScenarioAsJSON(scenario)
downloadScenarioAsFile(scenario, 'mein-szenario')

// Import
const imported = importScenarioFromJSON(jsonString)
```

## Berechnungen

Alle Berechnungen werden zentral in `calculateMetrics()` durchgeführt. Diese Funktion:
- Wird automatisch aufgerufen, wenn sich Inputs ändern
- Berücksichtigt `weekMultipliers` für saisonale Anpassungen
- Berechnet historische vs. prognostizierte Werte basierend auf `currentWeek`

## Erweiterung

Um neue Input-Felder hinzuzufügen:

1. Erweitere `FinancialInputs` in `financial-scenario.ts`
2. Aktualisiere `DEFAULT_FINANCIAL_INPUTS`
3. Erweitere `calculateMetrics()` um die neuen Berechnungen
4. Aktualisiere die UI-Komponenten

