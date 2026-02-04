'use client'

import { useState, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

interface RevenueData {
  name: string
  tickets: number
  courses: number
  workshops: number
  rental: number
  fixedIncome: number
  funding: number
  memberships: number
  total: number
}

const COLORS = {
  tickets: '#3b82f6',
  courses: '#10b981',
  workshops: '#f59e0b',
  rental: '#8b5cf6',
  fixedIncome: '#ef4444',
  funding: '#06b6d4',
  memberships: '#ec4899',
}

export default function DiagramsPage() {
  const t = useTranslations('diagrams')
  const locale = useLocale()
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseReportFile = (content: string): RevenueData | null => {
    try {
      const lines = content.split('\n')
      
      // Suche nach "Detaillierte Einnahmen (pro Woche, Netto nach MwSt.):"
      let foundSection = false
      const data: Partial<RevenueData> = {
        name: 'Analyse',
        tickets: 0,
        courses: 0,
        workshops: 0,
        rental: 0,
        fixedIncome: 0,
        funding: 0,
        memberships: 0,
        total: 0,
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        if (line.includes('Detaillierte Einnahmen') || line.includes('Detailed Revenue')) {
          foundSection = true
          continue
        }

        if (foundSection) {
          // Parse verschiedene Einnahmenquellen
          if (line.includes('Fixeinnahmen') || line.includes('Fixed Income')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€/)
            if (match) {
              const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              data.fixedIncome = value
            }
          }
          
          if (line.includes('Querfinanzierung') || line.includes('Funding')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€/)
            if (match) {
              const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              data.funding = value
            }
          }
          
          if (line.includes('Mitgliedsbeiträge') || line.includes('Membership')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€/)
            if (match) {
              const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              data.memberships = value
            }
          }
          
          if (line.includes('Ticket-Einnahmen') || line.includes('Ticket Revenue')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€/)
            if (match) {
              const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              data.tickets = value
            }
          }
          
          if (line.includes('Kurs 1 Einnahmen') || line.includes('Course 1 Revenue')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€/)
            if (match) {
              const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              data.courses = (data.courses || 0) + value
            }
          }
          
          if (line.includes('Kurs 2 Einnahmen') || line.includes('Course 2 Revenue')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€/)
            if (match) {
              const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              data.courses = (data.courses || 0) + value
            }
          }
          
          if (line.includes('Kurs 3 Einnahmen') || line.includes('Course 3 Revenue')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€/)
            if (match) {
              const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              data.courses = (data.courses || 0) + value
            }
          }
          
          if (line.includes('Workshop-Einnahmen') || line.includes('Workshop Revenue')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€/)
            if (match) {
              const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              data.workshops = value
            }
          }
          
          if (line.includes('Vermietungs-Einnahmen') || line.includes('Rental Revenue')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€/)
            if (match) {
              const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              data.rental = value
            }
          }

          // Wenn wir zur nächsten Sektion kommen, stoppen
          if (line.includes('Detaillierte Kosten') || line.includes('Detailed Costs') || line.includes('===')) {
            break
          }
        }
      }

      // Versuche auch Jahreswerte zu finden (falls wöchentliche Werte nicht gefunden wurden)
      if (data.total === 0) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()
          
          // Suche nach Jahreswerten
          if (line.includes('Gesamt-Einnahmen (Brutto)') || line.includes('Total Revenue (Gross)')) {
            const match = line.match(/[-:]?\s*([\d.,]+)\s*€/)
            if (match) {
              const totalGross = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
              // Versuche Netto-Wert zu finden
              const nextLine = lines[i + 1]?.trim() || ''
              if (nextLine.includes('Gesamt-Einnahmen (Netto)') || nextLine.includes('Total Revenue (Net)')) {
                const netMatch = nextLine.match(/[-:]?\s*([\d.,]+)\s*€/)
                if (netMatch) {
                  data.total = parseFloat(netMatch[1].replace(/\./g, '').replace(',', '.'))
                }
              }
            }
            break
          }
        }
      }

      // Berechne Gesamtsumme
      data.total = (data.tickets || 0) + (data.courses || 0) + (data.workshops || 0) + 
                   (data.rental || 0) + (data.fixedIncome || 0) + (data.funding || 0) + 
                   (data.memberships || 0)
      
      // Wenn Gesamtsumme noch 0 ist, versuche aus einzelnen Werten zu berechnen
      if (data.total === 0) {
        data.total = (data.tickets || 0) + (data.courses || 0) + (data.workshops || 0) + 
                     (data.rental || 0) + (data.fixedIncome || 0) + (data.funding || 0) + 
                     (data.memberships || 0)
      }

      // Prüfe, ob wir Daten gefunden haben
      if (data.total === 0) {
        return null
      }

      return data as RevenueData
    } catch (err) {
      console.error('Error parsing report:', err)
      return null
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      setError(locale === 'de' ? 'Bitte wählen Sie eine .txt Datei aus.' : 'Please select a .txt file.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setFileContent(content)
      
      const parsed = parseReportFile(content)
      if (parsed) {
        setRevenueData(parsed)
        setError(null)
      } else {
        setError(locale === 'de' 
          ? 'Konnte keine Einnahmendaten aus der Datei extrahieren. Bitte stellen Sie sicher, dass es sich um eine gültige Analyse-Datei handelt.'
          : 'Could not extract revenue data from file. Please ensure it is a valid analysis file.')
        setRevenueData(null)
      }
    }
    reader.onerror = () => {
      setError(locale === 'de' ? 'Fehler beim Lesen der Datei.' : 'Error reading file.')
    }
    reader.readAsText(file)
  }

  const prepareChartData = () => {
    if (!revenueData) return []

    const total = revenueData.total
    if (total === 0) return []

    return [
      {
        name: locale === 'de' ? 'Umsatz-Mix' : 'Revenue Mix',
        tickets: revenueData.tickets,
        courses: revenueData.courses,
        workshops: revenueData.workshops,
        rental: revenueData.rental,
        fixedIncome: revenueData.fixedIncome,
        funding: revenueData.funding,
        memberships: revenueData.memberships,
        ticketsPercent: (revenueData.tickets / total) * 100,
        coursesPercent: (revenueData.courses / total) * 100,
        workshopsPercent: (revenueData.workshops / total) * 100,
        rentalPercent: (revenueData.rental / total) * 100,
        fixedIncomePercent: (revenueData.fixedIncome / total) * 100,
        fundingPercent: (revenueData.funding / total) * 100,
        membershipsPercent: (revenueData.memberships / total) * 100,
      }
    ]
  }

  const chartData = prepareChartData()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            {locale === 'de' ? 'Diagramme' : 'Diagrams'}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {locale === 'de' 
              ? 'Laden Sie eine heruntergeladene Analyse hoch, um visuelle Diagramme zu erstellen'
              : 'Upload a downloaded analysis to create visual diagrams'}
          </p>
        </div>

        {/* File Upload */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
            {locale === 'de' ? 'Analyse-Datei hochladen' : 'Upload Analysis File'}
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              {locale === 'de' ? 'Datei auswählen' : 'Select File'}
            </label>
            {fileContent && (
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {locale === 'de' ? 'Datei geladen' : 'File loaded'}
              </span>
            )}
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
            </div>
          )}
        </div>

        {/* Charts */}
        {revenueData && chartData.length > 0 && (
          <div className="space-y-8">
            {/* 100% Stacked Bar Chart */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
                {locale === 'de' ? 'Umsatz-Mix (Anteile)' : 'Revenue Mix (Percentages)'}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                {locale === 'de' 
                  ? 'Zeigt die prozentuale Verteilung der Einnahmenquellen'
                  : 'Shows the percentage distribution of revenue sources'}
              </p>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip 
                    formatter={(value: number) => `${value.toFixed(2)}%`}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                  />
                  <Legend />
                  <Bar dataKey="ticketsPercent" stackId="a" fill={COLORS.tickets} name={locale === 'de' ? 'Tickets' : 'Tickets'} />
                  <Bar dataKey="coursesPercent" stackId="a" fill={COLORS.courses} name={locale === 'de' ? 'Kurse' : 'Courses'} />
                  <Bar dataKey="workshopsPercent" stackId="a" fill={COLORS.workshops} name={locale === 'de' ? 'Workshops' : 'Workshops'} />
                  <Bar dataKey="rentalPercent" stackId="a" fill={COLORS.rental} name={locale === 'de' ? 'Vermietung' : 'Rental'} />
                  <Bar dataKey="fixedIncomePercent" stackId="a" fill={COLORS.fixedIncome} name={locale === 'de' ? 'Fixeinnahmen' : 'Fixed Income'} />
                  <Bar dataKey="fundingPercent" stackId="a" fill={COLORS.funding} name={locale === 'de' ? 'Förderung' : 'Funding'} />
                  <Bar dataKey="membershipsPercent" stackId="a" fill={COLORS.memberships} name={locale === 'de' ? 'Mitgliedsbeiträge' : 'Memberships'} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Absolute Stacked Bar Chart */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
                {locale === 'de' ? 'Umsatz-Mix (Absolute Werte)' : 'Revenue Mix (Absolute Values)'}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                {locale === 'de' 
                  ? 'Zeigt die absoluten Einnahmenwerte in Euro'
                  : 'Shows the absolute revenue values in Euros'}
              </p>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip 
                    formatter={(value: number) => `${value.toFixed(2)} €`}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                  />
                  <Legend />
                  <Bar dataKey="tickets" stackId="a" fill={COLORS.tickets} name={locale === 'de' ? 'Tickets' : 'Tickets'} />
                  <Bar dataKey="courses" stackId="a" fill={COLORS.courses} name={locale === 'de' ? 'Kurse' : 'Courses'} />
                  <Bar dataKey="workshops" stackId="a" fill={COLORS.workshops} name={locale === 'de' ? 'Workshops' : 'Workshops'} />
                  <Bar dataKey="rental" stackId="a" fill={COLORS.rental} name={locale === 'de' ? 'Vermietung' : 'Rental'} />
                  <Bar dataKey="fixedIncome" stackId="a" fill={COLORS.fixedIncome} name={locale === 'de' ? 'Fixeinnahmen' : 'Fixed Income'} />
                  <Bar dataKey="funding" stackId="a" fill={COLORS.funding} name={locale === 'de' ? 'Förderung' : 'Funding'} />
                  <Bar dataKey="memberships" stackId="a" fill={COLORS.memberships} name={locale === 'de' ? 'Mitgliedsbeiträge' : 'Memberships'} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
                {locale === 'de' ? 'Zusammenfassung' : 'Summary'}
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                  <thead className="bg-zinc-50 dark:bg-zinc-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        {locale === 'de' ? 'Einnahmenquelle' : 'Revenue Source'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        {locale === 'de' ? 'Wert (€)' : 'Value (€)'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        {locale === 'de' ? 'Anteil (%)' : 'Share (%)'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-700">
                    {revenueData.tickets > 0 && (
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {locale === 'de' ? 'Tickets' : 'Tickets'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          {revenueData.tickets.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          {((revenueData.tickets / revenueData.total) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    )}
                    {revenueData.courses > 0 && (
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {locale === 'de' ? 'Kurse' : 'Courses'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          {revenueData.courses.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          {((revenueData.courses / revenueData.total) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    )}
                    {revenueData.workshops > 0 && (
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {locale === 'de' ? 'Workshops' : 'Workshops'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          {revenueData.workshops.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          {((revenueData.workshops / revenueData.total) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    )}
                    {revenueData.rental > 0 && (
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {locale === 'de' ? 'Vermietung' : 'Rental'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          {revenueData.rental.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          {((revenueData.rental / revenueData.total) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    )}
                    {revenueData.fixedIncome > 0 && (
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {locale === 'de' ? 'Fixeinnahmen' : 'Fixed Income'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          {revenueData.fixedIncome.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          {((revenueData.fixedIncome / revenueData.total) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    )}
                    {revenueData.funding > 0 && (
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {locale === 'de' ? 'Förderung' : 'Funding'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          {revenueData.funding.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          {((revenueData.funding / revenueData.total) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    )}
                    {revenueData.memberships > 0 && (
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {locale === 'de' ? 'Mitgliedsbeiträge' : 'Memberships'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          {revenueData.memberships.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          {((revenueData.memberships / revenueData.total) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    )}
                    <tr className="bg-zinc-50 dark:bg-zinc-800 font-semibold">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-50">
                        {locale === 'de' ? 'Gesamt' : 'Total'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-50">
                        {revenueData.total.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-50">
                        100.00%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!revenueData && !error && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
              {locale === 'de' 
                ? 'Bitte laden Sie eine Analyse-Datei hoch, um Diagramme zu erstellen.'
                : 'Please upload an analysis file to create diagrams.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
