'use client'
import { useState } from 'react'
import Papa from 'papaparse'
import { useTranslations, useLocale } from 'next-intl'

type CSVRow = Record<string, string>

export default function ImportPage() {
  const t = useTranslations('import')
  const locale = useLocale()
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
        alert(t('error', { message: error.message }))
      },
    })
  }

  const handleImport = async () => {
    if (!mapping.date || !mapping.amount || !mapping.categoryId) {
      alert(locale === 'de' ? 'Bitte mindestens Datum, Betrag und Kategorie zuordnen' : 'Please map at least Date, Amount and Category')
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
        setResult(t('success', { count: json.count }))
        setCsvData([])
        setHeaders([])
        setMapping({})
      } else {
        setResult(t('error', { message: json.error }))
      }
    } catch (err) {
      setResult(t('error', { message: locale === 'de' ? 'beim Import' : 'during import' }))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t('title')}</h1>
            <p className="text-zinc-600 dark:text-zinc-400">{t('subtitle')}</p>
          </header>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
          <label htmlFor="csvFile" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t('selectFile')}</label>
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
              <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">{t('mapColumns')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['date', 'amount', 'categoryId', 'counterparty', 'note'].map((field) => (
                  <div key={field}>
                    <label htmlFor={field} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {field === 'date' ? (locale === 'de' ? 'Datum' : 'Date') + ' ' + t('required') : field === 'amount' ? (locale === 'de' ? 'Betrag' : 'Amount') + ' ' + t('required') : field === 'categoryId' ? (locale === 'de' ? 'Kategorie-ID' : 'Category ID') + ' ' + t('required') : field === 'counterparty' ? (locale === 'de' ? 'Gegenpartei' : 'Counterparty') : (locale === 'de' ? 'Notiz' : 'Note')}
                    </label>
                    <select
                      id={field}
                      value={mapping[field] || ''}
                      onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="">{t('notMapped')}</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">{t('preview')} ({csvData.length} {t('rows')})</h2>
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
              {uploading ? t('importing') : t('import')}
            </button>

            {result && (
              <div className={`mt-4 p-4 rounded-md ${result.includes(locale === 'de' ? 'Erfolgreich' : 'Successfully') ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                <p className={result.includes(locale === 'de' ? 'Erfolgreich' : 'Successfully') ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>{result}</p>
              </div>
            )}
          </>
        )}
        </div>
      </div>
  )
}
