'use client'
import { useState } from 'react'
import Papa from 'papaparse'
import Navbar from '../components/Navbar'

type CSVRow = Record<string, string>

export default function ImportPage() {
  const [csvData, setCsvData] = useState<CSVRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVRow[]
        setCsvData(data)
        if (data.length > 0) {
          setHeaders(Object.keys(data[0]))
        }
      },
      error: (error) => {
        alert('Fehler beim Parsen: ' + error.message)
      },
    })
  }

  const handleImport = async () => {
    if (!mapping.date || !mapping.amount || !mapping.categoryId) {
      alert('Bitte mindestens Datum, Betrag und Kategorie zuordnen')
      return
    }

    setUploading(true)
    setResult(null)

    const transactions = csvData.map((row) => ({
      date: row[mapping.date],
      amount: row[mapping.amount],
      categoryId: row[mapping.categoryId],
      counterparty: mapping.counterparty ? row[mapping.counterparty] : undefined,
      note: mapping.note ? row[mapping.note] : undefined,
    }))

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions }),
      })

      const json = await res.json()
      if (res.ok) {
        setResult(`Erfolgreich ${json.count} Transaktionen importiert`)
        setCsvData([])
        setHeaders([])
        setMapping({})
      } else {
        setResult(`Fehler: ${json.error}`)
      }
    } catch (err) {
      setResult('Fehler beim Import')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">CSV Import</h1>
            <p className="text-zinc-600 dark:text-zinc-400">Lade eine CSV-Datei hoch und ordne die Spalten zu</p>
          </header>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
          <label htmlFor="csvFile" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">CSV-Datei auswählen</label>
          <input
            type="file"
            id="csvFile"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-zinc-900 dark:text-zinc-100 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300"
          />
        </div>

        {headers.length > 0 && (
          <>
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">Spalten zuordnen</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['date', 'amount', 'categoryId', 'counterparty', 'note'].map((field) => (
                  <div key={field}>
                    <label htmlFor={field} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {field === 'date' ? 'Datum *' : field === 'amount' ? 'Betrag *' : field === 'categoryId' ? 'Kategorie-ID *' : field === 'counterparty' ? 'Gegenpartei' : 'Notiz'}
                    </label>
                    <select
                      id={field}
                      value={mapping[field] || ''}
                      onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="">-- nicht zugeordnet --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">Vorschau ({csvData.length} Zeilen)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                      {headers.map((h) => (
                        <th key={h} className="text-left py-2 px-4 text-zinc-700 dark:text-zinc-300">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800">
                        {headers.map((h) => (
                          <td key={h} className="py-2 px-4 text-zinc-900 dark:text-zinc-100">{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={handleImport}
              disabled={uploading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:bg-zinc-400 disabled:cursor-not-allowed"
            >
              {uploading ? 'Importiere...' : 'Importieren'}
            </button>

            {result && (
              <div className={`mt-4 p-4 rounded-md ${result.startsWith('Erfolgreich') ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                <p className={result.startsWith('Erfolgreich') ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>{result}</p>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </>
  )
}
