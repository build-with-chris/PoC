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
 * - Ticketpreis: 15 €
 * - Tickets pro Woche: 60
 * - Kurs 1 - Preis pro Teilnehmer: 20 €
 * - Kurs 1 - Teilnehmer: 12
 * - Kurs 1 - Pro Woche: 2
 * - Kurs 1 - Trainerkosten: 50 €
 * ...
 * 
 * KOSTEN:
 * - Miete: 0 €/Monat
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
  report += `- Miete: ${formatCurrency(inputs.rent)}/Monat\n`
  report += `- Gehälter: ${formatCurrency(inputs.salaries)}/Monat\n`
  report += `- Marketing: ${formatCurrency(inputs.marketing)}/Monat\n`
  report += `- Technik: ${formatCurrency(inputs.technology)}/Monat\n`
  report += `- Heizkosten: ${formatCurrency(inputs.heatingCosts)}/Monat\n`
  report += `- Sonstige Kosten: ${formatCurrency(inputs.otherCosts)}/Monat\n`
  report += `- Wöchentliche Rücklagen: ${formatCurrency(inputs.weeklyReserves)}/Woche\n\n`
  
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
  report += `- Ticket-Einnahmen: ${formatCurrency(metrics.ticketRevenuePerWeek)}\n`
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

