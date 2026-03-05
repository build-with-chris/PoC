/**
 * ============================================================================
 * REPORT-EXPORT UTILITIES
 * ============================================================================
 * 
 * Diese Funktionen generieren einen menschenlesbaren Text-Report aus einem
 * FinancialScenario und starten den Download als .txt Datei.
 * 
 * Datenfluss:
 *   1. exportScenarioReport() wird mit einem FinancialScenario aufgerufen
 *   2. generateReportText() erzeugt den Report-Text aus inputs und metrics
 *   3. Blob API erstellt eine Datei aus dem Text
 *   4. Temporärer <a>-Tag startet den Download
 *   5. Cleanup: URL.revokeObjectURL() und Element-Entfernung
 * 
 * Report-Struktur:
 *   - Titel und Metadaten (Name, Datum)
 *   - Eingaben (alle Regler-Werte)
 *   - Kennzahlen (berechnete Werte)
 *   - Interpretation (automatische Bewertung)
 * 
 * Dateiname: finanz-analyse-{scenario-name}-{YYYY-MM-DD}.txt
 * 
 * Beispielauszug des generierten Reports:
 * 
 * ========================================
 * FINANZ-ANALYSE: Standard Szenario
 * ========================================
 * 
 * Erstellt am: 2024-01-15 14:30:00
 * Zuletzt geändert: 2024-01-15 16:45:00
 * 
 * ========================================
 * EINGABEN
 * ========================================
 * 
 * EINNAHMEN:
 * - Profitraining: 700 €/Monat
  report += `- Querfinanzierung durch Förderung: ${formatCurrency(inputs.fundingPerMonth)}/Monat\n`
  report += `- Mitgliedsbeiträge: ${inputs.membershipCount} Mitglieder × ${formatCurrency(inputs.membershipFeePerYear)}/Jahr = ${formatCurrency(inputs.membershipCount * inputs.membershipFeePerYear)}/Jahr\n`
 * - Ticketpreis: 15 €
 * - Tickets pro Woche: 60
 * - Kurs 1 - Preis pro Teilnehmer: 20 €
 * - Kurs 1 - Teilnehmer: 12
 * - Kurs 1 - Pro Woche: 2
 * - Kurs 1 - Trainerkosten: 50 €
 * ...
 * 
 * KOSTEN:
 * - Versicherung: 0 €/Monat
 * - Gehälter: 1500 €/Monat
 * - Marketing: 300 €/Monat
 * - Technik: 200 €/Monat
 * - Heizkosten: 3500 €/Monat
 * - Heizanlage-Miete: 5500 € (einmalig pro Saison)
 * - Sonstige Kosten: 300 €/Monat
 * 
 * ========================================
 * KENNZAHLEN
 * ========================================
 * 
 * Wöchentliche Basiswerte:
 * - Basis-Einnahmen pro Woche: 1,234.56 €
 * - Basis-Kosten pro Woche: 987.65 €
 * 
 * Jahreswerte:
 * - Gesamt-Einnahmen: 64,197.12 €
 * - Gesamt-Kosten: 51,357.80 €
 * - Gewinn/Verlust: 12,839.32 €
 * - Gewinnmarge: 20.0%
 * 
 * ========================================
 * INTERPRETATION
 * ========================================
 * 
 * ✅ Das Szenario zeigt ein positives Jahresergebnis von 12,839.32 €.
 * Die Gewinnmarge von 20.0% ist gesund und deutet auf eine solide Rentabilität hin.
 * 
 * ========================================
 */

import { FinancialScenario } from '@/types/financial-scenario'

/**
 * Formatiert eine Zahl als Währung
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formatiert ein Datum
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Erzeugt einen menschenlesbaren Report aus einem FinancialScenario
 * 
 * @param scenario - Das zu exportierende Szenario
 * @returns Der Report als String
 */
function generateReportText(scenario: FinancialScenario): string {
  const { inputs, metrics, name, createdAt, updatedAt } = scenario

  let report = ''
  
  // Titel
  report += '='.repeat(50) + '\n'
  report += `FINANZ-ANALYSE: ${name}\n`
  report += '='.repeat(50) + '\n\n'
  
  // Metadaten
  report += `Erstellt am: ${formatDate(createdAt)}\n`
  report += `Zuletzt geändert: ${formatDate(updatedAt)}\n\n`
  
  // Eingaben
  report += '='.repeat(50) + '\n'
  report += 'EINGABEN\n'
  report += '='.repeat(50) + '\n\n'
  
  report += 'EINNAHMEN:\n'
  report += `- Profitraining: ${formatCurrency(inputs.profitraining)}/Monat\n`
  report += `- Querfinanzierung durch Förderung: ${formatCurrency(inputs.fundingPerMonth)}/Monat\n`
  report += `- Mitgliedsbeiträge: ${inputs.membershipCount} Mitglieder × ${formatCurrency(inputs.membershipFeePerYear)}/Jahr = ${formatCurrency(inputs.membershipCount * inputs.membershipFeePerYear)}/Jahr\n`
  report += `- Ticketpreis: ${formatCurrency(inputs.ticketPrice)}\n`
  report += `- Tickets pro Woche: ${inputs.ticketsPerWeek}\n`
  report += `- Kurs 1 - Preis pro Teilnehmer: ${formatCurrency(inputs.course1PricePerParticipant)}\n`
  report += `- Kurs 1 - Teilnehmer: ${inputs.course1Participants}\n`
  report += `- Kurs 1 - Pro Woche: ${inputs.course1PerWeek}\n`
  report += `- Kurs 1 - Trainerkosten: ${formatCurrency(inputs.course1TrainerCosts)}\n`
  report += `- Kurs 2 - Preis pro Teilnehmer: ${formatCurrency(inputs.course2PricePerParticipant)}\n`
  report += `- Kurs 2 - Teilnehmer: ${inputs.course2Participants}\n`
  report += `- Kurs 2 - Pro Woche: ${inputs.course2PerWeek}\n`
  report += `- Kurs 2 - Trainerkosten: ${formatCurrency(inputs.course2TrainerCosts)}\n`
  report += `- Kurs 3 - Preis pro Teilnehmer: ${formatCurrency(inputs.course3PricePerParticipant)}\n`
  report += `- Kurs 3 - Teilnehmer: ${inputs.course3Participants}\n`
  report += `- Kurs 3 - Pro Woche: ${inputs.course3PerWeek}\n`
  report += `- Kurs 3 - Trainerkosten: ${formatCurrency(inputs.course3TrainerCosts)}\n`
  report += `- Workshop - Gewinn pro Teilnehmer: ${formatCurrency(inputs.workshopProfitPerParticipant)}\n`
  report += `- Workshop - Teilnehmer: ${inputs.workshopParticipants}\n`
  report += `- Workshops pro Monat: ${inputs.workshopsPerMonth}\n`
  report += `- Vermietungen pro Woche: ${inputs.rentalsPerWeek}\n`
  report += `- Mietpreis: ${formatCurrency(inputs.rentalPrice)}\n\n`
  
  report += 'KOSTEN:\n'
  report += `- Versicherung: ${formatCurrency(inputs.rent)}/Monat\n`
  report += `- Gehälter: ${formatCurrency(inputs.salaries)}/Monat\n`
  report += `- Marketing: ${formatCurrency(inputs.marketing)}/Monat\n`
  report += `- Technik: ${formatCurrency(inputs.technology)}/Monat\n`
  report += `- Heizkosten: ${formatCurrency(inputs.heatingCosts)}/Monat\n`
  report += `- Sonstige Kosten: ${formatCurrency(inputs.otherCosts)}/Monat\n`
  report += `- Wöchentliche Rücklagen: ${formatCurrency(inputs.weeklyReserves)}/Woche\n`
  report += `\nJährliche Kosten:\n`
  report += `- Steuerberater: ${formatCurrency(inputs.taxAdvisorCosts)}/Jahr\n`
  report += `- Jahresabschluss/Steuererklärung: ${formatCurrency(inputs.taxReturnCosts)}/Jahr\n`
  report += `- Finanzbuchhaltung: ${formatCurrency(inputs.accountingCosts)}/Jahr\n`
  report += `- Lohnbuchhaltung: ${formatCurrency(inputs.payrollAccountingCosts)}/Jahr\n`
  report += `- Gesamt jährliche Buchhaltungskosten: ${formatCurrency(metrics.annualAccountingCosts)}/Jahr\n\n`

  
  // Kennzahlen
  report += '='.repeat(50) + '\n'
  report += 'KENNZAHLEN\n'
  report += '='.repeat(50) + '\n\n'
  
  report += 'Wöchentliche Basiswerte:\n'
  report += `- Basis-Einnahmen pro Woche (Netto, nach MwSt.): ${formatCurrency(metrics.baseWeeklyRevenue)}\n`
  report += `- Basis-Kosten pro Woche: ${formatCurrency(metrics.baseWeeklyCosts)}\n`
  report += `- MwSt. pro Woche (19%): ${formatCurrency(metrics.weeklyVAT)}\n\n`
  
  report += 'Detaillierte Einnahmen (pro Woche, Netto nach MwSt.):\n'
  report += `- Fixeinnahmen: ${formatCurrency(metrics.fixedIncomePerWeek)}\n`
  report += `- Querfinanzierung durch Förderung: ${formatCurrency(metrics.fundingRevenuePerWeek)}\n`
  report += `- Mitgliedsbeiträge: ${formatCurrency(metrics.membershipRevenuePerWeek)}\n`
  report += `- Ticket-Einnahmen: ${formatCurrency(metrics.ticketRevenuePerWeek)}\n`
  report += `- Gastronomie-Einnahmen (pro Ticket): ${formatCurrency(metrics.gastronomyRevenuePerWeek)} (14% MwSt.)\n`
  report += `- Tägliche Gastronomie-Einnahmen: ${formatCurrency(metrics.dailyGastronomyRevenuePerWeek)} (14% MwSt.)\n`
  report += `- Kurs 1 Einnahmen: ${formatCurrency(metrics.course1RevenuePerWeek)}\n`
  report += `- Kurs 2 Einnahmen: ${formatCurrency(metrics.course2RevenuePerWeek)}\n`
  report += `- Kurs 3 Einnahmen: ${formatCurrency(metrics.course3RevenuePerWeek)}\n`
  report += `- Workshop-Einnahmen: ${formatCurrency(metrics.workshopRevenuePerWeek)}\n`
  report += `- Vermietungs-Einnahmen: ${formatCurrency(metrics.rentalRevenuePerWeek)}\n\n`
  
  report += 'Detaillierte Kosten (pro Woche):\n'
  report += `- Monatliche Kosten (pro Woche): ${formatCurrency(metrics.monthlyCostsPerWeek)}\n`
  report += `- Wöchentliche Rücklagen: ${formatCurrency(metrics.weeklyReserves)}\n\n`
  
  report += 'Jahreswerte:\n'
  report += `- Gesamt-Einnahmen (Brutto): ${formatCurrency(metrics.totalRevenue + metrics.totalVAT)}\n`
  report += `- Mehrwertsteuer (19%): ${formatCurrency(metrics.totalVAT)}\n`
  report += `- Gesamt-Einnahmen (Netto): ${formatCurrency(metrics.totalRevenue)}\n`
  report += `- Gesamt-Kosten: ${formatCurrency(metrics.totalCosts)}\n`
  report += `- Gewinn/Verlust (Netto): ${formatCurrency(metrics.totalProfit)}\n`
  report += `- Gewinnmarge (Netto): ${metrics.profitMargin.toFixed(2)}%\n\n`
  
  // Kreditfinanzierung
  if (inputs.loanAmount > 0) {
    report += 'Kreditfinanzierung:\n'
    report += `- Kreditbetrag: ${formatCurrency(inputs.loanAmount)}\n`
    report += `- Zinskosten pro Jahr: ${formatCurrency(metrics.loanInterestPerYear)}\n`
    report += `- Tilgungskosten pro Jahr: ${formatCurrency(metrics.loanRepaymentPerYear)} (${inputs.loanAmount === 100000 ? '5 Jahre' : '10 Jahre'} Tilgungsplan, tilgungsfreies erstes Jahr)\n`
    report += `- Gesamtkosten Kredit pro Jahr: ${formatCurrency(metrics.loanTotalCostsPerYear)}\n\n`
  }
  
  // Liquidität
  report += 'LIQUIDITÄT:\n'
  report += `- Initiale Ausgaben: ${formatCurrency(inputs.initialExpenses)}\n`
  report += `- Liquiditätspuffer: ${formatCurrency(inputs.liquidityBuffer)}\n`
  report += `- Startliquidität: ${formatCurrency(metrics.initialLiquidity)} (Kredit: ${formatCurrency(inputs.loanAmount)} - Initiale Ausgaben: ${formatCurrency(inputs.initialExpenses)})\n`
  report += `- Liquidität am Jahresende: ${formatCurrency(metrics.endOfYearLiquidity)}\n`
  report += `- Minimale Liquidität: ${formatCurrency(metrics.minLiquidity)}\n`
  if (metrics.liquidityBelowBuffer) {
    report += `- ⚠️ WARNUNG: Liquidität fällt unter den Puffer von ${formatCurrency(inputs.liquidityBuffer)}!\n`
  } else {
    report += `- ✅ Liquidität bleibt über dem Puffer von ${formatCurrency(inputs.liquidityBuffer)}\n`
  }
  report += '\n'
  
  if (metrics.historicalRevenue > 0 || metrics.projectedRevenue > 0) {
    report += 'Zeitraum-Analyse:\n'
    report += `- Historische Einnahmen: ${formatCurrency(metrics.historicalRevenue)}\n`
    report += `- Historische Kosten: ${formatCurrency(metrics.historicalCosts)}\n`
    report += `- Prognostizierte Einnahmen: ${formatCurrency(metrics.projectedRevenue)}\n`
    report += `- Prognostizierte Kosten: ${formatCurrency(metrics.projectedCosts)}\n`
    report += `- Prognostizierter Gewinn: ${formatCurrency(metrics.projectedProfit)}\n\n`
  }
  
  // Interpretation
  report += '='.repeat(50) + '\n'
  report += 'INTERPRETATION\n'
  report += '='.repeat(50) + '\n\n'
  
  if (metrics.totalProfit < 0) {
    const loss = Math.abs(metrics.totalProfit)
    report += `⚠️ Das Szenario zeigt ein negatives Jahresergebnis von ${formatCurrency(loss)}.\n`
    report += `Die Kosten (${formatCurrency(metrics.totalCosts)}) übersteigen die Einnahmen (${formatCurrency(metrics.totalRevenue)}).\n\n`
    report += 'Empfehlungen:\n'
    report += '- Überprüfe die Kostenstruktur und identifiziere Einsparpotenziale\n'
    report += '- Erhöhe die Einnahmen durch zusätzliche Angebote oder Preisanpassungen\n'
    report += '- Prüfe, ob alle Kosten realistisch sind\n'
  } else if (metrics.profitMargin < 10) {
    report += `✅ Das Szenario zeigt ein positives Jahresergebnis von ${formatCurrency(metrics.totalProfit)}.\n`
    report += `Die Gewinnmarge von ${metrics.profitMargin.toFixed(2)}% ist jedoch relativ niedrig.\n\n`
    report += 'Empfehlungen:\n'
    report += '- Erhöhe die Einnahmen oder reduziere die Kosten für eine bessere Marge\n'
    report += '- Überprüfe die Preisgestaltung für Kurse und Workshops\n'
  } else if (metrics.profitMargin < 20) {
    report += `✅ Das Szenario zeigt ein positives Jahresergebnis von ${formatCurrency(metrics.totalProfit)}.\n`
    report += `Die Gewinnmarge von ${metrics.profitMargin.toFixed(2)}% ist gesund und deutet auf eine solide Rentabilität hin.\n\n`
    report += 'Das Szenario ist finanziell tragfähig.\n'
  } else {
    report += `🎉 Ausgezeichnet! Das Szenario zeigt ein sehr positives Jahresergebnis von ${formatCurrency(metrics.totalProfit)}.\n`
    report += `Die Gewinnmarge von ${metrics.profitMargin.toFixed(2)}% ist sehr gut und deutet auf eine hohe Rentabilität hin.\n\n`
    report += 'Das Szenario ist finanziell sehr stark aufgestellt.\n'
  }
  
  report += '\n' + '='.repeat(50) + '\n'
  report += `Report generiert am: ${formatDate(new Date().toISOString())}\n`
  report += '='.repeat(50) + '\n'
  
  return report
}
/**
 * Erzeugt einen detaillierten Report mit zeitlicher Komponente (wöchentliche Daten)
 * 
 * @param scenario - Das zu exportierende Szenario
 * @param weekMultipliers - Multiplikatoren für Einnahmen pro Woche (52 Wochen)
 * @param costMultipliers - Multiplikatoren für Ausgaben pro Woche (52 Wochen)
 * @param currentWeek - Aktuelle Kalenderwoche
 * @returns Der detaillierte Report als String
 */
function generateDetailedReportText(
  scenario: FinancialScenario,
  weekMultipliers: number[],
  costMultipliers: number[],
  currentWeek: number
): string {
  const { inputs, metrics, name, createdAt, updatedAt } = scenario

  let report = ''
  
  // Titel
  report += '='.repeat(50) + '\n'
  report += `DETAILLIERTE FINANZ-ANALYSE: ${name}\n`
  report += '='.repeat(50) + '\n\n'
  
  // Metadaten
  report += `Erstellt am: ${formatDate(createdAt)}\n`
  report += `Zuletzt geändert: ${formatDate(updatedAt)}\n`
  report += `Aktuelle Kalenderwoche: ${currentWeek}\n\n`
  
  // Standard-Report einfügen
  report += generateReportText(scenario)
  
  // Zeitliche Komponente
  report += '\n' + '='.repeat(50) + '\n'
  report += 'WÖCHENTLICHE DETAILLANALYSE\n'
  report += '='.repeat(50) + '\n\n'
  
  report += 'Diese Analyse zeigt die prognostizierten Werte für jede Woche des Jahres.\n'
  report += 'Multiplikatoren: 0% = ausgeschlossen, 50% = schwach, 100% = normal, 120% = stark\n\n'
  
  // Tabellenkopf
  report += 'KW'.padEnd(5)
  report += 'Status'.padEnd(12)
  report += 'Einn.-Mult.'.padEnd(12)
  report += 'Ausg.-Mult.'.padEnd(12)
  report += 'Einnahmen'.padEnd(15)
  report += 'Ausgaben'.padEnd(15)
  report += 'Gewinn/Verlust'.padEnd(18)
  report += 'Liquidität'.padEnd(15)
  report += '\n'
  report += '-'.repeat(115) + '\n'
  
  // Berechne Liquidität pro Woche
  let currentLiquidity = metrics.initialLiquidity
  
  // Wöchentliche Anteile für jährliche Kosten
  const annualCostsPerWeek = metrics.annualAccountingCosts / 52
  const loanCostsPerWeek = metrics.loanTotalCostsPerYear / 52
  
  // Wöchentliche Daten
  for (let i = 0; i < 52; i++) {
    const weekNum = i + 1
    const isHistorical = weekNum < currentWeek
    const revenueMultiplier = weekMultipliers[i] ?? 1.0
    const costMultiplier = costMultipliers[i] ?? 1.0
    
    // Verwende Brutto-Einnahmen (da in UI alles als Brutto angezeigt wird)
    const weekRevenue = (metrics.baseWeeklyRevenueBrutto ?? 0) * revenueMultiplier
    
    // Wöchentliche Kosten: Basis-Kosten × Multiplikator + jährliche Kosten + Kreditkosten
    // Jährliche Kosten und Kreditkosten werden gleichmäßig über alle Wochen verteilt
    const weekCosts = (metrics.baseWeeklyCosts ?? 0) * costMultiplier + annualCostsPerWeek + loanCostsPerWeek
    
    // Gewinn/Verlust: Brutto-Einnahmen - Brutto-Kosten
    // Aber: Wir müssen die Vorsteuer berücksichtigen, die von den Kosten abgezogen werden kann
    // Für die Liquidität: Netto-Gewinn = Brutto-Einnahmen - Brutto-Kosten + Vorsteuer
    const weekInputVAT = (metrics.weeklyInputVAT ?? 0) * costMultiplier
    const weekVAT = (metrics.weeklyVAT ?? 0) * revenueMultiplier
    
    // Netto-Gewinn für Liquiditätsberechnung: Brutto-Einnahmen - Brutto-Kosten + Vorsteuer - Umsatzsteuer
    // Oder einfacher: Netto-Einnahmen - Netto-Kosten
    const weekRevenueNet = (metrics.baseWeeklyRevenue ?? 0) * revenueMultiplier
    const weekCostsNet = (metrics.baseWeeklyCosts ?? 0) * costMultiplier + annualCostsPerWeek + loanCostsPerWeek
    const weekProfit = weekRevenueNet - weekCostsNet
    
    // Aktualisiere Liquidität für diese Woche
    currentLiquidity += weekProfit
    
    // Status
    let status = ''
    if (isHistorical) {
      status = 'Vergangenheit'
    } else if (revenueMultiplier === 0 && costMultiplier === 0) {
      status = 'Ausgeschlossen'
    } else if (revenueMultiplier === 0) {
      status = 'Keine Einn.'
    } else if (costMultiplier === 0) {
      status = 'Keine Ausg.'
    } else if (revenueMultiplier === 1.0 && costMultiplier === 1.0) {
      status = 'Normal'
    } else if (revenueMultiplier < 1.0 || costMultiplier < 1.0) {
      status = 'Schwach'
    } else if (revenueMultiplier > 1.0 || costMultiplier > 1.0) {
      status = 'Stark'
    } else {
      status = 'Angepasst'
    }
    
    // Multiplikator-Formatierung
    const revenueMultStr = revenueMultiplier === 0 
      ? '0%' 
      : revenueMultiplier === 0.5 
        ? '50%' 
        : revenueMultiplier === 1.0 
          ? '100%' 
          : revenueMultiplier === 1.2 
            ? '120%' 
            : `${(revenueMultiplier * 100).toFixed(1)}%`
    
    const costMultStr = costMultiplier === 0 
      ? '0%' 
      : costMultiplier === 0.5 
        ? '50%' 
        : costMultiplier === 1.0 
          ? '100%' 
          : costMultiplier === 1.2 
            ? '120%' 
            : `${(costMultiplier * 100).toFixed(1)}%`
    
    // Liquiditäts-Warnung
    const liquidityWarning = currentLiquidity < inputs.liquidityBuffer ? ' ⚠️' : ''
    
    // Zeile - zeige Brutto-Werte (wie in UI)
    report += `KW ${weekNum.toString().padStart(2)}`.padEnd(5)
    report += status.padEnd(12)
    report += revenueMultStr.padEnd(12)
    report += costMultStr.padEnd(12)
    report += formatCurrency(weekRevenue).padEnd(15) // Brutto-Einnahmen
    report += formatCurrency(weekCosts).padEnd(15) // Brutto-Kosten (inkl. jährliche + Kredit)
    report += formatCurrency(weekProfit).padEnd(18) // Netto-Gewinn/Verlust
    report += formatCurrency(currentLiquidity).padEnd(15)
    report += liquidityWarning
    report += '\n'
  }
  
  report += '\n' + '='.repeat(50) + '\n'
  report += 'ZUSAMMENFASSUNG DER WÖCHENTLICHEN DATEN\n'
  report += '='.repeat(50) + '\n\n'
  
  // Statistiken
  const totalWeeks = 52
  const historicalWeeks = currentWeek - 1
  const projectedWeeksCount = 52 - historicalWeeks
  const excludedWeeks = weekMultipliers.filter(m => m === 0).length
  const weakWeeks = weekMultipliers.filter(m => m > 0 && m < 1.0).length
  const normalWeeks = weekMultipliers.filter(m => m === 1.0).length
  const strongWeeks = weekMultipliers.filter(m => m > 1.0).length
  
  report += `Gesamtanzahl Wochen: ${totalWeeks}\n`
  report += `Historische Wochen: ${historicalWeeks}\n`
  report += `Prognostizierte Wochen: ${projectedWeeksCount}\n\n`
  
  report += 'Einnahmen-Multiplikatoren:\n'
  report += `- Ausgeschlossen (0%): ${excludedWeeks} Wochen\n`
  report += `- Schwach (<100%): ${weakWeeks} Wochen\n`
  report += `- Normal (100%): ${normalWeeks} Wochen\n`
  report += `- Stark (>100%): ${strongWeeks} Wochen\n\n`
  
  // Berechne Gesamtwerte aus wöchentlichen Daten (prognostiziert)
  let totalProjectedRevenueBrutto = 0
  let totalProjectedRevenueNet = 0
  let totalProjectedCosts = 0
  
  for (let i = currentWeek - 1; i < 52; i++) {
    const revenueMultiplier = weekMultipliers[i] ?? 1.0
    const costMultiplier = costMultipliers[i] ?? 1.0
    totalProjectedRevenueBrutto += (metrics.baseWeeklyRevenueBrutto ?? 0) * revenueMultiplier
    totalProjectedRevenueNet += (metrics.baseWeeklyRevenue ?? 0) * revenueMultiplier
    totalProjectedCosts += (metrics.baseWeeklyCosts ?? 0) * costMultiplier
  }
  
  // Füge jährliche Kosten und Kreditkosten hinzu (proportional zu prognostizierten Wochen)
  const projectedAnnualCosts = (metrics.annualAccountingCosts / 52) * projectedWeeksCount
  const projectedLoanCosts = (metrics.loanTotalCostsPerYear / 52) * projectedWeeksCount
  totalProjectedCosts += projectedAnnualCosts + projectedLoanCosts
  
  report += 'Prognostizierte Werte (ab KW ' + currentWeek + '):\n'
  report += `- Gesamt-Einnahmen (Brutto): ${formatCurrency(totalProjectedRevenueBrutto)}\n`
  report += `- Gesamt-Einnahmen (Netto): ${formatCurrency(totalProjectedRevenueNet)}\n`
  report += `- Gesamt-Ausgaben (Brutto): ${formatCurrency(totalProjectedCosts)}\n`
  report += `- Gesamt-Gewinn/Verlust (Netto): ${formatCurrency(totalProjectedRevenueNet - totalProjectedCosts)}\n\n`
  
  // Liquiditäts-Zusammenfassung
  report += 'LIQUIDITÄTS-VERLAUF:\n'
  report += `- Startliquidität (KW 1): ${formatCurrency(metrics.initialLiquidity)}\n`
  report += `- Liquidität am Jahresende (KW 52): ${formatCurrency(metrics.endOfYearLiquidity)}\n`
  report += `- Minimale Liquidität während des Jahres: ${formatCurrency(metrics.minLiquidity)}\n`
  report += `- Liquiditätspuffer: ${formatCurrency(inputs.liquidityBuffer)}\n`
  if (metrics.liquidityBelowBuffer) {
    report += `- ⚠️ WARNUNG: Die minimale Liquidität (${formatCurrency(metrics.minLiquidity)}) liegt unter dem Puffer (${formatCurrency(inputs.liquidityBuffer)})!\n`
    report += '  Es besteht die Gefahr von Liquiditätsengpässen.\n'
  } else {
    report += `- ✅ Die Liquidität bleibt über dem Puffer von ${formatCurrency(inputs.liquidityBuffer)}\n`
  }
  report += '\n'
  
  report += '='.repeat(50) + '\n'
  report += `Detaillierter Report generiert am: ${formatDate(new Date().toISOString())}\n`
  report += '='.repeat(50) + '\n'
  
  return report
}

/**
 * Exportiert ein FinancialScenario als menschenlesbaren Report und startet den Download
 * 
 * @param scenario - Das zu exportierende Szenario
 * @param format - Dateiformat ('txt' oder 'md'), Standard: 'txt'
 */
export function exportScenarioReport(
  scenario: FinancialScenario,
  format: 'txt' | 'md' = 'txt'
): void {
  try {
    // Generiere den Report-Text
    const reportText = generateReportText(scenario)
    
    // Bestimme den Dateinamen
    const date = new Date()
    const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
    const safeName = scenario.name
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()
      .substring(0, 50) // Max 50 Zeichen
    const filename = `finanz-analyse-${safeName}-${dateStr}.${format}`
    
    // Erstelle Blob
    const blob = new Blob([reportText], {
      type: format === 'md' ? 'text/markdown' : 'text/plain',
    })
    
    // Erstelle Download-Link
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    // Trigger Download
    document.body.appendChild(link)
    link.click()
    
    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Fehler beim Exportieren des Reports:', error)
    throw new Error('Fehler beim Erstellen des Reports. Bitte versuche es erneut.')
  }
}


/**
 * Exportiert ein FinancialScenario als detaillierten Report mit zeitlicher Komponente
 * 
 * @param scenario - Das zu exportierende Szenario
 * @param weekMultipliers - Multiplikatoren für Einnahmen pro Woche (52 Wochen)
 * @param costMultipliers - Multiplikatoren für Ausgaben pro Woche (52 Wochen)
 * @param currentWeek - Aktuelle Kalenderwoche
 * @param format - Dateiformat ('txt' oder 'md'), Standard: 'txt'
 */
export function exportDetailedScenarioReport(
  scenario: FinancialScenario,
  weekMultipliers: number[],
  costMultipliers: number[],
  currentWeek: number,
  format: 'txt' | 'md' = 'txt'
): void {
  try {
    // Generiere den detaillierten Report-Text
    const reportText = generateDetailedReportText(
      scenario,
      weekMultipliers,
      costMultipliers,
      currentWeek
    )
    
    // Bestimme den Dateinamen
    const date = new Date()
    const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
    const safeName = scenario.name
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()
      .substring(0, 50) // Max 50 Zeichen
    const filename = `finanz-analyse-detailliert-${safeName}-${dateStr}.${format}`
    
    // Erstelle Blob
    const blob = new Blob([reportText], {
      type: format === 'md' ? 'text/markdown' : 'text/plain',
    })
    
    // Erstelle Download-Link
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    // Trigger Download
    document.body.appendChild(link)
    link.click()
    
    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Fehler beim Exportieren des detaillierten Reports:', error)
    throw new Error('Fehler beim Erstellen des detaillierten Reports. Bitte versuche es erneut.')
  }
}
