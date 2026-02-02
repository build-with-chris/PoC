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
  fundingPerMonth: number // Querfinanzierung durch Förderung (monatlich)
  
  // Mitgliedsbeiträge
  membershipCount: number // Anzahl Mitglieder
  membershipFeePerYear: number // Beitrag pro Jahr pro Mitglied

  // Tickets
  ticketPrice: number
  ticketsPerWeek: number
  gastronomyProfitPerTicket: number // Gastronomischer Gewinn pro Ticket (z.B. 3€)
  dailyGastronomyRevenue: number // Tägliche Gastronomie-Einnahmen (z.B. 200€)
  
  // Shows/Events
  showsPerWeek: number // Anzahl Shows/Events pro Woche
  gemaFeePerShow: number // GEMA Gebühren pro Show (z.B. 50€)
  kvrFeePerShow: number // KVR Anmeldung pro Show (z.B. 50€)
  artistFeePerShow: number // Künstlergagen pro Show (z.B. 600€)

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
  
  // Kosten (jährlich)
  taxAdvisorCosts: number // Steuerberater (pro Jahr)
  taxReturnCosts: number // Jahresabschluss/Steuererklärung (pro Jahr)
  accountingCosts: number // Finanzbuchhaltung (pro Jahr)
  payrollAccountingCosts: number // Lohnbuchhaltung (pro Jahr)
  
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
  baseWeeklyRevenue: number // Netto (nach MwSt.)
  baseWeeklyRevenueBrutto: number // Brutto (inkl. MwSt.)
  baseWeeklyCosts: number

  // Jahreswerte
  totalRevenue: number // Netto (nach MwSt.)
  totalRevenueBrutto: number // Brutto (inkl. MwSt.)
  totalCosts: number
  totalProfit: number // Gewinn/Verlust (Netto)
  totalProfitBrutto: number // Gewinn/Verlust (Brutto)
  profitMargin: number // Gewinnmarge in %

  // Historisch vs. Prognose
  historicalRevenue: number
  historicalCosts: number
  projectedRevenue: number
  projectedCosts: number
  projectedProfit: number

  // Detaillierte Einnahmen (pro Woche)
  fixedIncomePerWeek: number
  fundingRevenuePerWeek: number // Querfinanzierung durch Förderung pro Woche
  membershipRevenuePerWeek: number // Mitgliedsbeiträge pro Woche
  ticketRevenuePerWeek: number
  gastronomyRevenuePerWeek: number // Gastronomischer Gewinn pro Woche
  course1RevenuePerWeek: number
  course2RevenuePerWeek: number
  course3RevenuePerWeek: number
  workshopRevenuePerWeek: number
  rentalRevenuePerWeek: number

  // Detaillierte Kosten (pro Woche)
  monthlyCostsPerWeek: number
  showFeesPerWeek: number // GEMA + KVR Gebühren pro Woche
  weeklyReserves: number
  
  // Detaillierte Kosten (jährlich)
  annualAccountingCosts: number // Steuerberater + Buchhaltung (pro Jahr)

  // Mehrwertsteuer
  totalVAT: number // Gesamte Umsatzsteuer (USt) pro Jahr
  weeklyVAT: number // Umsatzsteuer (USt) pro Woche
  totalInputVAT: number // Gesamte Vorsteuer (VSt) pro Jahr
  weeklyInputVAT: number // Vorsteuer (VSt) pro Woche
  netVATPayable: number // Zu zahlende MwSt. (USt - VSt, kann negativ sein = Erstattung)
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
  fundingPerMonth: 2000, // Querfinanzierung durch Förderung
  membershipCount: 0, // Anzahl Mitglieder
  membershipFeePerYear: 0, // Beitrag pro Jahr pro Mitglied

  ticketPrice: 15,
  ticketsPerWeek: 60,
  gastronomyProfitPerTicket: 3, // Gastronomischer Gewinn pro Ticket
  dailyGastronomyRevenue: 200, // Tägliche Gastronomie-Einnahmen
  showsPerWeek: 1, // Anzahl Shows/Events pro Woche
  gemaFeePerShow: 50, // GEMA Gebühren pro Show
  kvrFeePerShow: 50, // KVR Anmeldung pro Show
  artistFeePerShow: 600, // Künstlergagen pro Show

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
  salaries: 12257.05, // Monatliche Personalkosten (fix)
  marketing: 300,
  technology: 200,
  heatingCosts: 3500,
  otherCosts: 300,
  
  // Kosten (jährlich)
  taxAdvisorCosts: 700, // Steuerberater (pro Jahr)
  taxReturnCosts: 2000, // Jahresabschluss/Steuererklärung (pro Jahr)
  accountingCosts: 1200, // Finanzbuchhaltung (pro Jahr)
  payrollAccountingCosts: 400, // Lohnbuchhaltung (pro Jahr)
  
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
    fundingPerMonth: 0,
    membershipCount: 0,
    membershipFeePerYear: 0,
    ticketPrice: 0,
    ticketsPerWeek: 0,
    gastronomyProfitPerTicket: 0,
    dailyGastronomyRevenue: 0,
    showsPerWeek: 0,
    gemaFeePerShow: 0,
    kvrFeePerShow: 0,
    artistFeePerShow: 0,
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
    taxAdvisorCosts: 0,
    taxReturnCosts: 0,
    accountingCosts: 0,
    payrollAccountingCosts: 0,
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
  weekMultipliers?: number[],
  costMultipliers?: number[]
): FinancialMetrics {
  return calculateMetrics(inputs, currentWeek, weekMultipliers, costMultipliers)
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
  weekMultipliers?: number[],
  costMultipliers?: number[]
): FinancialMetrics {
  // ============================================================================
  // EINNAHMEN-BERECHNUNG (NETTO)
  // ============================================================================
  // Alle Einnahmen werden als Netto-Werte eingegeben, dann mit MwSt. berechnet
  
  // Wöchentliche Basis-Einnahmen (Netto)
  const fixedIncomePerWeek = inputs.profitraining / 4.33 // 0% MwSt.
  
  // Querfinanzierung durch Förderung (monatlich → wöchentlich)
  const fundingRevenuePerWeek = inputs.fundingPerMonth / 4.33 // 0% MwSt.
  
  // Mitgliedsbeiträge (jährlich → wöchentlich)
  const membershipRevenuePerWeek = (inputs.membershipCount * inputs.membershipFeePerYear) / 52 // 0% MwSt.
  
  // Ticket-Einnahmen: Ticketpreis × Anzahl Tickets pro Woche
  const ticketRevenuePerWeek = inputs.ticketPrice * inputs.ticketsPerWeek // 0% MwSt.
  
  // Gastronomischer Gewinn: Gewinn pro Ticket × Anzahl Tickets pro Woche
  // 14% MwSt. (durchschnittlich)
  const GASTRO_VAT_RATE = 0.14
  const gastronomyRevenueNetPerWeek = inputs.gastronomyProfitPerTicket * inputs.ticketsPerWeek
  const gastronomyRevenueBruttoPerWeek = gastronomyRevenueNetPerWeek * (1 + GASTRO_VAT_RATE)
  const gastronomyVATPerWeek = gastronomyRevenueBruttoPerWeek - gastronomyRevenueNetPerWeek
  const gastronomyRevenuePerWeek = gastronomyRevenueNetPerWeek // Für Rückwärtskompatibilität

  // Tägliche Gastronomie-Einnahmen: Täglich × 7 Tage pro Woche
  // 14% MwSt. (durchschnittlich)
  const dailyGastronomyRevenueNetPerWeek = inputs.dailyGastronomyRevenue * 7
  const dailyGastronomyRevenueBruttoPerWeek = dailyGastronomyRevenueNetPerWeek * (1 + GASTRO_VAT_RATE)
  const dailyGastronomyVATPerWeek = dailyGastronomyRevenueBruttoPerWeek - dailyGastronomyRevenueNetPerWeek
  const dailyGastronomyRevenuePerWeek = dailyGastronomyRevenueNetPerWeek

  // Kurs-Einnahmen: (Preis pro Teilnehmer × Teilnehmer - Trainerkosten) × Anzahl Kurse pro Woche
  // 0% MwSt.
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
  // 7% MwSt.
  const WORKSHOP_VAT_RATE = 0.07
  const workshopRevenueNetPerWeek =
    (inputs.workshopProfitPerParticipant * inputs.workshopParticipants * inputs.workshopsPerMonth) / 4.33
  const workshopRevenueBruttoPerWeek = workshopRevenueNetPerWeek * (1 + WORKSHOP_VAT_RATE)
  const workshopVATPerWeek = workshopRevenueBruttoPerWeek - workshopRevenueNetPerWeek
  const workshopRevenuePerWeek = workshopRevenueNetPerWeek // Für Rückwärtskompatibilität
  
  // Vermietung: 19% MwSt.
  const RENTAL_VAT_RATE = 0.19
  const rentalRevenueNetPerWeek = inputs.rentalsPerWeek * inputs.rentalPrice
  const rentalRevenueBruttoPerWeek = rentalRevenueNetPerWeek * (1 + RENTAL_VAT_RATE)
  const rentalVATPerWeek = rentalRevenueBruttoPerWeek - rentalRevenueNetPerWeek
  const rentalRevenuePerWeek = rentalRevenueNetPerWeek // Für Rückwärtskompatibilität

  // Gesamte wöchentliche Netto-Einnahmen
  const baseWeeklyRevenue =
    fixedIncomePerWeek + // 0%
    fundingRevenuePerWeek + // 0%
    membershipRevenuePerWeek + // 0%
    ticketRevenuePerWeek + // 0%
    gastronomyRevenueNetPerWeek + // 14% (Netto)
    course1RevenuePerWeek + // 0%
    course2RevenuePerWeek + // 0%
    course3RevenuePerWeek + // 0%
    workshopRevenueNetPerWeek + // 7% (Netto)
    rentalRevenueNetPerWeek // 19% (Netto)

  // Gesamte wöchentliche Brutto-Einnahmen
  const baseWeeklyRevenueBrutto =
    fixedIncomePerWeek + // 0%
    fundingRevenuePerWeek + // 0%
    membershipRevenuePerWeek + // 0%
    ticketRevenuePerWeek + // 0%
    gastronomyRevenueBruttoPerWeek + // 14% (Brutto)
    course1RevenuePerWeek + // 0%
    course2RevenuePerWeek + // 0%
    course3RevenuePerWeek + // 0%
    workshopRevenueBruttoPerWeek + // 7% (Brutto)
    rentalRevenueBruttoPerWeek // 19% (Brutto)

  // ============================================================================
  // UMSATZSTEUER-BERECHNUNG (USt) - auf Einnahmen
  // ============================================================================
  // Berechne USt. für jede Einnahmenquelle separat
  const weeklyVAT = gastronomyVATPerWeek + workshopVATPerWeek + rentalVATPerWeek

  // ============================================================================
  // KOSTEN-BERECHNUNG
  // ============================================================================
  // Wöchentliche Basis-Kosten (monatliche Kosten / 4.33 Wochen)
  // Alle Kosten werden als Brutto-Werte eingegeben (inkl. 19% MwSt.)
  const INPUT_VAT_RATE = 0.19 // 19% Vorsteuer auf Kosten
  
  // Kosten mit 19% MwSt. (Marketing, Treibstoff, etc.)
  const marketingBruttoPerWeek = inputs.marketing / 4.33
  const heatingCostsBruttoPerWeek = inputs.heatingCosts / 4.33
  const otherCostsBruttoPerWeek = inputs.otherCosts / 4.33
  const technologyBruttoPerWeek = inputs.technology / 4.33
  
  // Kosten ohne MwSt. (Miete, Gehälter)
  const rentPerWeek = inputs.rent / 4.33 // 0% MwSt.
  const salariesPerWeek = inputs.salaries / 4.33 // 0% MwSt.
  
  // Vorsteuer (VSt) auf Kosten mit MwSt.
  const marketingVATPerWeek = marketingBruttoPerWeek * INPUT_VAT_RATE / (1 + INPUT_VAT_RATE)
  const heatingVATPerWeek = heatingCostsBruttoPerWeek * INPUT_VAT_RATE / (1 + INPUT_VAT_RATE)
  const otherCostsVATPerWeek = otherCostsBruttoPerWeek * INPUT_VAT_RATE / (1 + INPUT_VAT_RATE)
  const technologyVATPerWeek = technologyBruttoPerWeek * INPUT_VAT_RATE / (1 + INPUT_VAT_RATE)
  
  // Netto-Kosten (nach Vorsteuer)
  const marketingNetPerWeek = marketingBruttoPerWeek - marketingVATPerWeek
  const heatingCostsNetPerWeek = heatingCostsBruttoPerWeek - heatingVATPerWeek
  const otherCostsNetPerWeek = otherCostsBruttoPerWeek - otherCostsVATPerWeek
  const technologyNetPerWeek = technologyBruttoPerWeek - technologyVATPerWeek
  
  // Monatliche Kosten pro Woche (Netto)
  const monthlyCostsPerWeek =
    rentPerWeek +
    salariesPerWeek +
    marketingNetPerWeek +
    technologyNetPerWeek +
    heatingCostsNetPerWeek +
    otherCostsNetPerWeek

  // Show-Gebühren pro Woche (GEMA + KVR + Künstlergagen)
  // GEMA & KVR: 19% MwSt., Künstlergagen: 0%
  const gemaKvrBruttoPerWeek = (inputs.gemaFeePerShow + inputs.kvrFeePerShow) * inputs.showsPerWeek
  const gemaKvrVATPerWeek = gemaKvrBruttoPerWeek * INPUT_VAT_RATE / (1 + INPUT_VAT_RATE)
  const gemaKvrNetPerWeek = gemaKvrBruttoPerWeek - gemaKvrVATPerWeek
  const artistFeePerWeek = inputs.artistFeePerShow * inputs.showsPerWeek // 0% MwSt.
  const showFeesPerWeek = gemaKvrNetPerWeek + artistFeePerWeek

  // Wöchentliche Rücklagen für unerwartete Ausgaben (0% MwSt.)
  const weeklyReserves = inputs.weeklyReserves

  // Gesamte wöchentliche Kosten (Netto, nach Vorsteuer)
  const baseWeeklyCosts = monthlyCostsPerWeek + weeklyReserves + showFeesPerWeek
  
  // Vorsteuer (VSt) pro Woche
  const weeklyInputVAT = marketingVATPerWeek + heatingVATPerWeek + otherCostsVATPerWeek + technologyVATPerWeek + gemaKvrVATPerWeek

  // Jährliche Kosten (Steuerberater, Buchhaltung)
  const annualAccountingCosts = 
    inputs.taxAdvisorCosts + 
    inputs.taxReturnCosts + 
    inputs.accountingCosts + 
    inputs.payrollAccountingCosts

  // ============================================================================
  // JAHRESWERTE-BERECHNUNG
  // ============================================================================
  // Wenn weekMultipliers vorhanden, verwende diese für genauere Berechnung
  let totalRevenueBrutto: number
  let totalRevenue: number // Netto (nach MwSt.)
  let totalVAT: number
  let totalCosts: number

  // Verwende costMultipliers falls vorhanden, sonst weekMultipliers
  const effectiveCostMultipliers = costMultipliers && costMultipliers.length === 52 
    ? costMultipliers 
    : weekMultipliers

  let totalInputVAT: number // Vorsteuer (VSt) pro Jahr
  
  if (weekMultipliers && weekMultipliers.length === 52) {
    // Berechne mit Multiplikatoren
    const baseWeeklyRevenueBruttoWithMultipliers = weekMultipliers.reduce(
      (sum, multiplier) => sum + baseWeeklyRevenueBrutto * multiplier,
      0
    )
    totalRevenueBrutto = baseWeeklyRevenueBruttoWithMultipliers
    
    // Netto-Einnahmen mit Multiplikatoren
    const baseWeeklyRevenueWithMultipliers = weekMultipliers.reduce(
      (sum, multiplier) => sum + baseWeeklyRevenue * multiplier,
      0
    )
    totalRevenue = baseWeeklyRevenueWithMultipliers
    
    // Umsatzsteuer (USt) mit Multiplikatoren
    const baseWeeklyVATWithMultipliers = weekMultipliers.reduce(
      (sum, multiplier) => sum + weeklyVAT * multiplier,
      0
    )
    totalVAT = baseWeeklyVATWithMultipliers
    
    // Kosten: Basis-Kosten für alle Wochen (inkl. Rücklagen)
    // Verwende separate costMultipliers falls vorhanden
    if (effectiveCostMultipliers && effectiveCostMultipliers.length === 52) {
      totalCosts = effectiveCostMultipliers.reduce((sum, multiplier) => sum + baseWeeklyCosts * multiplier, 0)
      totalInputVAT = effectiveCostMultipliers.reduce((sum, multiplier) => sum + weeklyInputVAT * multiplier, 0)
    } else {
      totalCosts = weekMultipliers.reduce((sum, multiplier) => sum + baseWeeklyCosts * multiplier, 0)
      totalInputVAT = weekMultipliers.reduce((sum, multiplier) => sum + weeklyInputVAT * multiplier, 0)
    }
    // Füge jährliche Kosten hinzu (ohne MwSt., da Dienstleistungen)
    totalCosts += annualAccountingCosts
  } else {
    // Einfache Berechnung ohne Multiplikatoren
    totalRevenueBrutto = baseWeeklyRevenueBrutto * 52
    totalRevenue = baseWeeklyRevenue * 52 // Netto
    totalVAT = weeklyVAT * 52 // Umsatzsteuer (USt) pro Jahr
    totalCosts = baseWeeklyCosts * 52 + annualAccountingCosts
    totalInputVAT = weeklyInputVAT * 52 // Vorsteuer (VSt) pro Jahr
  }
  
  // Zu zahlende MwSt. = USt - VSt (kann negativ sein = Erstattung)
  const netVATPayable = totalVAT - totalInputVAT

  const totalProfit = totalRevenue - totalCosts
  const totalProfitBrutto = totalRevenueBrutto - totalCosts
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

    // Historische Einnahmen (bereits Netto, da baseWeeklyRevenue bereits korrekt berechnet wurde)
    historicalRevenue = historicalWeeks.reduce(
      (sum, multiplier) => sum + baseWeeklyRevenue * multiplier,
      0
    )
    
    // Prognostizierte Einnahmen (bereits Netto)
    projectedRevenue = projectedWeeks.reduce(
      (sum, multiplier) => sum + baseWeeklyRevenue * multiplier,
      0
    )

    // Kosten (inkl. Rücklagen und Show-Gebühren)
    // Verwende separate costMultipliers falls vorhanden
    const historicalCostMultipliers = effectiveCostMultipliers && effectiveCostMultipliers.length === 52
      ? effectiveCostMultipliers.slice(0, currentWeek - 1)
      : historicalWeeks
    const projectedCostMultipliers = effectiveCostMultipliers && effectiveCostMultipliers.length === 52
      ? effectiveCostMultipliers.slice(currentWeek - 1)
      : projectedWeeks
    
    historicalCosts = historicalCostMultipliers.reduce((sum, multiplier) => sum + baseWeeklyCosts * multiplier, 0)
    projectedCosts = projectedCostMultipliers.reduce((sum, multiplier) => sum + baseWeeklyCosts * multiplier, 0)
    
    // Jährliche Kosten werden anteilig auf historische und prognostizierte Wochen verteilt
    const historicalWeeksCount = currentWeek - 1
    const projectedWeeksCount = 52 - historicalWeeksCount
    const historicalAnnualCosts = (annualAccountingCosts * historicalWeeksCount) / 52
    const projectedAnnualCosts = (annualAccountingCosts * projectedWeeksCount) / 52
    
    historicalCosts += historicalAnnualCosts
    projectedCosts += projectedAnnualCosts
  }

  const projectedProfit = projectedRevenue - projectedCosts

  return {
    baseWeeklyRevenue,
    baseWeeklyRevenueBrutto,
    baseWeeklyCosts,
    totalRevenue,
    totalRevenueBrutto,
    totalCosts,
    totalProfit,
    totalProfitBrutto,
    profitMargin,
    historicalRevenue,
    historicalCosts,
    projectedRevenue,
    projectedCosts,
    projectedProfit,
    fixedIncomePerWeek,
    fundingRevenuePerWeek,
    membershipRevenuePerWeek,
    ticketRevenuePerWeek,
    gastronomyRevenuePerWeek,
    dailyGastronomyRevenuePerWeek,
    course1RevenuePerWeek,
    course2RevenuePerWeek,
    course3RevenuePerWeek,
    workshopRevenuePerWeek,
    rentalRevenuePerWeek,
    monthlyCostsPerWeek,
    showFeesPerWeek,
    weeklyReserves,
    annualAccountingCosts,
    totalVAT, // Umsatzsteuer (USt)
    weeklyVAT, // Umsatzsteuer (USt) pro Woche
    totalInputVAT, // Vorsteuer (VSt)
    weeklyInputVAT, // Vorsteuer (VSt) pro Woche
    netVATPayable, // Zu zahlende MwSt. (USt - VSt)
    netRevenue: totalRevenue, // Alias für Klarheit
    netProfit,
    netProfitMargin,
  }
}

/**
 * Migriert ein altes Szenario auf die aktuelle Struktur
 * 
 * Füllt fehlende Felder mit Standardwerten, damit alte gespeicherte Szenarien
 * weiterhin funktionieren, auch wenn neue Felder hinzugefügt wurden.
 * 
 * @param scenario - Das zu migrierende Szenario
 * @returns Migriertes Szenario mit allen erforderlichen Feldern
 */
export function migrateScenario(scenario: FinancialScenario): FinancialScenario {
  // Merge Inputs mit Standardwerten, um fehlende Felder zu füllen
  const migratedInputs: FinancialInputs = {
    ...DEFAULT_FINANCIAL_INPUTS,
    ...scenario.inputs,
  }
  
  // Berechne Metrics neu mit migrierten Inputs
  const migratedMetrics = calculateMetrics(migratedInputs)
  
  return {
    ...scenario,
    inputs: migratedInputs,
    metrics: migratedMetrics,
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

