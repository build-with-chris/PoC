/**
 * Mobile-optimierte Szenario-Verwaltung
 * 
 * Bietet eine benutzerfreundliche Oberfläche zum:
 * - Laden von gespeicherten Szenarien
 * - Umbenennen von Szenarien
 * - Löschen von Szenarien
 * 
 * Mobile-optimiert mit Modal/Dialog für bessere UX auf kleinen Bildschirmen
 */

'use client'

import { useState } from 'react'
import { FinancialScenario } from '@/types/financial-scenario'

interface ScenarioManagerProps {
  scenarios: FinancialScenario[]
  currentScenario: FinancialScenario | null
  locale: string
  onLoadScenario: (id: string) => void
  onDeleteScenario: (id: string) => void
  onRenameScenario: (id: string, newName: string) => boolean
}

export default function ScenarioManager({
  scenarios,
  currentScenario,
  locale,
  onLoadScenario,
  onDeleteScenario,
  onRenameScenario,
}: ScenarioManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      de: {
        savedScenarios: 'Gespeicherte Szenarien',
        load: 'Laden',
        rename: 'Umbenennen',
        delete: 'Löschen',
        cancel: 'Abbrechen',
        save: 'Speichern',
        current: 'Aktuell',
        noScenarios: 'Keine Szenarien gespeichert',
        renameScenario: 'Szenario umbenennen',
        enterName: 'Neuer Name:',
      },
      en: {
        savedScenarios: 'Saved Scenarios',
        load: 'Load',
        rename: 'Rename',
        delete: 'Delete',
        cancel: 'Cancel',
        save: 'Save',
        current: 'Current',
        noScenarios: 'No scenarios saved',
        renameScenario: 'Rename Scenario',
        enterName: 'New name:',
      },
    }
    return translations[locale]?.[key] || key
  }

  const handleRename = (scenario: FinancialScenario) => {
    setEditingId(scenario.id)
    setEditName(scenario.name)
  }

  const handleSaveRename = (id: string) => {
    if (editName.trim() && editName.trim() !== '') {
      const success = onRenameScenario(id, editName.trim())
      if (success) {
        setEditingId(null)
        setEditName('')
      }
    }
  }

  const handleCancelRename = () => {
    setEditingId(null)
    setEditName('')
  }

  if (scenarios.length === 0) {
    return null
  }

  return (
    <>
      {/* Mobile: Button zum Öffnen des Modals */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded-md text-sm font-medium transition-colors w-full sm:w-auto"
      >
        {locale === 'de' ? '📁 Szenarien' : '📁 Scenarios'} ({scenarios.length})
      </button>

      {/* Modal/Dialog für Szenario-Verwaltung */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {t('savedScenarios')}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className={`p-4 rounded-lg border-2 ${
                      currentScenario?.id === scenario.id
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800'
                    }`}
                  >
                    {editingId === scenario.id ? (
                      // Bearbeitungsmodus
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveRename(scenario.id)
                            } else if (e.key === 'Escape') {
                              handleCancelRename()
                            }
                          }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveRename(scenario.id)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                          >
                            {t('save')}
                          </button>
                          <button
                            onClick={handleCancelRename}
                            className="px-3 py-1.5 bg-zinc-500 hover:bg-zinc-600 text-white rounded text-sm"
                          >
                            {t('cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Anzeigemodus
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                                {scenario.name}
                              </h3>
                              {currentScenario?.id === scenario.id && (
                                <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded">
                                  {t('current')}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                              {new Date(scenario.updatedAt).toLocaleDateString(
                                locale === 'de' ? 'de-DE' : 'en-US',
                                {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {currentScenario?.id !== scenario.id && (
                            <button
                              onClick={() => {
                                onLoadScenario(scenario.id)
                                setIsOpen(false)
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                            >
                              {t('load')}
                            </button>
                          )}
                          <button
                            onClick={() => handleRename(scenario)}
                            className="px-3 py-1.5 bg-zinc-600 hover:bg-zinc-700 text-white rounded text-sm"
                          >
                            ✏️ {t('rename')}
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  locale === 'de'
                                    ? `Möchtest du "${scenario.name}" wirklich löschen?`
                                    : `Do you really want to delete "${scenario.name}"?`
                                )
                              ) {
                                onDeleteScenario(scenario.id)
                              }
                            }}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                          >
                            🗑️ {t('delete')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

