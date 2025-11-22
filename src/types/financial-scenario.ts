/**
 * ============================================================================
 * FINANZ-SZENARIO TYPEN UND UTILITIES
 * ============================================================================
 * 
 * Diese Datei definiert die zentrale Datenstruktur für Finanz-Szenarien
 * und alle zugehörigen Berechnungsfunktionen.
 * 
 * Struktur:
 *   FinancialScenario
 *     ├── id: string (UUID)
 *     ├── name: string
 *     ├── createdAt: string (ISO 8601)
 *     ├── updatedAt: string (ISO 8601)
 *     ├── inputs: FinancialInputs (alle Regler-Werte)
 *     └── metrics: FinancialMetrics (alle berechneten Kennzahlen)
 * 
 * Berechnungslogik:
 *   - calculateMetrics() ist die zentrale Funktion für alle Berechnungen
 *   - Wird automatisch aufgerufen, wenn sich inputs ändern (via useFinancialScenario Hook)
 *   - Berücksichtigt weekMultipliers für saisonale Anpassungen
 *   - Berechnet historische vs. prognostizierte Werte basierend auf currentWeek
 * 
 * Erweiterbarkeit:
 *   - Neue Kosten/Einnahmen: Erweitere FinancialInputs Interface
 *   - Neue Kennzahlen: Erweitere FinancialMetrics Interface
 *   - Berechnungen: Anpassen von calculateMetrics()
 * 
 * ============================================================================
 */

/**
 * Alle Input-Werte für die Finanzberechnung
 * 
 * Diese Werte werden vom User über Regler/Slider eingegeben.
 * Konsistente Benennung: camelCase, englische Begriffe
 */
export interface FinancialInputs {
  // Fixeinnahmen
  profitraining: number // monatlich

  // Tickets
  ticketPrice: number
  ticketsPerWeek: number

  // Kurse (pro Teilnehmer)
  course1PricePerParticipant: number
  course1Participants: number
  course1PerWeek: number // Anzahl der Kurse pro Woche
  course1TrainerCosts: number // pro Kurs

  course2PricePerParticipant: number
  course2Participants: number
  course2PerWeek: number
  course2TrainerCosts: number

  course3PricePerParticipant: number
  course3Participants: number
  course3PerWeek: number
  course3TrainerCosts: number

  // Workshops (Gewinn pro Teilnehmer)
  workshopProfitPerParticipant: number
  workshopParticipants: number
  workshopsPerMonth: number

  // Vermietungen
  rentalsPerWeek: number
  rentalPrice: number

  // Kosten (monatlich)
  rent: number
  salaries: number
  marketing: number
  technology: number
  heatingCosts: number // Treibstoff pro Monat
  otherCosts: number
  
  // Rücklagen
  weeklyReserves: number // Wöchentliche Rücklagen für unerwartete Ausgaben
}

/**
 * Alle berechneten Kennzahlen
 * 
 * Diese Werte werden automatisch aus FinancialInputs berechnet.
 * Siehe: calculateMetrics() für die Berechnungslogik
 */
export interface FinancialMetrics {
  // Wöchentliche Basiswerte
  baseWeeklyRevenue: number
  baseWeeklyCosts: number

  // Jahreswerte
  totalRevenue: number
  totalCosts: number
  totalProfit: number // Gewinn/Verlust
  profitMargin: number // Gewinnmarge in %

  // Historisch vs. Prognose
  historicalRevenue: number
  historicalCosts: number
  projectedRevenue: number
  projectedCosts: number
  projectedProfit: number

  // Detaillierte Einnahmen (pro Woche)
  fixedIncomePerWeek: number
  ticketRevenuePerWeek: number
  course1RevenuePerWeek: number
  course2RevenuePerWeek: number
  course3RevenuePerWeek: number
  workshopRevenuePerWeek: number
  rentalRevenuePerWeek: number

  // Detaillierte Kosten (pro Woche)
  monthlyCostsPerWeek: number
  weeklyReserves: number

  // Mehrwertsteuer (19%)
  totalVAT: number // Gesamte MwSt. pro Jahr
  weeklyVAT: number // MwSt. pro Woche
  netRevenue: number // Netto-Umsatz (nach MwSt.)
  netProfit: number // Netto-Gewinn (nach MwSt.)
  netProfitMargin: number // Netto-Gewinnmarge in %
}

/**
 * Vollständige Finanzkonfiguration
 */
export interface FinancialScenario {
  id: string
  name: string
  createdAt: string // ISO 8601 Datum
  updatedAt: string // ISO 8601 Datum
  inputs: FinancialInputs
  metrics: FinancialMetrics
}

/**
 * Standard-Input-Werte für ein neues Szenario
 */
export const DEFAULT_FINANCIAL_INPUTS: FinancialInputs = {
  profitraining: 700,

  ticketPrice: 15,
  ticketsPerWeek: 60,

  course1PricePerParticipant: 20,
  course1Participants: 12,
  course1PerWeek: 2,
  course1TrainerCosts: 50,

  course2PricePerParticipant: 18,
  course2Participants: 8,
  course2PerWeek: 3,
  course2TrainerCosts: 40,

  course3PricePerParticipant: 25,
  course3Participants: 6,
  course3PerWeek: 1,
  course3TrainerCosts: 60,

  workshopProfitPerParticipant: 20,
  workshopParticipants: 15,
  workshopsPerMonth: 2,

  rentalsPerWeek: 3,
  rentalPrice: 250,

  rent: 0,
  salaries: 1500,
  marketing: 300,
  technology: 200,
  heatingCosts: 3500,
  otherCosts: 300,
  
  weeklyReserves: 0, // Wöchentliche Rücklagen für unerwartete Ausgaben
}

/**
 * Erstellt ein neues FinancialScenario mit Standard-Werten
 * 
 * @param name - Name des Szenarios
 * @param inputs - Optionale partielle Input-Werte (werden mit DEFAULT_FINANCIAL_INPUTS gemerged)
 * @returns Neues FinancialScenario mit berechneten Metrics
 */
export function createFinancialScenario(
  name: string,
  inputs?: Partial<FinancialInputs>
): FinancialScenario {
  const now = new Date().toISOString()
  const scenarioInputs: FinancialInputs = {
    ...DEFAULT_FINANCIAL_INPUTS,
    ...inputs,
  }

  return {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    inputs: scenarioInputs,
    metrics: calculateMetrics(scenarioInputs),
  }
}

/**
 * Erstellt ein leeres FinancialScenario (alle Werte auf 0)
 * 
 * Nützlich für die Initialisierung oder zum Zurücksetzen.
 * 
 * @param name - Name des Szenarios
 * @returns Neues FinancialScenario mit allen Inputs auf 0
 */
export function createEmptyScenario(name: string = 'Leeres Szenario'): FinancialScenario {
  const emptyInputs: FinancialInputs = {
    profitraining: 0,
    ticketPrice: 0,
    ticketsPerWeek: 0,
    course1PricePerParticipant: 0,
    course1Participants: 0,
    course1PerWeek: 0,
    course1TrainerCosts: 0,
    course2PricePerParticipant: 0,
    course2Participants: 0,
    course2PerWeek: 0,
    course2TrainerCosts: 0,
    course3PricePerParticipant: 0,
    course3Participants: 0,
    course3PerWeek: 0,
    course3TrainerCosts: 0,
    workshopProfitPerParticipant: 0,
    workshopParticipants: 0,
    workshopsPerMonth: 0,
    rentalsPerWeek: 0,
    rentalPrice: 0,
    rent: 0,
    salaries: 0,
    marketing: 0,
    technology: 0,
    heatingCosts: 0,
    otherCosts: 0,
    weeklyReserves: 0,
  }

  return createFinancialScenario(name, emptyInputs)
}

/**
 * Berechnet Metrics neu basierend auf Inputs
 * 
 * Diese Funktion ist ein Wrapper um calculateMetrics für bessere Developer Experience.
 * Sie kann verwendet werden, wenn Metrics manuell neu berechnet werden sollen,
 * z.B. nach dem Laden eines Szenarios oder bei Validierung.
 * 
 * @param inputs - Die Input-Werte
 * @param currentWeek - Optional: Aktuelle Kalenderwoche
 * @param weekMultipliers - Optional: Multiplikatoren für saisonale Anpassungen
 * @returns Neu berechnete Metrics
 */
export function recalculateMetrics(
  inputs: FinancialInputs,
  currentWeek?: number,
  weekMultipliers?: number[]
): FinancialMetrics {
  return calculateMetrics(inputs, currentWeek, weekMultipliers)
}

/**
 * Berechnet alle Kennzahlen aus den Input-Werten
 * 
 * Diese Funktion ist die zentrale Stelle für alle Berechnungen.
 * Sie wird automatisch aufgerufen, wenn sich die Inputs ändern.
 * 
 * @param inputs - Die Input-Werte für die Berechnung
 * @param currentWeek - Die aktuelle Kalenderwoche (optional, für historische vs. prognostizierte Werte)
 * @param weekMultipliers - Multiplikatoren für jede Woche (optional, für saisonale Anpassungen)
 * @returns Die berechneten Kennzahlen
 */
export function calculateMetrics(
  inputs: FinancialInputs,
  currentWeek?: number,
  weekMultipliers?: number[]
): FinancialMetrics {
  // ============================================================================
  // EINNAHMEN-BERECHNUNG (BRUTTO)
  // ============================================================================
  // Alle Einnahmen sind in Brutto angegeben (inkl. 19% MwSt.)
  
  // Wöchentliche Basis-Einnahmen (Brutto)
  const fixedIncomePerWeek = inputs.profitraining / 4.33
  const ticketRevenuePerWeek = inputs.ticketPrice * inputs.ticketsPerWeek

  // Kurs-Einnahmen: (Preis pro Teilnehmer × Teilnehmer - Trainerkosten) × Anzahl Kurse pro Woche
  const course1RevenuePerWeek =
    (inputs.course1PricePerParticipant * inputs.course1Participants - inputs.course1TrainerCosts) *
    inputs.course1PerWeek
  const course2RevenuePerWeek =
    (inputs.course2PricePerParticipant * inputs.course2Participants - inputs.course2TrainerCosts) *
    inputs.course2PerWeek
  const course3RevenuePerWeek =
    (inputs.course3PricePerParticipant * inputs.course3Participants - inputs.course3TrainerCosts) *
    inputs.course3PerWeek

  // Workshop-Gewinn: Gewinn pro Teilnehmer × Teilnehmer × Anzahl pro Monat / 4.33 Wochen
  const workshopRevenuePerWeek =
    (inputs.workshopProfitPerParticipant * inputs.workshopParticipants * inputs.workshopsPerMonth) / 4.33
  const rentalRevenuePerWeek = inputs.rentalsPerWeek * inputs.rentalPrice

  // Gesamte wöchentliche Brutto-Einnahmen
  const baseWeeklyRevenueBrutto =
    fixedIncomePerWeek +
    ticketRevenuePerWeek +
    course1RevenuePerWeek +
    course2RevenuePerWeek +
    course3RevenuePerWeek +
    workshopRevenuePerWeek +
    rentalRevenuePerWeek

  // ============================================================================
  // MEHRWERTSTEUER-BERECHNUNG (19%)
  // ============================================================================
  // MwSt. wird von Brutto-Einnahmen abgezogen
  const VAT_RATE = 0.19 // 19% Mehrwertsteuer
  const weeklyVAT = baseWeeklyRevenueBrutto * VAT_RATE
  const baseWeeklyRevenue = baseWeeklyRevenueBrutto - weeklyVAT // Netto-Einnahmen

  // ============================================================================
  // KOSTEN-BERECHNUNG
  // ============================================================================
  // Wöchentliche Basis-Kosten (monatliche Kosten / 4.33 Wochen)
  const monthlyCostsPerWeek =
    (inputs.rent +
      inputs.salaries +
      inputs.marketing +
      inputs.technology +
      inputs.heatingCosts +
      inputs.otherCosts) /
    4.33

  // Wöchentliche Rücklagen für unerwartete Ausgaben
  const weeklyReserves = inputs.weeklyReserves

  // Gesamte wöchentliche Kosten (inkl. Rücklagen)
  const baseWeeklyCosts = monthlyCostsPerWeek + weeklyReserves

  // ============================================================================
  // JAHRESWERTE-BERECHNUNG
  // ============================================================================
  // Wenn weekMultipliers vorhanden, verwende diese für genauere Berechnung
  let totalRevenueBrutto: number
  let totalRevenue: number // Netto (nach MwSt.)
  let totalVAT: number
  let totalCosts: number

  if (weekMultipliers && weekMultipliers.length === 52) {
    // Berechne mit Multiplikatoren
    const baseWeeklyRevenueBruttoWithMultipliers = weekMultipliers.reduce(
      (sum, multiplier) => sum + baseWeeklyRevenueBrutto * multiplier,
      0
    )
    totalRevenueBrutto = baseWeeklyRevenueBruttoWithMultipliers
    totalVAT = totalRevenueBrutto * VAT_RATE
    totalRevenue = totalRevenueBrutto - totalVAT // Netto
    
    // Kosten: Basis-Kosten für alle Wochen (inkl. Rücklagen)
    totalCosts = weekMultipliers.reduce((sum, multiplier) => sum + baseWeeklyCosts * multiplier, 0)
  } else {
    // Einfache Berechnung ohne Multiplikatoren
    totalRevenueBrutto = baseWeeklyRevenueBrutto * 52
    totalVAT = totalRevenueBrutto * VAT_RATE
    totalRevenue = totalRevenueBrutto - totalVAT // Netto
    totalCosts = baseWeeklyCosts * 52
  }

  const totalProfit = totalRevenue - totalCosts
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
  
  // Netto-Gewinn und Netto-Marge (bereits nach MwSt.)
  const netProfit = totalProfit // Bereits Netto, da totalRevenue bereits Netto ist
  const netProfitMargin = profitMargin // Bereits Netto-Marge

  // ============================================================================
  // HISTORISCH VS. PROGNOSE
  // ============================================================================
  // Berechnet historische und prognostizierte Werte (Netto, nach MwSt.)
  let historicalRevenue = 0
  let historicalCosts = 0
  let projectedRevenue = totalRevenue
  let projectedCosts = totalCosts

  if (currentWeek !== undefined && weekMultipliers && weekMultipliers.length === 52) {
    const historicalWeeks = weekMultipliers.slice(0, currentWeek - 1)
    const projectedWeeks = weekMultipliers.slice(currentWeek - 1)

    // Historische Einnahmen (Brutto → Netto)
    const historicalRevenueBrutto = historicalWeeks.reduce(
      (sum, multiplier) => sum + baseWeeklyRevenueBrutto * multiplier,
      0
    )
    historicalRevenue = historicalRevenueBrutto - (historicalRevenueBrutto * VAT_RATE) // Netto
    
    // Prognostizierte Einnahmen (Brutto → Netto)
    const projectedRevenueBrutto = projectedWeeks.reduce(
      (sum, multiplier) => sum + baseWeeklyRevenueBrutto * multiplier,
      0
    )
    projectedRevenue = projectedRevenueBrutto - (projectedRevenueBrutto * VAT_RATE) // Netto

    // Kosten (inkl. Rücklagen)
    historicalCosts = historicalWeeks.reduce((sum, multiplier) => sum + baseWeeklyCosts * multiplier, 0)
    projectedCosts = projectedWeeks.reduce((sum, multiplier) => sum + baseWeeklyCosts * multiplier, 0)
  }

  const projectedProfit = projectedRevenue - projectedCosts

  return {
    baseWeeklyRevenue,
    baseWeeklyCosts,
    totalRevenue,
    totalCosts,
    totalProfit,
    profitMargin,
    historicalRevenue,
    historicalCosts,
    projectedRevenue,
    projectedCosts,
    projectedProfit,
    fixedIncomePerWeek,
    ticketRevenuePerWeek,
    course1RevenuePerWeek,
    course2RevenuePerWeek,
    course3RevenuePerWeek,
    workshopRevenuePerWeek,
    rentalRevenuePerWeek,
    monthlyCostsPerWeek,
    weeklyReserves,
    totalVAT,
    weeklyVAT,
    netRevenue: totalRevenue, // Alias für Klarheit
    netProfit,
    netProfitMargin,
  }
}

/**
 * Aktualisiert die Metadaten eines Szenarios
 */
export function updateScenarioMetadata(
  scenario: FinancialScenario,
  updates: Partial<Pick<FinancialScenario, 'name' | 'inputs'>>
): FinancialScenario {
  const updatedInputs = updates.inputs ? { ...scenario.inputs, ...updates.inputs } : scenario.inputs
  const updatedMetrics = calculateMetrics(updatedInputs)

  return {
    ...scenario,
    name: updates.name ?? scenario.name,
    inputs: updatedInputs,
    metrics: updatedMetrics,
    updatedAt: new Date().toISOString(),
  }
}

