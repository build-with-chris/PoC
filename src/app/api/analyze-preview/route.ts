import { NextResponse } from 'next/server'

type AnalysisRequest = {
  totalRevenue: number
  totalCosts: number
  totalMargin: number
  projectedRevenue: number
  projectedCosts: number
  currentWeek: number
  baseWeeklyRevenue: number
  baseWeeklyCosts: number
  weakWeeks: number
  strongWeeks: number
}

export async function POST(request: Request) {
  try {
    const data: AnalysisRequest = await request.json()

    // Validiere die Daten
    if (
      typeof data.totalRevenue !== 'number' ||
      typeof data.totalCosts !== 'number' ||
      typeof data.totalMargin !== 'number' ||
      typeof data.currentWeek !== 'number' ||
      typeof data.baseWeeklyRevenue !== 'number' ||
      typeof data.baseWeeklyCosts !== 'number'
    ) {
      console.error('Ungültige Daten:', data)
      return NextResponse.json(
        { error: 'Ungültige Daten übermittelt' },
        { status: 400 }
      )
    }

    // Einfache regelbasierte Analyse
    const analysis = generateAnalysis(data)

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Fehler bei der Analyse:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Analyse', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

function generateAnalysis(data: AnalysisRequest): string {
  const {
    totalRevenue,
    totalCosts,
    totalMargin,
    projectedRevenue,
    projectedCosts,
    currentWeek,
    baseWeeklyRevenue,
    baseWeeklyCosts,
    weakWeeks,
    strongWeeks,
  } = data

  const remainingWeeks = 52 - currentWeek
  const weeklyMargin = baseWeeklyRevenue - baseWeeklyCosts
  const isProfit = totalMargin >= 0
  const projectedMargin = projectedRevenue - projectedCosts

  let analysis = ''

  // Hauptübersicht
  if (isProfit) {
    analysis += `🎉 **Positive Jahresprognose!** Basierend auf den aktuellen Einstellungen wird ein Jahresgewinn von **${totalMargin.toFixed(0)} €** erwartet. `
  } else {
    analysis += `⚠️ **Achtung: Negatives Jahresergebnis!** Die Prognose zeigt einen Verlust von **${Math.abs(totalMargin).toFixed(0)} €**. `
  }

  // Aktuelle Situation
  analysis += `\n\nWir befinden uns in Kalenderwoche ${currentWeek} von 52. `

  // Wöchentliche Analyse
  if (weeklyMargin > 0) {
    analysis += `Bei den aktuellen Parametern erwirtschaftest du durchschnittlich **${weeklyMargin.toFixed(2)} € Gewinn pro Woche**. `
  } else {
    analysis += `Bei den aktuellen Parametern entsteht ein wöchentlicher Verlust von **${Math.abs(weeklyMargin).toFixed(2)} €**. `
  }

  // Verbleibende Wochen
  if (remainingWeeks > 0) {
    if (projectedMargin >= 0) {
      analysis += `\n\nFür die verbleibenden ${remainingWeeks} Wochen sind **${projectedRevenue.toFixed(0)} € Einnahmen** und **${projectedCosts.toFixed(0)} € Kosten** prognostiziert, was zu einem positiven Ergebnis von **${projectedMargin.toFixed(0)} €** führt. `
    } else {
      analysis += `\n\nFür die verbleibenden ${remainingWeeks} Wochen werden **${projectedRevenue.toFixed(0)} € Einnahmen** bei **${projectedCosts.toFixed(0)} € Kosten** erwartet, was ein Defizit von **${Math.abs(projectedMargin).toFixed(0)} €** bedeutet. `
    }
  }

  // Schwache/Starke Wochen
  if (weakWeeks > 0 || strongWeeks > 0) {
    analysis += `\n\n📅 **Saisonale Anpassungen:** `
    if (weakWeeks > 0) {
      analysis += `${weakWeeks} schwache ${weakWeeks === 1 ? 'Woche' : 'Wochen'} eingeplant. `
    }
    if (strongWeeks > 0) {
      analysis += `${strongWeeks} starke ${strongWeeks === 1 ? 'Woche' : 'Wochen'} eingeplant. `
    }
  }

  // Empfehlungen
  analysis += `\n\n💡 **Empfehlungen:**\n`

  if (weeklyMargin < 0) {
    const neededReduction = Math.abs(weeklyMargin) * 4.33 // Monatlich
    const neededIncrease = Math.abs(weeklyMargin)
    analysis += `- Um die Gewinnschwelle zu erreichen, solltest du entweder die monatlichen Kosten um ca. **${neededReduction.toFixed(0)} €** senken oder die wöchentlichen Einnahmen um ca. **${neededIncrease.toFixed(0)} €** steigern.\n`
  }

  if (totalRevenue > 0) {
    const costPercentage = (totalCosts / totalRevenue) * 100
    if (costPercentage > 80) {
      analysis += `- Deine Kostenquote liegt bei **${costPercentage.toFixed(1)}%** der Einnahmen. Versuche, diese unter 70% zu senken für gesündere Margen.\n`
    } else if (costPercentage < 50) {
      analysis += `- Ausgezeichnet! Deine Kostenquote von **${costPercentage.toFixed(1)}%** ist sehr gesund.\n`
    }
  }

  if (baseWeeklyRevenue < 1000) {
    analysis += `- Mit aktuell **${baseWeeklyRevenue.toFixed(0)} € wöchentlichen Einnahmen** gibt es noch viel Wachstumspotential. Überlege, weitere Einnahmequellen zu erschließen.\n`
  }

  if (weakWeeks === 0 && remainingWeeks > 20) {
    analysis += `- Du hast keine schwachen Wochen eingeplant. Bedenke saisonale Schwankungen wie Ferien oder Feiertage für realistischere Prognosen.\n`
  }

  return analysis.trim()
}
