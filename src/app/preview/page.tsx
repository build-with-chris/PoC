'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import Navbar from '../components/Navbar'

type WeekData = {
  week: number
  weekLabel: string
  revenue: number
  costs: number
  margin: number
  isHistorical: boolean
  isWeak: boolean
}

type SliderValues = {
  // Fixeinnahmen
  profitraining: number // monatlich

  // Tickets
  ticketpreis: number
  ticketsProWoche: number

  // Kurse (pro Teilnehmer)
  kurs1PreisProTeilnehmer: number
  kurs1Teilnehmer: number
  kurs1ProWoche: number // Anzahl der Kurse pro Woche
  kurs1Trainerkosten: number // pro Kurs

  kurs2PreisProTeilnehmer: number
  kurs2Teilnehmer: number
  kurs2ProWoche: number
  kurs2Trainerkosten: number

  kurs3PreisProTeilnehmer: number
  kurs3Teilnehmer: number
  kurs3ProWoche: number
  kurs3Trainerkosten: number

  // Workshops (Gewinn pro Teilnehmer)
  workshopGewinnProTeilnehmer: number
  workshopTeilnehmer: number
  workshopsProMonat: number

  // Vermietungen
  vermietungen: number
  mietpreis: number

  // Kosten
  miete: number // monatlich
  gagen: number // monatlich
  marketing: number // monatlich
  technik: number // monatlich
  heizkosten: number // monatlich
  sonstigeKosten: number // monatlich
}

type HistoricalData = {
  week: number
  revenue: number
  costs: number
}

export default function PreviewPage() {
  const [sliders, setSliders] = useState<SliderValues>({
    profitraining: 700,

    ticketpreis: 15,
    ticketsProWoche: 60,

    kurs1PreisProTeilnehmer: 20,
    kurs1Teilnehmer: 12,
    kurs1ProWoche: 2,
    kurs1Trainerkosten: 50,

    kurs2PreisProTeilnehmer: 18,
    kurs2Teilnehmer: 8,
    kurs2ProWoche: 3,
    kurs2Trainerkosten: 40,

    kurs3PreisProTeilnehmer: 25,
    kurs3Teilnehmer: 6,
    kurs3ProWoche: 1,
    kurs3Trainerkosten: 60,

    workshopGewinnProTeilnehmer: 20,
    workshopTeilnehmer: 15,
    workshopsProMonat: 2,

    vermietungen: 3,
    mietpreis: 250,

    miete: 2500,
    gagen: 1500,
    marketing: 300,
    technik: 200,
    heizkosten: 400,
    sonstigeKosten: 300,
  })

  const [weeks, setWeeks] = useState<WeekData[]>([])
  const [weekMultipliers, setWeekMultipliers] = useState<number[]>(
    Array(52).fill(1.0)
  )
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState<string>('')
  const [analyzingLoading, setAnalyzingLoading] = useState(false)

  // Lade historische Daten
  useEffect(() => {
    fetch('/api/weekly-data')
      .then((res) => res.json())
      .then((data) => {
        setHistoricalData(data.weeks || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Fehler beim Laden der historischen Daten:', err)
        setLoading(false)
      })
  }, [])

  // Berechne die wöchentlichen Daten
  useEffect(() => {
    const currentWeek = getCurrentWeek()

    // Basis-Einnahmen pro Woche
    const fixeinnahmenProWoche = sliders.profitraining / 4.33
    const ticketeinnahmen = sliders.ticketpreis * sliders.ticketsProWoche

    // Kurs-Einnahmen: (Preis pro Teilnehmer × Teilnehmer - Trainerkosten) × Anzahl Kurse pro Woche
    const kurs1Einnahmen = (sliders.kurs1PreisProTeilnehmer * sliders.kurs1Teilnehmer - sliders.kurs1Trainerkosten) * sliders.kurs1ProWoche
    const kurs2Einnahmen = (sliders.kurs2PreisProTeilnehmer * sliders.kurs2Teilnehmer - sliders.kurs2Trainerkosten) * sliders.kurs2ProWoche
    const kurs3Einnahmen = (sliders.kurs3PreisProTeilnehmer * sliders.kurs3Teilnehmer - sliders.kurs3Trainerkosten) * sliders.kurs3ProWoche

    // Workshop-Gewinn: Gewinn pro Teilnehmer × Teilnehmer × Anzahl pro Monat / 4.33 Wochen
    const workshopEinnahmen = (sliders.workshopGewinnProTeilnehmer * sliders.workshopTeilnehmer * sliders.workshopsProMonat) / 4.33
    const vermietungEinnahmen = sliders.vermietungen * sliders.mietpreis

    const baseRevenue =
      fixeinnahmenProWoche +
      ticketeinnahmen +
      kurs1Einnahmen +
      kurs2Einnahmen +
      kurs3Einnahmen +
      workshopEinnahmen +
      vermietungEinnahmen

    // Basis-Kosten pro Woche (Fixkosten)
    const baseCosts = (
      sliders.miete +
      sliders.gagen +
      sliders.marketing +
      sliders.technik +
      sliders.heizkosten +
      sliders.sonstigeKosten
    ) / 4.33

    const weeklyData: WeekData[] = weekMultipliers.map((multiplier, index) => {
      const weekNumber = index + 1
      const isHistorical = weekNumber < currentWeek

      // Wenn historische Daten vorhanden sind, verwende diese
      const historical = historicalData.find((h) => h.week === weekNumber)

      if (historical) {
        return {
          week: weekNumber,
          weekLabel: `KW ${weekNumber}`,
          revenue: historical.revenue,
          costs: historical.costs,
          margin: historical.revenue - historical.costs,
          isHistorical: true,
          isWeak: false,
        }
      }

      // Sonst verwende prognostizierte Werte
      const weekRevenue = baseRevenue * multiplier
      const weekCosts = baseCosts
      return {
        week: weekNumber,
        weekLabel: `KW ${weekNumber}`,
        revenue: weekRevenue,
        costs: weekCosts,
        margin: weekRevenue - weekCosts,
        isHistorical: false,
        isWeak: multiplier < 1.0,
      }
    })

    setWeeks(weeklyData)
  }, [sliders, weekMultipliers, historicalData])

  const getCurrentWeek = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    const diff = now.getTime() - start.getTime()
    const oneWeek = 1000 * 60 * 60 * 24 * 7
    return Math.floor(diff / oneWeek) + 1
  }

  const updateSlider = (key: keyof SliderValues, value: number) => {
    setSliders({ ...sliders, [key]: value })
  }

  const toggleWeakWeek = (weekIndex: number) => {
    const newMultipliers = [...weekMultipliers]
    if (newMultipliers[weekIndex] === 1.0) {
      newMultipliers[weekIndex] = 0.5
    } else if (newMultipliers[weekIndex] === 0.5) {
      newMultipliers[weekIndex] = 1.2
    } else {
      newMultipliers[weekIndex] = 1.0
    }
    setWeekMultipliers(newMultipliers)
  }

  const setWeekRange = (start: number, end: number, multiplier: number) => {
    const newMultipliers = [...weekMultipliers]
    for (let i = start; i <= end; i++) {
      newMultipliers[i] = multiplier
    }
    setWeekMultipliers(newMultipliers)
  }

  const markChristmasWeak = () => {
    setWeekRange(50, 51, 0.5)
    const newMultipliers = [...weekMultipliers]
    newMultipliers[0] = 0.5
    setWeekMultipliers(newMultipliers)
  }

  const markSummerWeak = () => {
    setWeekRange(27, 34, 0.7) // Wochen 28-35 (Juli/August)
  }

  const totalRevenue = weeks.reduce((sum, w) => sum + w.revenue, 0)
  const totalCosts = weeks.reduce((sum, w) => sum + w.costs, 0)
  const totalMargin = totalRevenue - totalCosts

  const currentWeek = getCurrentWeek()
  const historicalRevenue = weeks.filter((w) => w.week < currentWeek).reduce((sum, w) => sum + w.revenue, 0)
  const historicalCosts = weeks.filter((w) => w.week < currentWeek).reduce((sum, w) => sum + w.costs, 0)
  const projectedRevenue = weeks.filter((w) => w.week >= currentWeek).reduce((sum, w) => sum + w.revenue, 0)
  const projectedCosts = weeks.filter((w) => w.week >= currentWeek).reduce((sum, w) => sum + w.costs, 0)

  const baseWeeklyRevenue =
    sliders.profitraining / 4.33 +
    sliders.ticketpreis * sliders.ticketsProWoche +
    (sliders.kurs1PreisProTeilnehmer * sliders.kurs1Teilnehmer - sliders.kurs1Trainerkosten) * sliders.kurs1ProWoche +
    (sliders.kurs2PreisProTeilnehmer * sliders.kurs2Teilnehmer - sliders.kurs2Trainerkosten) * sliders.kurs2ProWoche +
    (sliders.kurs3PreisProTeilnehmer * sliders.kurs3Teilnehmer - sliders.kurs3Trainerkosten) * sliders.kurs3ProWoche +
    (sliders.workshopGewinnProTeilnehmer * sliders.workshopTeilnehmer * sliders.workshopsProMonat) / 4.33 +
    sliders.vermietungen * sliders.mietpreis

  const baseWeeklyCosts = (
    sliders.miete +
    sliders.gagen +
    sliders.marketing +
    sliders.technik +
    sliders.heizkosten +
    sliders.sonstigeKosten
  ) / 4.33

  const weakWeeks = weekMultipliers.filter(m => m < 1.0).length
  const strongWeeks = weekMultipliers.filter(m => m > 1.0).length

  // Analyse-Funktion
  const generateAnalysis = async () => {
    setAnalyzingLoading(true)
    try {
      const response = await fetch('/api/analyze-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
      })
      const data = await response.json()
      setAnalysis(data.analysis)
    } catch (error) {
      console.error('Fehler bei der Analyse:', error)
      setAnalysis('Fehler beim Generieren der Analyse.')
    } finally {
      setAnalyzingLoading(false)
    }
  }

  return (
    <>
      <Navbar />
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Umsatz-Vorschau</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Simuliere deine wöchentlichen Einnahmen und Ausgaben für das gesamte Jahr</p>
        </header>

        {/* Jahres-Übersicht */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Gesamt-Umsatz (Jahr)</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalRevenue.toFixed(0)} €</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Gesamt-Kosten (Jahr)</h3>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totalCosts.toFixed(0)} €</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Prognose (Rest {52 - currentWeek} Wochen)</h3>
            <p className={`text-2xl font-bold ${(projectedRevenue - projectedCosts) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {(projectedRevenue - projectedCosts).toFixed(0)} €
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Jahresgewinn</h3>
            <p className={`text-2xl font-bold ${totalMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {totalMargin.toFixed(0)} €
            </p>
          </div>
        </div>

        {/* Einnahmen-Regler */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Einnahmen</h2>

          {/* Fixeinnahmen */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">Fixeinnahmen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Profitraining (monatlich): {sliders.profitraining} €
                </label>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="50"
                  value={sliders.profitraining}
                  onChange={(e) => updateSlider('profitraining', Number(e.target.value))}
                  className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                />
                <p className="text-xs text-zinc-500 mt-1">≈ {(sliders.profitraining / 4.33).toFixed(2)} € pro Woche</p>
              </div>
            </div>
          </div>

          {/* Tickets */}
          <div className="mb-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">Ticketverkauf</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Ticketpreis: {sliders.ticketpreis} €
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={sliders.ticketpreis}
                  onChange={(e) => updateSlider('ticketpreis', Number(e.target.value))}
                  className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Tickets pro Woche: {sliders.ticketsProWoche}
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="5"
                  value={sliders.ticketsProWoche}
                  onChange={(e) => updateSlider('ticketsProWoche', Number(e.target.value))}
                  className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                />
                <p className="text-xs text-zinc-500 mt-1">Umsatz: {(sliders.ticketpreis * sliders.ticketsProWoche).toFixed(2)} € / Woche</p>
              </div>
            </div>
          </div>

          {/* Kurse */}
          <div className="mb-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">Kurse</h3>

            {/* Kurs 1 */}
            <div className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <h4 className="text-sm font-semibold mb-3 text-zinc-700 dark:text-zinc-300">Kurs 1 (z.B. Anfängerkurs)</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Preis/Teilnehmer: {sliders.kurs1PreisProTeilnehmer} €
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="30"
                    step="1"
                    value={sliders.kurs1PreisProTeilnehmer}
                    onChange={(e) => updateSlider('kurs1PreisProTeilnehmer', Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Teilnehmer: {sliders.kurs1Teilnehmer}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={sliders.kurs1Teilnehmer}
                    onChange={(e) => updateSlider('kurs1Teilnehmer', Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Trainerkosten/Kurs: {sliders.kurs1Trainerkosten} €
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="150"
                    step="5"
                    value={sliders.kurs1Trainerkosten}
                    onChange={(e) => updateSlider('kurs1Trainerkosten', Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Kurse/Woche: {sliders.kurs1ProWoche}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="7"
                    step="1"
                    value={sliders.kurs1ProWoche}
                    onChange={(e) => updateSlider('kurs1ProWoche', Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Einnahmen: {(sliders.kurs1PreisProTeilnehmer * sliders.kurs1Teilnehmer).toFixed(2)} € - Trainerkosten: {sliders.kurs1Trainerkosten} € =
                <strong className="text-zinc-700 dark:text-zinc-300"> {((sliders.kurs1PreisProTeilnehmer * sliders.kurs1Teilnehmer - sliders.kurs1Trainerkosten) * sliders.kurs1ProWoche).toFixed(2)} € / Woche</strong>
              </p>
            </div>

            {/* Kurs 2 */}
            <div className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <h4 className="text-sm font-semibold mb-3 text-zinc-700 dark:text-zinc-300">Kurs 2 (z.B. Fortgeschrittene)</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Preis/Teilnehmer: {sliders.kurs2PreisProTeilnehmer} €
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="30"
                    step="1"
                    value={sliders.kurs2PreisProTeilnehmer}
                    onChange={(e) => updateSlider('kurs2PreisProTeilnehmer', Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Teilnehmer: {sliders.kurs2Teilnehmer}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={sliders.kurs2Teilnehmer}
                    onChange={(e) => updateSlider('kurs2Teilnehmer', Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Trainerkosten/Kurs: {sliders.kurs2Trainerkosten} €
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="150"
                    step="5"
                    value={sliders.kurs2Trainerkosten}
                    onChange={(e) => updateSlider('kurs2Trainerkosten', Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Kurse/Woche: {sliders.kurs2ProWoche}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="7"
                    step="1"
                    value={sliders.kurs2ProWoche}
                    onChange={(e) => updateSlider('kurs2ProWoche', Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Einnahmen: {(sliders.kurs2PreisProTeilnehmer * sliders.kurs2Teilnehmer).toFixed(2)} € - Trainerkosten: {sliders.kurs2Trainerkosten} € =
                <strong className="text-zinc-700 dark:text-zinc-300"> {((sliders.kurs2PreisProTeilnehmer * sliders.kurs2Teilnehmer - sliders.kurs2Trainerkosten) * sliders.kurs2ProWoche).toFixed(2)} € / Woche</strong>
              </p>
            </div>

            {/* Kurs 3 */}
            <div className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <h4 className="text-sm font-semibold mb-3 text-zinc-700 dark:text-zinc-300">Kurs 3 (z.B. Spezial/Premium)</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Preis/Teilnehmer: {sliders.kurs3PreisProTeilnehmer} €
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="30"
                    step="1"
                    value={sliders.kurs3PreisProTeilnehmer}
                    onChange={(e) => updateSlider('kurs3PreisProTeilnehmer', Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Teilnehmer: {sliders.kurs3Teilnehmer}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={sliders.kurs3Teilnehmer}
                    onChange={(e) => updateSlider('kurs3Teilnehmer', Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Trainerkosten/Kurs: {sliders.kurs3Trainerkosten} €
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="150"
                    step="5"
                    value={sliders.kurs3Trainerkosten}
                    onChange={(e) => updateSlider('kurs3Trainerkosten', Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Kurse/Woche: {sliders.kurs3ProWoche}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="7"
                    step="1"
                    value={sliders.kurs3ProWoche}
                    onChange={(e) => updateSlider('kurs3ProWoche', Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Einnahmen: {(sliders.kurs3PreisProTeilnehmer * sliders.kurs3Teilnehmer).toFixed(2)} € - Trainerkosten: {sliders.kurs3Trainerkosten} € =
                <strong className="text-zinc-700 dark:text-zinc-300"> {((sliders.kurs3PreisProTeilnehmer * sliders.kurs3Teilnehmer - sliders.kurs3Trainerkosten) * sliders.kurs3ProWoche).toFixed(2)} € / Woche</strong>
              </p>
            </div>
          </div>

          {/* Workshops & Vermietung */}
          <div className="pt-6 border-t border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">Workshops & Vermietung</h3>

            {/* Workshop */}
            <div className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <h4 className="text-sm font-semibold mb-3 text-zinc-700 dark:text-zinc-300">Workshops</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Gewinn/Teilnehmer: {sliders.workshopGewinnProTeilnehmer} €
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="30"
                    step="1"
                    value={sliders.workshopGewinnProTeilnehmer}
                    onChange={(e) => updateSlider('workshopGewinnProTeilnehmer', Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Teilnehmer: {sliders.workshopTeilnehmer}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={sliders.workshopTeilnehmer}
                    onChange={(e) => updateSlider('workshopTeilnehmer', Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Workshops/Monat: {sliders.workshopsProMonat}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="1"
                    value={sliders.workshopsProMonat}
                    onChange={(e) => updateSlider('workshopsProMonat', Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Gewinn pro Workshop: {(sliders.workshopGewinnProTeilnehmer * sliders.workshopTeilnehmer).toFixed(2)} € × {sliders.workshopsProMonat} / Monat =
                <strong className="text-zinc-700 dark:text-zinc-300"> {((sliders.workshopGewinnProTeilnehmer * sliders.workshopTeilnehmer * sliders.workshopsProMonat) / 4.33).toFixed(2)} € / Woche</strong>
              </p>
            </div>

            {/* Vermietung */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Vermietungen pro Woche: {sliders.vermietungen}
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={sliders.vermietungen}
                  onChange={(e) => updateSlider('vermietungen', Number(e.target.value))}
                  className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Mietpreis: {sliders.mietpreis} €
                </label>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={sliders.mietpreis}
                  onChange={(e) => updateSlider('mietpreis', Number(e.target.value))}
                  className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                />
                <p className="text-xs text-zinc-500 mt-1">Umsatz: {(sliders.vermietungen * sliders.mietpreis).toFixed(2)} € / Woche</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Wöchentliche Basis-Einnahmen:</strong> {baseWeeklyRevenue.toFixed(2)} €
            </p>
          </div>
        </div>

        {/* Ausgaben-Regler */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Kosten (monatlich)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Miete: {sliders.miete} €
              </label>
              <input
                type="range"
                min="500"
                max="10000"
                step="100"
                value={sliders.miete}
                onChange={(e) => updateSlider('miete', Number(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Gagen: {sliders.gagen} €
              </label>
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={sliders.gagen}
                onChange={(e) => updateSlider('gagen', Number(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Marketing: {sliders.marketing} €
              </label>
              <input
                type="range"
                min="0"
                max="2000"
                step="50"
                value={sliders.marketing}
                onChange={(e) => updateSlider('marketing', Number(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Technik: {sliders.technik} €
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={sliders.technik}
                onChange={(e) => updateSlider('technik', Number(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Heizkosten: {sliders.heizkosten} €
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={sliders.heizkosten}
                onChange={(e) => updateSlider('heizkosten', Number(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Sonstige Kosten: {sliders.sonstigeKosten} €
              </label>
              <input
                type="range"
                min="0"
                max="2000"
                step="50"
                value={sliders.sonstigeKosten}
                onChange={(e) => updateSlider('sonstigeKosten', Number(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
              />
            </div>
          </div>
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-900 dark:text-red-100">
              <strong>Monatliche Gesamtkosten:</strong> {(sliders.miete + sliders.gagen + sliders.marketing + sliders.technik + sliders.heizkosten + sliders.sonstigeKosten).toFixed(2)} €
              <span className="ml-4">≈ {baseWeeklyCosts.toFixed(2)} € / Woche</span>
            </p>
          </div>
        </div>

        {/* Wochen-Timeline */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Wochen-Timeline (KW {currentWeek} aktuell)</h2>
            <div className="flex gap-2">
              <button
                onClick={markChristmasWeak}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm"
              >
                Weihnachten
              </button>
              <button
                onClick={markSummerWeak}
                className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm"
              >
                Sommerpause
              </button>
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Klicke auf Wochen ab KW {currentWeek}, um sie als normal (grün, 100%), schwach (orange, 50%), oder stark (blau, 120%) zu markieren
          </p>
          <div className="grid grid-cols-13 sm:grid-cols-26 gap-1">
            {weekMultipliers.map((multiplier, index) => {
              const weekNum = index + 1
              const isHistorical = weekNum < currentWeek
              return (
                <button
                  key={index}
                  onClick={() => !isHistorical && toggleWeakWeek(index)}
                  disabled={isHistorical}
                  className={`h-8 w-8 rounded text-xs font-medium transition-colors ${
                    isHistorical
                      ? 'bg-zinc-400 text-white cursor-not-allowed'
                      : multiplier === 1.0
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : multiplier === 0.5 || multiplier === 0.7
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                  title={`Woche ${weekNum}${isHistorical ? ' (Vergangenheit)' : ''}: ${multiplier === 1.0 ? 'Normal' : multiplier < 1.0 ? `Schwach (${(multiplier * 100).toFixed(0)}%)` : 'Stark (120%)'}`}
                >
                  {weekNum}
                </button>
              )
            })}
          </div>
        </div>

        {/* Charts */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">Wöchentliche Einnahmen & Ausgaben</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={weeks}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="weekLabel" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #444' }} />
              <Legend />
              <ReferenceLine x={`KW ${currentWeek}`} stroke="#ff6b6b" strokeDasharray="5 5" label="Aktuell" />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Einnahmen" strokeWidth={2} />
              <Line type="monotone" dataKey="costs" stroke="#ef4444" name="Ausgaben" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">KI-Analyse deiner Finanzprognose</h2>
            <button
              onClick={generateAnalysis}
              disabled={analyzingLoading}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-md text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzingLoading ? '🤖 Analysiere...' : '🤖 Analyse generieren'}
            </button>
          </div>

          {analysis ? (
            <div className="prose dark:prose-invert max-w-none">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div className="whitespace-pre-line text-zinc-800 dark:text-zinc-200 leading-relaxed">
                  {analysis.split('\n').map((line, i) => {
                    if (line.startsWith('**') || line.includes('**')) {
                      // Ersetze **text** mit fetten Text
                      const parts = line.split('**')
                      return (
                        <p key={i} className="mb-3">
                          {parts.map((part, j) => (j % 2 === 1 ? <strong key={j}>{part}</strong> : part))}
                        </p>
                      )
                    }
                    if (line.startsWith('💡') || line.startsWith('📅') || line.startsWith('🎉') || line.startsWith('⚠️')) {
                      return <p key={i} className="mb-3 text-lg">{line}</p>
                    }
                    if (line.startsWith('-')) {
                      return <li key={i} className="ml-6 mb-2">{line.substring(1).trim()}</li>
                    }
                    return line ? <p key={i} className="mb-3">{line}</p> : <br key={i} />
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
              <p className="text-lg mb-2">🤖 Klicke auf "Analyse generieren"</p>
              <p className="text-sm">Die KI wird deine Finanzprognose bewerten und dir personalisierte Empfehlungen geben.</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
