'use client'
import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Navbar from '../components/Navbar'

type ForecastData = {
  month: string
  revenue: number
  costs: number
  margin: number
}

type Scenario = 'base' | 'optimistic' | 'pessimistic'

export default function ForecastPage() {
  const [data, setData] = useState<ForecastData[]>([])
  const [scenario, setScenario] = useState<Scenario>('base')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/forecast?scenario=${scenario}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json.historical || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [scenario])

  const breakEvenIndex = data.findIndex((d) => d.margin >= 0)
  const breakEvenMonth = breakEvenIndex >= 0 ? data[breakEvenIndex].month : null

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Prognose</h1>
            <p className="text-zinc-600 dark:text-zinc-400">12-Monats-Vorhersage basierend auf historischen Daten</p>
          </header>

        <div className="mb-6">
          <label htmlFor="scenario" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Szenario</label>
          <select
            id="scenario"
            value={scenario}
            onChange={(e) => setScenario(e.target.value as Scenario)}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          >
            <option value="base">Basis (Trend)</option>
            <option value="optimistic">Optimistisch (+20%)</option>
            <option value="pessimistic">Pessimistisch (-20%)</option>
          </select>
        </div>

        {loading ? (
          <p className="text-zinc-600 dark:text-zinc-400">Lade Daten...</p>
        ) : (
          <>
            {breakEvenMonth && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-green-800 dark:text-green-200">
                  <strong>Break-Even:</strong> Voraussichtlich im {breakEvenMonth}
                </p>
              </div>
            )}

            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">Umsatz & Kosten</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #444' }} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Umsatz" strokeWidth={2} />
                  <Line type="monotone" dataKey="costs" stroke="#ef4444" name="Kosten" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">Deckungsbeitrag</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #444' }} />
                  <Legend />
                  <Bar dataKey="margin" fill="#3b82f6" name="Deckungsbeitrag" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
        </div>
      </div>
    </>
  )
}
