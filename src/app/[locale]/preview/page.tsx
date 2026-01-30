/**
 * ============================================================================
 * FINANZKALKULATOR - PREVIEW SEITE
 * ============================================================================
 * 
 * TECHNISCHE ÜBERSICHT:
 * 
 * Datenfluss:
 *   1. User interagiert mit Reglern (Slider-Inputs)
 *   2. Regler-Änderungen → updateInput() → scenario.inputs wird aktualisiert
 *   3. useEffect in useFinancialScenario → calculateMetrics() wird automatisch aufgerufen
 *   4. scenario.metrics wird neu berechnet
 *   5. UI rendert basierend auf scenario.inputs und scenario.metrics
 * 
 * Speichern/Laden mit localStorage:
 *   - useScenarioManager Hook verwaltet alle gespeicherten Szenarien
 *   - Szenarien werden als Array unter 'financialCalculator.scenarios' gespeichert
 *   - Beim Speichern: saveScenario() → localStorage.setItem()
 *   - Beim Laden: loadScenarios() → localStorage.getItem() → JSON.parse()
 *   - Beim Löschen: deleteScenario() → Array filtern → localStorage.setItem()
 * 
 * Report-Export:
 *   - exportScenarioReport() erzeugt einen menschenlesbaren Text-Report
 *   - Report enthält: Eingaben, Kennzahlen, Interpretation
 *   - Download via Blob API und temporärem <a>-Tag
 *   - Dateiname: finanz-analyse-{name}-{YYYY-MM-DD}.txt
 * 
 * Erweiterbarkeit:
 *   - Neue Kosten/Einnahmen: Erweitere FinancialInputs Interface
 *   - Neue Kennzahlen: Erweitere FinancialMetrics Interface
 *   - Berechnungen: Anpassen von calculateMetrics() in financial-scenario.ts
 *   - UI: Neue Regler mit FinancialSlider Komponente hinzufügen
 * 
 * ============================================================================
 */

'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useFinancialScenario } from '@/hooks/useFinancialScenario'
import { useScenarioManager } from '@/hooks/useScenarioManager'
import { createFinancialScenario } from '@/types/financial-scenario'
import { exportScenarioReport, exportDetailedScenarioReport } from '@/utils/scenario-report'
import FinancialSlider from '@/app/components/FinancialSlider'
import CourseInputGroup from '@/app/components/CourseInputGroup'
import ScenarioManager from '@/app/components/ScenarioManager'

type WeekData = {
  week: number
  weekLabel: string
  revenue: number
  costs: number
  margin: number
  isHistorical: boolean
  isWeak: boolean
}

type HistoricalData = {
  week: number
  revenue: number
  costs: number
}

type ViewPeriod = 'monthly' | 'quarterly' | 'yearly'
type ViewType = 'gross' | 'net'

export default function PreviewPage() {
  const t = useTranslations('preview')
  const locale = useLocale()

  // View period and type state
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('yearly')
  const [viewType, setViewType] = useState<ViewType>('net')

  // Verwende den Szenario-Manager für gespeicherte Szenarien
  const {
    scenarios,
    currentScenario: savedCurrentScenario,
    saveCurrentScenario,
    loadScenarioById,
    deleteScenarioById,
    createNewScenario,
    updateScenarioName,
  } = useScenarioManager()

  // Verwende den neuen Hook für zentrales State-Management
  const {
    scenario,
    inputs,
    metrics,
    weekMultipliers,
    costMultipliers,
    currentWeek,
    updateInput,
    toggleWeekMultiplier,
    setWeekMultiplierManually,
    setCostMultiplierManually,
    toggleCostMultiplier,
    setWeekRange,
    updateWeekMultipliers,
    loadScenario,
    updateName,
  } = useFinancialScenario('Standard Szenario')

  // Synchronisiere savedCurrentScenario mit dem useFinancialScenario Hook
  useEffect(() => {
    if (savedCurrentScenario && savedCurrentScenario.id !== scenario.id) {
      loadScenario(savedCurrentScenario)
    }
  }, [savedCurrentScenario?.id, loadScenario, scenario.id])

  const [weeks, setWeeks] = useState<WeekData[]>([])
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState<string>('')
  const [analyzingLoading, setAnalyzingLoading] = useState(false)
  
  // State für manuelle Wochen-Eingabe
  const [editingWeek, setEditingWeek] = useState<number | null>(null)
  const [manualValue, setManualValue] = useState<string>('')
  const [editingType, setEditingType] = useState<'revenue' | 'cost'>('revenue') // Einnahmen oder Ausgaben
  const [viewMode, setViewMode] = useState<'revenue' | 'cost' | 'both'>('revenue') // Anzeigemodus

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

  // ============================================================================
  // WÖCHENTLICHE DATEN-BERECHNUNG
  // ============================================================================
  // Berechnet die wöchentlichen Einnahmen und Kosten basierend auf:
  // - metrics (berechnet in calculateMetrics() in financial-scenario.ts)
  // - weekMultipliers (für saisonale Anpassungen der Einnahmen)
  // - costMultipliers (für saisonale Anpassungen der Ausgaben)
  // - historicalData (aus API)
  
  useEffect(() => {
    // Heizanlage-Miete: 5.500€ verteilt bis KW 5 2026 (31. Januar 2026)
    // KW 44 2025 (aktuell) bis KW 5 2026 (Ende Januar) = ca. 14 Wochen
    const heizungStartWeek = 44 // KW 44 2025
    const heizungEndWeek = 5 // KW 5 2026

    const weeklyData: WeekData[] = weekMultipliers.map((multiplier, index) => {
      const weekNumber = index + 1
      const isHistorical = weekNumber < currentWeek
      const costMultiplier = costMultipliers[index] ?? 1.0 // Verwende costMultiplier für diese Woche

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

      // Wöchentliche Kosten (inkl. Rücklagen) mit costMultiplier multiplizieren
      const weekCosts = (metrics?.baseWeeklyCosts ?? 0) * costMultiplier

      // Sonst verwende prognostizierte Werte
      const weekRevenue = (metrics?.baseWeeklyRevenue ?? 0) * multiplier
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
  }, [metrics, weekMultipliers, costMultipliers, historicalData, currentWeek])

  const markChristmasWeak = () => {
    setWeekRange(50, 51, 0.5)
    const newMultipliers = [...weekMultipliers]
    newMultipliers[0] = 0.5
    updateWeekMultipliers(newMultipliers)
  }

  const markSummerWeak = () => {
    setWeekRange(27, 34, 0.7) // Wochen 28-35 (Juli/August)
  }

  // Verwende die berechneten Metrics aus dem Hook
  // Fallback auf 0 falls metrics noch nicht berechnet wurde
  const totalRevenueNet = metrics?.totalRevenue ?? 0
  const totalRevenueGross = metrics?.totalRevenueBrutto ?? 0
  const totalCosts = metrics?.totalCosts ?? 0
  const totalProfitNet = metrics?.totalProfit ?? 0
  const totalProfitGross = metrics?.totalProfitBrutto ?? 0
  const historicalRevenue = metrics?.historicalRevenue ?? 0
  const historicalCosts = metrics?.historicalCosts ?? 0
  const projectedRevenue = metrics?.projectedRevenue ?? 0
  const projectedCosts = metrics?.projectedCosts ?? 0
  const baseWeeklyRevenue = metrics?.baseWeeklyRevenue ?? 0
  const baseWeeklyRevenueGross = metrics?.baseWeeklyRevenueBrutto ?? 0
  const baseWeeklyCosts = metrics?.baseWeeklyCosts ?? 0

  // Helper function to convert yearly values to different periods
  const convertToPeriod = (yearlyValue: number, period: ViewPeriod): number => {
    switch (period) {
      case 'monthly':
        return yearlyValue / 12
      case 'quarterly':
        return yearlyValue / 4
      case 'yearly':
        return yearlyValue
    }
  }

  // Get values based on selected period and type
  const getRevenue = (): number => {
    const yearlyValue = viewType === 'gross' ? totalRevenueGross : totalRevenueNet
    return convertToPeriod(yearlyValue, viewPeriod)
  }

  const getCosts = (): number => {
    return convertToPeriod(totalCosts, viewPeriod)
  }

  const getProfit = (): number => {
    const yearlyValue = viewType === 'gross' ? totalProfitGross : totalProfitNet
    return convertToPeriod(yearlyValue, viewPeriod)
  }

  // Get period label
  const getPeriodLabel = (): string => {
    switch (viewPeriod) {
      case 'monthly':
        return locale === 'de' ? 'Monat' : 'Month'
      case 'quarterly':
        return locale === 'de' ? 'Quartal' : 'Quarter'
      case 'yearly':
        return locale === 'de' ? 'Jahr' : 'Year'
    }
  }

  // Get type label
  const getTypeLabel = (): string => {
    if (viewType === 'gross') {
      return locale === 'de' ? 'Brutto (inkl. 19% MwSt.)' : 'Gross (incl. 19% VAT)'
    } else {
      return locale === 'de' ? 'Netto (nach 19% MwSt.)' : 'Net (after 19% VAT)'
    }
  }

  const weakWeeks = weekMultipliers.filter(m => m < 1.0).length
  const strongWeeks = weekMultipliers.filter(m => m > 1.0).length

  // Analyse-Funktion
  const generateAnalysis = async () => {
    setAnalyzingLoading(true)
    try {
      // Validiere, dass alle Werte vorhanden sind
      if (
        typeof totalRevenueNet !== 'number' ||
        typeof totalCosts !== 'number' ||
        typeof totalProfitNet !== 'number' ||
        typeof baseWeeklyRevenue !== 'number' ||
        typeof baseWeeklyCosts !== 'number' ||
        isNaN(totalRevenueNet) ||
        isNaN(totalCosts)
      ) {
        console.error('Ungültige Metriken:', { totalRevenueNet, totalCosts, totalProfitNet, baseWeeklyRevenue, baseWeeklyCosts })
        setAnalysis('Fehler: Metriken konnten nicht berechnet werden. Bitte überprüfe deine Eingaben.')
        return
      }

      const response = await fetch('/api/analyze-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalRevenue: totalRevenueNet,
          totalCosts,
          totalMargin: totalProfitNet,
          projectedRevenue,
          projectedCosts,
          currentWeek,
          baseWeeklyRevenue,
          baseWeeklyCosts,
          weakWeeks,
          strongWeeks,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unbekannter Fehler' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      if (data.analysis) {
      setAnalysis(data.analysis)
      } else {
        throw new Error('Keine Analyse in der Antwort erhalten')
      }
    } catch (error) {
      console.error('Fehler bei der Analyse:', error)
      setAnalysis(`Fehler beim Generieren der Analyse: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setAnalyzingLoading(false)
    }
  }

  // Handler für Speichern
  const handleSaveScenario = () => {
    const success = saveCurrentScenario(scenario)
    if (success) {
      alert(locale === 'de' ? 'Szenario erfolgreich gespeichert!' : 'Scenario saved successfully!')
    } else {
      alert(locale === 'de' ? 'Fehler beim Speichern des Szenarios.' : 'Error saving scenario.')
    }
  }

  // Handler für Laden
  const handleLoadScenario = (id: string) => {
    const loaded = loadScenarioById(id)
    if (loaded) {
      alert(locale === 'de' ? 'Szenario geladen!' : 'Scenario loaded!')
    }
  }

  // Handler für Löschen
  const handleDeleteScenario = (id: string) => {
    if (confirm(locale === 'de' ? 'Möchtest du dieses Szenario wirklich löschen?' : 'Do you really want to delete this scenario?')) {
      const success = deleteScenarioById(id)
      if (success) {
        alert(locale === 'de' ? 'Szenario gelöscht!' : 'Scenario deleted!')
      }
    }
  }

  // Handler für neues Szenario
  const handleNewScenario = () => {
    if (confirm(locale === 'de' ? 'Möchtest du ein neues Szenario erstellen? Alle ungespeicherten Änderungen gehen verloren.' : 'Do you want to create a new scenario? All unsaved changes will be lost.')) {
      const newScenario = createFinancialScenario(locale === 'de' ? 'Neues Szenario' : 'New Scenario')
      loadScenario(newScenario)
      createNewScenario()
    }
  }

  // Handler für Report-Download
  const handleDownloadReport = () => {
    try {
      // Prüfe, ob ein Szenario existiert
      if (!scenario || !scenario.inputs || !scenario.metrics) {
        alert(locale === 'de' 
          ? 'Es ist noch keine Konfiguration aktiv. Bitte erstelle oder lade ein Szenario.' 
          : 'No active configuration. Please create or load a scenario.')
        return
      }

      // Exportiere den Report
      exportScenarioReport(scenario, 'txt')
    } catch (error) {
      console.error('Fehler beim Exportieren des Reports:', error)
      alert(locale === 'de' 
        ? 'Fehler beim Erstellen des Reports. Bitte versuche es erneut.' 
        : 'Error creating report. Please try again.')
    }
  }

  const handleDownloadDetailedReport = () => {
    try {
      // Prüfe, ob ein Szenario existiert
      if (!scenario || !scenario.inputs || !scenario.metrics) {
        alert(locale === 'de' 
          ? 'Es ist noch keine Konfiguration aktiv. Bitte erstelle oder lade ein Szenario.' 
          : 'No active configuration. Please create or load a scenario.')
        return
      }

      // Exportiere den detaillierten Report mit zeitlicher Komponente
      exportDetailedScenarioReport(scenario, weekMultipliers, costMultipliers, currentWeek, 'txt')
    } catch (error) {
      console.error('Fehler beim Exportieren des detaillierten Reports:', error)
      alert(locale === 'de' 
        ? 'Fehler beim Erstellen des detaillierten Reports. Bitte versuche es erneut.' 
        : 'Error creating detailed report. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex flex-col gap-4 mb-4">
            {/* Titel und Untertitel */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t('title')}</h1>
          <p className="text-zinc-600 dark:text-zinc-400">{t('subtitle')}</p>
            </div>
            
            {/* Szenario-Verwaltung - Alle Elemente vertikal gestapelt */}
            <div className="flex flex-col gap-2 w-full">
              {/* Szenario-Manager Button */}
              <ScenarioManager
                scenarios={scenarios}
                currentScenario={savedCurrentScenario}
                locale={locale}
                onLoadScenario={handleLoadScenario}
                onDeleteScenario={handleDeleteScenario}
                onRenameScenario={(id, newName) => {
                  const success = updateScenarioName(id, newName)
                  if (success && savedCurrentScenario?.id === id) {
                    // Aktualisiere auch das aktuelle Szenario im useFinancialScenario Hook
                    updateName(newName)
                  }
                  return success
                }}
              />
              
              {/* Buttons - Gestapelt auf Mobile, nebeneinander auf größeren Bildschirmen */}
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <button
                  onClick={handleNewScenario}
                  className="px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded-md text-sm font-medium transition-colors w-full sm:w-auto sm:flex-1"
                >
                  {locale === 'de' ? '➕ Neu' : '➕ New'}
                </button>
                <button
                  onClick={handleSaveScenario}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors w-full sm:w-auto sm:flex-1"
                >
                  {locale === 'de' ? '💾 Speichern' : '💾 Save'}
                </button>
                <button
                  onClick={handleDownloadReport}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors w-full sm:w-auto sm:flex-1"
                  title={locale === 'de' ? 'Analyse als Textdatei herunterladen' : 'Download analysis as text file'}
                >
                  {locale === 'de' ? '📄 Analyse herunterladen' : '📄 Download Report'}
                </button>
                <button
                  onClick={handleDownloadDetailedReport}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors w-full sm:w-auto sm:flex-1"
                  title={locale === 'de' ? 'Detaillierte Analyse mit wöchentlichen Daten herunterladen' : 'Download detailed analysis with weekly data'}
                >
                  {locale === 'de' ? '📊 Detaillierte Analyse' : '📊 Detailed Analysis'}
                </button>
              </div>
              
              {/* Aktuelles Szenario anzeigen (nur wenn gespeichert) */}
              {savedCurrentScenario && (
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-md text-sm w-full">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {locale === 'de' ? 'Aktuell:' : 'Current:'}
                  </span>
                  <strong className="text-zinc-900 dark:text-zinc-50">{savedCurrentScenario.name}</strong>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* View Controls */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Period Toggle */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {locale === 'de' ? 'Zeitraum' : 'Period'}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewPeriod('monthly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewPeriod === 'monthly'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                  }`}
                >
                  {locale === 'de' ? 'Monatlich' : 'Monthly'}
                </button>
                <button
                  onClick={() => setViewPeriod('quarterly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewPeriod === 'quarterly'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                  }`}
                >
                  {locale === 'de' ? 'Quartalsweise' : 'Quarterly'}
                </button>
                <button
                  onClick={() => setViewPeriod('yearly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewPeriod === 'yearly'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                  }`}
                >
                  {locale === 'de' ? 'Jährlich' : 'Yearly'}
                </button>
              </div>
            </div>

            {/* Gross/Net Toggle */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {locale === 'de' ? 'Ansicht' : 'View'}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewType('gross')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewType === 'gross'
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                  }`}
                >
                  {locale === 'de' ? 'Brutto' : 'Gross'}
                </button>
                <button
                  onClick={() => setViewType('net')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewType === 'net'
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                  }`}
                >
                  {locale === 'de' ? 'Netto' : 'Net'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Übersicht */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              {t('revenue')} ({getPeriodLabel()})
            </h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{getRevenue().toFixed(0)} €</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{getTypeLabel()}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              {t('costs')} ({getPeriodLabel()})
            </h3>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{getCosts().toFixed(0)} €</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              {locale === 'de' ? 'Prognose' : 'Forecast'} ({locale === 'de' ? 'Rest' : 'Remaining'} {52 - currentWeek} {locale === 'de' ? 'Wochen' : 'Weeks'})
            </h3>
            <p className={`text-2xl font-bold ${(projectedRevenue - projectedCosts) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {(projectedRevenue - projectedCosts).toFixed(0)} €
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{locale === 'de' ? 'Netto (nach 19% MwSt.)' : 'Net (after 19% VAT)'}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              {locale === 'de' ? 'Gewinn' : 'Profit'} ({getPeriodLabel()})
            </h3>
            <p className={`text-2xl font-bold ${getProfit() >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {getProfit().toFixed(0)} €
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{getTypeLabel()}</p>
          </div>
        </div>

        {/* Einnahmen-Regler */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">{t('revenue')}</h2>

          {/* Fixeinnahmen - Verwendet FinancialSlider Komponente */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">{t('fixedIncome')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FinancialSlider
                label={`${t('profitraining')} (${locale === 'de' ? 'monatlich' : 'monthly'})`}
                value={inputs.profitraining}
                onChange={(value) => updateInput('profitraining', value)}
                min={0}
                max={2000}
                step={50}
                showCurrency
                info={`≈ ${metrics.fixedIncomePerWeek.toFixed(2)} € ${locale === 'de' ? 'pro Woche' : 'per week'}`}
              />
            </div>
          </div>

          {/* Tickets - Verwendet FinancialSlider Komponente */}
          <div className="mb-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">{t('tickets')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FinancialSlider
                label={t('ticketPrice')}
                value={inputs.ticketPrice}
                onChange={(value) => updateInput('ticketPrice', value)}
                min={5}
                max={50}
                step={1}
                showCurrency
                info={t('ticketPriceNote')}
              />
              <FinancialSlider
                label={t('ticketsPerWeek')}
                value={inputs.ticketsPerWeek}
                onChange={(value) => updateInput('ticketsPerWeek', value)}
                min={0}
                max={600}
                step={5}
                info={`${t('revenue')}: ${metrics.ticketRevenuePerWeek.toFixed(2)} € / ${locale === 'de' ? 'Woche' : 'Week'}`}
              />
              <FinancialSlider
                label={t('gastronomyProfitPerTicket')}
                value={inputs.gastronomyProfitPerTicket}
                onChange={(value) => updateInput('gastronomyProfitPerTicket', value)}
                min={0}
                max={10}
                step={0.5}
                showCurrency
                info={`${locale === 'de' ? 'Gewinn' : 'Profit'}: ${metrics.gastronomyRevenuePerWeek.toFixed(2)} € / ${locale === 'de' ? 'Woche' : 'Week'}`}
              />
            </div>
          </div>

          {/* Shows/Events - Gebühren */}
          <div className="mb-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">{locale === 'de' ? 'Shows/Events' : 'Shows/Events'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FinancialSlider
                label={t('showsPerWeek')}
                value={inputs.showsPerWeek}
                onChange={(value) => updateInput('showsPerWeek', value)}
                min={0}
                max={10}
                step={1}
              />
              <FinancialSlider
                label={t('gemaFeePerShow')}
                value={inputs.gemaFeePerShow}
                onChange={(value) => updateInput('gemaFeePerShow', value)}
                min={0}
                max={200}
                step={5}
                showCurrency
              />
              <FinancialSlider
                label={t('kvrFeePerShow')}
                value={inputs.kvrFeePerShow}
                onChange={(value) => updateInput('kvrFeePerShow', value)}
                min={0}
                max={200}
                step={5}
                showCurrency
              />
              <FinancialSlider
                label={t('artistFeePerShow')}
                value={inputs.artistFeePerShow}
                onChange={(value) => updateInput('artistFeePerShow', value)}
                min={200}
                max={1000}
                step={50}
                showCurrency
                info={`${locale === 'de' ? 'Gesamt-Gebühren' : 'Total Fees'}: ${metrics.showFeesPerWeek.toFixed(2)} € / ${locale === 'de' ? 'Woche' : 'Week'}`}
              />
            </div>
          </div>

          {/* Kurse - Verwendet wiederverwendbare CourseInputGroup Komponente */}
          <div className="mb-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">{t('courses')}</h3>

            {/* Kurs 1, 2, 3 - Reduziert Code-Duplikation durch wiederverwendbare Komponente */}
            <CourseInputGroup
              courseNumber={1}
              t={t}
              locale={locale}
              inputs={inputs}
              onUpdateInput={updateInput}
              weeklyRevenue={metrics.course1RevenuePerWeek}
            />
            <CourseInputGroup
              courseNumber={2}
              t={t}
              locale={locale}
              inputs={inputs}
              onUpdateInput={updateInput}
              weeklyRevenue={metrics.course2RevenuePerWeek}
            />
            <CourseInputGroup
              courseNumber={3}
              t={t}
              locale={locale}
              inputs={inputs}
              onUpdateInput={updateInput}
              weeklyRevenue={metrics.course3RevenuePerWeek}
            />
          </div>

          {/* Workshops & Vermietung */}
          <div className="pt-6 border-t border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">{t('workshops')} & {t('rental')}</h3>

            {/* Workshop - Verwendet FinancialSlider Komponente */}
            <div className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <h4 className="text-sm font-semibold mb-3 text-zinc-700 dark:text-zinc-300">{t('workshops')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FinancialSlider
                  label={t('profitPerParticipant')}
                  value={inputs.workshopProfitPerParticipant}
                  onChange={(value) => updateInput('workshopProfitPerParticipant', value)}
                  min={10}
                  max={30}
                  step={1}
                  showCurrency
                  labelClassName="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
                />
                <FinancialSlider
                  label={t('participants')}
                  value={inputs.workshopParticipants}
                  onChange={(value) => updateInput('workshopParticipants', value)}
                  min={0}
                  max={30}
                  step={1}
                  labelClassName="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
                />
                <FinancialSlider
                  label={t('workshopsPerMonth')}
                  value={inputs.workshopsPerMonth}
                  onChange={(value) => updateInput('workshopsPerMonth', value)}
                  min={0}
                  max={8}
                  step={1}
                  labelClassName="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
                />
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                {locale === 'de' ? 'Gewinn pro Workshop' : 'Profit per Workshop'}: {(inputs.workshopProfitPerParticipant * inputs.workshopParticipants).toFixed(2)} € × {inputs.workshopsPerMonth} / {locale === 'de' ? 'Monat' : 'Month'} =
                <strong className="text-zinc-700 dark:text-zinc-300"> {metrics.workshopRevenuePerWeek.toFixed(2)} € / {locale === 'de' ? 'Woche' : 'Week'}</strong>
              </p>
            </div>

            {/* Vermietung - Verwendet FinancialSlider Komponente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FinancialSlider
                label={t('rentalsPerWeek')}
                value={inputs.rentalsPerWeek}
                onChange={(value) => updateInput('rentalsPerWeek', value)}
                min={0}
                max={20}
                step={1}
              />
              <FinancialSlider
                label={t('rentalPrice')}
                value={inputs.rentalPrice}
                onChange={(value) => updateInput('rentalPrice', value)}
                min={50}
                max={1000}
                step={50}
                showCurrency
                info={`${t('revenue')}: ${metrics.rentalRevenuePerWeek.toFixed(2)} € / ${locale === 'de' ? 'Woche' : 'Week'}`}
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>{t('weeklyRevenue')}:</strong> {metrics.baseWeeklyRevenue.toFixed(2)} €
            </p>
          </div>
        </div>

        {/* Ausgaben-Regler - Verwendet FinancialSlider Komponente */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">{t('costs')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FinancialSlider
              label={`${t('rent')} (${locale === 'de' ? 'derzeit 0 €' : 'currently 0 €'})`}
              value={inputs.rent}
              onChange={(value) => updateInput('rent', value)}
              min={0}
              max={10000}
              step={100}
              showCurrency
            />
            <FinancialSlider
              label={t('salaries')}
              value={inputs.salaries}
              onChange={(value) => updateInput('salaries', value)}
              min={0}
              max={20000}
              step={100}
              showCurrency
            />
            <FinancialSlider
              label={t('marketing')}
              value={inputs.marketing}
              onChange={(value) => updateInput('marketing', value)}
              min={0}
              max={2000}
              step={50}
              showCurrency
            />
            <FinancialSlider
              label={t('technology')}
              value={inputs.technology}
              onChange={(value) => updateInput('technology', value)}
              min={0}
              max={1000}
              step={50}
              showCurrency
            />
            <FinancialSlider
              label={t('fuel')}
              value={inputs.heatingCosts}
              onChange={(value) => updateInput('heatingCosts', value)}
              min={0}
              max={5000}
              step={100}
              showCurrency
            />
            <FinancialSlider
              label={t('otherCosts')}
              value={inputs.otherCosts}
              onChange={(value) => updateInput('otherCosts', value)}
              min={0}
              max={2000}
              step={50}
              showCurrency
            />
            <FinancialSlider
              label={locale === 'de' ? 'Wöchentliche Rücklagen' : 'Weekly Reserves'}
              value={inputs.weeklyReserves}
              onChange={(value) => updateInput('weeklyReserves', value)}
              min={0}
              max={1000}
              step={25}
              showCurrency
              info={locale === 'de' ? 'Für unerwartete Ausgaben' : 'For unexpected expenses'}
            />
          </div>
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-900 dark:text-red-100">
              <strong>{t('totalMonthly')}:</strong> {(inputs.rent + inputs.salaries + inputs.marketing + inputs.technology + inputs.heatingCosts + inputs.otherCosts).toFixed(2)} €
            </p>
            <p className="text-sm text-red-900 dark:text-red-100 mt-1">
              <strong>{locale === 'de' ? 'Wöchentliche Rücklagen' : 'Weekly Reserves'}:</strong> {inputs.weeklyReserves.toFixed(2)} €
              <span className="ml-4">≈ {metrics.baseWeeklyCosts.toFixed(2)} € / {locale === 'de' ? 'Woche' : 'Week'} ({locale === 'de' ? 'inkl. Rücklagen' : 'incl. reserves'})</span>
            </p>
          </div>
        </div>

        {/* Wochen-Timeline */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{locale === 'de' ? 'Wochen-Timeline' : 'Week Timeline'} ({t('week')} {currentWeek} {locale === 'de' ? 'aktuell' : 'current'})</h2>
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-md p-1">
                <button
                  onClick={() => setViewMode('revenue')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === 'revenue'
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {locale === 'de' ? 'Einnahmen' : 'Revenue'}
                </button>
                <button
                  onClick={() => setViewMode('cost')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === 'cost'
                      ? 'bg-red-600 text-white'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {locale === 'de' ? 'Ausgaben' : 'Costs'}
                </button>
                <button
                  onClick={() => setViewMode('both')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === 'both'
                      ? 'bg-purple-600 text-white'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {locale === 'de' ? 'Beide' : 'Both'}
                </button>
              </div>
              <button
                onClick={markChristmasWeak}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm"
              >
                {locale === 'de' ? 'Weihnachten' : 'Christmas'}
              </button>
              <button
                onClick={markSummerWeak}
                className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm"
              >
                {locale === 'de' ? 'Sommerpause' : 'Summer Break'}
              </button>
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            {locale === 'de'
              ? `Klicke auf Wochen ab KW ${currentWeek}, um sie zu ändern. Doppelklick für manuelle Eingabe. Grau = ausgeschlossen (0%), Grün = normal (100%), Orange = schwach (50%), Blau = stark (120%)`
              : `Click on weeks starting from Week ${currentWeek} to change them. Double-click for manual input. Gray = excluded (0%), Green = normal (100%), Orange = weak (50%), Blue = strong (120%)`
            }
          </p>
          
          {/* Einnahmen-Multiplikatoren */}
          {(viewMode === 'revenue' || viewMode === 'both') && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                {locale === 'de' ? 'Einnahmen-Multiplikatoren' : 'Revenue Multipliers'}
              </h3>
              <div className="grid grid-cols-13 sm:grid-cols-26 gap-1">
                  {weekMultipliers.map((multiplier, index) => {
                    const weekNum = index + 1
                    const isHistorical = weekNum < currentWeek
                    const isExcluded = multiplier === 0
                    
                    const getButtonClass = () => {
                      if (isHistorical) return 'bg-zinc-400 text-white cursor-not-allowed'
                      if (isExcluded) return 'bg-zinc-600 hover:bg-zinc-700 text-white line-through'
                      if (multiplier === 1.0) return 'bg-green-500 hover:bg-green-600 text-white'
                      if (multiplier === 0.5 || (multiplier > 0 && multiplier < 1.0)) return 'bg-orange-500 hover:bg-orange-600 text-white'
                      if (multiplier === 1.2) return 'bg-blue-500 hover:bg-blue-600 text-white'
                      return 'bg-purple-500 hover:bg-purple-600 text-white' // Custom value
                    }
                    
                    const getTooltip = () => {
                      if (isHistorical) {
                        return locale === 'de' 
                          ? `Woche ${weekNum} (Vergangenheit) - Einnahmen`
                          : `Week ${weekNum} (Past) - Revenue`
                      }
                      if (isExcluded) {
                        return locale === 'de'
                          ? `Woche ${weekNum}: Ausgeschlossen (0%) - Keine Einnahmen`
                          : `Week ${weekNum}: Excluded (0%) - No revenue`
                      }
                      const percent = (multiplier * 100).toFixed(0)
                      if (multiplier === 1.0) {
                        return locale === 'de' ? `Woche ${weekNum}: Normal (100%) - Einnahmen` : `Week ${weekNum}: Normal (100%) - Revenue`
                      }
                      if (multiplier === 0.5) {
                        return locale === 'de' ? `Woche ${weekNum}: Schwach (50%) - Einnahmen` : `Week ${weekNum}: Weak (50%) - Revenue`
                      }
                      if (multiplier === 1.2) {
                        return locale === 'de' ? `Woche ${weekNum}: Stark (120%) - Einnahmen` : `Week ${weekNum}: Strong (120%) - Revenue`
                      }
                      return locale === 'de' 
                        ? `Woche ${weekNum}: Manuell (${percent}%) - Einnahmen - Doppelklick zum Bearbeiten`
                        : `Week ${weekNum}: Manual (${percent}%) - Revenue - Double-click to edit`
                    }
                    
                    return (
                      <button
                        key={`revenue-${index}`}
                        onClick={() => !isHistorical && toggleWeekMultiplier(index)}
                        onDoubleClick={(e) => {
                          e.preventDefault()
                          if (!isHistorical) {
                            setEditingWeek(index)
                            setEditingType('revenue')
                            setManualValue((multiplier * 100).toFixed(1))
                          }
                        }}
                        disabled={isHistorical}
                        className={`h-8 w-8 rounded text-xs font-medium transition-colors ${getButtonClass()}`}
                        title={getTooltip()}
                      >
                        {weekNum}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          
          {/* Ausgaben-Multiplikatoren */}
          {(viewMode === 'cost' || viewMode === 'both') && (
            <div className={viewMode === 'both' ? 'mt-4' : ''}>
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                {locale === 'de' ? 'Ausgaben-Multiplikatoren' : 'Cost Multipliers'}
              </h3>
              <div className="grid grid-cols-13 sm:grid-cols-26 gap-1">
                {costMultipliers.map((multiplier, index) => {
                  const weekNum = index + 1
                  const isHistorical = weekNum < currentWeek
                  const isExcluded = multiplier === 0
                  
                  const getButtonClass = () => {
                    if (isHistorical) return 'bg-zinc-400 text-white cursor-not-allowed'
                    if (isExcluded) return 'bg-zinc-600 hover:bg-zinc-700 text-white line-through'
                    if (multiplier === 1.0) return 'bg-green-500 hover:bg-green-600 text-white'
                    if (multiplier === 0.5 || (multiplier > 0 && multiplier < 1.0)) return 'bg-orange-500 hover:bg-orange-600 text-white'
                    if (multiplier === 1.2) return 'bg-blue-500 hover:bg-blue-600 text-white'
                    return 'bg-purple-500 hover:bg-purple-600 text-white' // Custom value
                  }
                  
                  const getTooltip = () => {
                    if (isHistorical) {
                      return locale === 'de' 
                        ? `Woche ${weekNum} (Vergangenheit) - Ausgaben`
                        : `Week ${weekNum} (Past) - Costs`
                    }
                    if (isExcluded) {
                      return locale === 'de'
                        ? `Woche ${weekNum}: Ausgeschlossen (0%) - Keine Ausgaben`
                        : `Week ${weekNum}: Excluded (0%) - No costs`
                    }
                    const percent = (multiplier * 100).toFixed(0)
                    if (multiplier === 1.0) {
                      return locale === 'de' ? `Woche ${weekNum}: Normal (100%) - Ausgaben` : `Week ${weekNum}: Normal (100%) - Costs`
                    }
                    if (multiplier === 0.5) {
                      return locale === 'de' ? `Woche ${weekNum}: Schwach (50%) - Ausgaben` : `Week ${weekNum}: Weak (50%) - Costs`
                    }
                    if (multiplier === 1.2) {
                      return locale === 'de' ? `Woche ${weekNum}: Stark (120%) - Ausgaben` : `Week ${weekNum}: Strong (120%) - Costs`
                    }
                    return locale === 'de' 
                      ? `Woche ${weekNum}: Manuell (${percent}%) - Ausgaben - Doppelklick zum Bearbeiten`
                      : `Week ${weekNum}: Manual (${percent}%) - Costs - Double-click to edit`
                  }
                  
                  return (
                    <button
                      key={`cost-${index}`}
                      onClick={() => !isHistorical && toggleCostMultiplier(index)}
                      onDoubleClick={(e) => {
                        e.preventDefault()
                        if (!isHistorical) {
                          setEditingWeek(index)
                          setEditingType('cost')
                          setManualValue((multiplier * 100).toFixed(1))
                        }
                      }}
                      disabled={isHistorical}
                      className={`h-8 w-8 rounded text-xs font-medium transition-colors ${getButtonClass()}`}
                      title={getTooltip()}
                    >
                      {weekNum}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Modal für manuelle Wochen-Eingabe */}
          {editingWeek !== null && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 max-w-sm w-full mx-4">
                <h3 className="text-lg font-bold mb-4 text-zinc-900 dark:text-zinc-50">
                  {locale === 'de' 
                    ? `Woche ${editingWeek + 1} - Manueller Wert (${editingType === 'revenue' ? 'Einnahmen' : 'Ausgaben'})`
                    : `Week ${editingWeek + 1} - Manual Value (${editingType === 'revenue' ? 'Revenue' : 'Costs'})`}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  {locale === 'de'
                    ? `Gib einen Prozentwert ein (0-200%). 0% = ausgeschlossen, 100% = normal. ${editingType === 'revenue' ? 'Einnahmen' : 'Ausgaben'} für diese Woche.`
                    : `Enter a percentage value (0-200%). 0% = excluded, 100% = normal. ${editingType === 'revenue' ? 'Revenue' : 'Costs'} for this week.`}
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="number"
                    min="0"
                    max="200"
                    step="0.1"
                    value={manualValue}
                    onChange={(e) => setManualValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const value = parseFloat(manualValue)
                        if (!isNaN(value) && value >= 0 && value <= 200) {
                          if (editingType === 'revenue') {
                            setWeekMultiplierManually(editingWeek, value / 100)
                          } else {
                            setCostMultiplierManually(editingWeek, value / 100)
                          }
                          setEditingWeek(null)
                          setManualValue('')
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50"
                    autoFocus
                  />
                  <span className="text-zinc-600 dark:text-zinc-400">%</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const value = parseFloat(manualValue)
                      if (!isNaN(value) && value >= 0 && value <= 200) {
                        if (editingType === 'revenue') {
                          setWeekMultiplierManually(editingWeek, value / 100)
                        } else {
                          setCostMultiplierManually(editingWeek, value / 100)
                        }
                        setEditingWeek(null)
                        setManualValue('')
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                  >
                    {locale === 'de' ? 'Speichern' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingWeek(null)
                      setManualValue('')
                    }}
                    className="flex-1 px-4 py-2 bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-50 rounded-md font-medium"
                  >
                    {locale === 'de' ? 'Abbrechen' : 'Cancel'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">{t('weeklyChart')}</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={weeks}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="weekLabel" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #444' }} />
              <Legend />
              <ReferenceLine x={`KW ${currentWeek}`} stroke="#ff6b6b" strokeDasharray="5 5" label={locale === 'de' ? 'Aktuell' : 'Current'} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" name={t('revenue')} strokeWidth={2} />
              <Line type="monotone" dataKey="costs" stroke="#ef4444" name={t('costs')} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{locale === 'de' ? 'KI-Analyse deiner Finanzprognose' : 'AI Analysis of Your Financial Forecast'}</h2>
            <button
              onClick={generateAnalysis}
              disabled={analyzingLoading}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-md text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzingLoading ? (locale === 'de' ? '🤖 Analysiere...' : '🤖 Analyzing...') : (locale === 'de' ? '🤖 Analyse generieren' : '🤖 Generate Analysis')}
            </button>
          </div>

          {analysis ? (
            <div className="prose dark:prose-invert max-w-none">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div className="whitespace-pre-line text-zinc-800 dark:text-zinc-200 leading-relaxed">
                  {analysis.split('\n').map((line, i) => {
                    if (line.startsWith('**') || line.includes('**')) {
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
              <p className="text-lg mb-2">🤖 {locale === 'de' ? 'Klicke auf "Analyse generieren"' : 'Click "Generate Analysis"'}</p>
              <p className="text-sm">{locale === 'de' ? 'Die KI wird deine Finanzprognose bewerten und dir personalisierte Empfehlungen geben.' : 'The AI will evaluate your financial forecast and provide personalized recommendations.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
