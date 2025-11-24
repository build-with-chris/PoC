import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type WeeklyData = {
  week: number
  revenue: number
  costs: number
}

export async function GET() {
  try {
    // Hol alle Transaktionen des aktuellen Jahres
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    const transactions = await prisma.transactions.findMany({
      where: {
        date: {
          gte: startOfYear,
        },
      },
      include: {
        categories: true,
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Aggregiere nach Kalenderwochen
    const weeklyMap = new Map<number, { revenue: number; costs: number }>()

    for (const transaction of transactions) {
      const weekNumber = getWeekNumber(new Date(transaction.date))

      if (!weeklyMap.has(weekNumber)) {
        weeklyMap.set(weekNumber, { revenue: 0, costs: 0 })
      }

      const weekData = weeklyMap.get(weekNumber)!
      const amount = Number(transaction.amount)

      if (transaction.categories.type === 'income') {
        weekData.revenue += amount
      } else {
        weekData.costs += amount
      }
    }

    // In Array konvertieren
    const weeks: WeeklyData[] = Array.from(weeklyMap.entries())
      .map(([week, data]) => ({
        week,
        revenue: data.revenue,
        costs: data.costs,
      }))
      .sort((a, b) => a.week - b.week)

    return NextResponse.json({ weeks })
  } catch (error) {
    console.error('Fehler beim Laden der wöchentlichen Daten:', error)
    return NextResponse.json(
      {
        error: 'Fehler beim Laden der wöchentlichen Daten',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler',
      },
      { status: 500 }
    )
  }
}

// Hilfsfunktion: Berechne ISO-Kalenderwoche
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return weekNo
}
