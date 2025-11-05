import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type MonthlyData = {
  month: string // YYYY-MM
  revenue: number
  costs: number
  margin: number
}

type ForecastScenario = {
  revenue: number
  costs: number
  margin: number
}

type ForecastResponse = {
  historical: MonthlyData[]
  forecast: {
    base: ForecastScenario
    optimistic: ForecastScenario
    pessimistic: ForecastScenario
  }
  trends: {
    revenueSlope: number
    costsSlope: number
  }
}

// Lineare Regression für Trend-Berechnung
function calculateLinearTrend(values: number[]): { slope: number; intercept: number } {
  const n = values.length
  if (n === 0) return { slope: 0, intercept: 0 }

  // x-Werte sind einfach 0, 1, 2, ... n-1
  const xValues = Array.from({ length: n }, (_, i) => i)
  const yValues = values

  // Durchschnittswerte
  const xMean = xValues.reduce((sum, x) => sum + x, 0) / n
  const yMean = yValues.reduce((sum, y) => sum + y, 0) / n

  // Steigung berechnen: slope = Σ((x - x̄)(y - ȳ)) / Σ((x - x̄)²)
  let numerator = 0
  let denominator = 0

  for (let i = 0; i < n; i++) {
    const xDiff = xValues[i] - xMean
    const yDiff = yValues[i] - yMean
    numerator += xDiff * yDiff
    denominator += xDiff * xDiff
  }

  const slope = denominator !== 0 ? numerator / denominator : 0
  const intercept = yMean - slope * xMean

  return { slope, intercept }
}

export async function GET() {
  try {
    // Zeitraum: Letzte 12 Monate
    const now = new Date()
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1)

    // Alle Transaktionen der letzten 12 Monate laden
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: twelveMonthsAgo,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Nach Monaten aggregieren
    const monthlyMap = new Map<string, { revenue: number; costs: number }>()

    for (const transaction of transactions) {
      const date = new Date(transaction.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { revenue: 0, costs: 0 })
      }

      const monthData = monthlyMap.get(monthKey)!
      const amount = Number(transaction.amount)

      if (transaction.category.type === 'income') {
        monthData.revenue += amount
      } else {
        monthData.costs += amount
      }
    }

    // In Array konvertieren und sortieren
    const historical: MonthlyData[] = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        costs: data.costs,
        margin: data.revenue - data.costs,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // Wenn keine Daten vorhanden, Nullen zurückgeben
    if (historical.length === 0) {
      return NextResponse.json({
        historical: [],
        forecast: {
          base: { revenue: 0, costs: 0, margin: 0 },
          optimistic: { revenue: 0, costs: 0, margin: 0 },
          pessimistic: { revenue: 0, costs: 0, margin: 0 },
        },
        trends: {
          revenueSlope: 0,
          costsSlope: 0,
        },
      })
    }

    // Trend-Berechnung
    const revenueValues = historical.map((m) => m.revenue)
    const costsValues = historical.map((m) => m.costs)

    const revenueTrend = calculateLinearTrend(revenueValues)
    const costsTrend = calculateLinearTrend(costsValues)

    // Nächster Monat prognostizieren (x = n)
    const nextMonthIndex = historical.length
    const baseRevenue = revenueTrend.intercept + revenueTrend.slope * nextMonthIndex
    const baseCosts = costsTrend.intercept + costsTrend.slope * nextMonthIndex

    // Szenarien berechnen
    const forecast: ForecastResponse['forecast'] = {
      base: {
        revenue: Math.max(0, baseRevenue),
        costs: Math.max(0, baseCosts),
        margin: baseRevenue - baseCosts,
      },
      optimistic: {
        revenue: Math.max(0, baseRevenue * 1.1), // +10%
        costs: Math.max(0, baseCosts * 0.98), // -2%
        margin: baseRevenue * 1.1 - baseCosts * 0.98,
      },
      pessimistic: {
        revenue: Math.max(0, baseRevenue * 0.9), // -10%
        costs: Math.max(0, baseCosts * 1.02), // +2%
        margin: baseRevenue * 0.9 - baseCosts * 1.02,
      },
    }

    const response: ForecastResponse = {
      historical,
      forecast,
      trends: {
        revenueSlope: revenueTrend.slope,
        costsSlope: costsTrend.slope,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Forecast-Fehler:', error)
    return NextResponse.json(
      {
        error: 'Fehler beim Erstellen der Prognose',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler',
      },
      { status: 500 }
    )
  }
}
