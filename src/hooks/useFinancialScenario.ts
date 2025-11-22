'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FinancialScenario,
  FinancialInputs,
  FinancialMetrics,
  createFinancialScenario,
  calculateMetrics,
  updateScenarioMetadata,
  DEFAULT_FINANCIAL_INPUTS,
} from '@/types/financial-scenario'

/**
 * Custom Hook für das Management eines FinancialScenario
 * 
 * Dieser Hook zentralisiert:
 * - State-Management für Inputs und Metrics
 * - Automatische Neuberechnung der Metrics bei Input-Änderungen
 * - Update-Funktionen für Inputs
 * 
 * Datenfluss:
 *   User ändert Regler → updateInput() → scenario.inputs wird aktualisiert
 *   → useEffect erkennt Änderung → calculateMetrics() wird aufgerufen
 *   → scenario.metrics wird automatisch neu berechnet
 * 
 * Verwendung:
 * ```tsx
 * const { scenario, updateInput, updateInputs, resetToDefaults } = useFinancialScenario('Mein Szenario')
 * ```
 */
export function useFinancialScenario(initialName: string = 'Neues Szenario') {
  // Erstelle initiales Szenario mit Standard-Werten
  const [scenario, setScenario] = useState<FinancialScenario>(() =>
    createFinancialScenario(initialName)
  )

  // Wöchentliche Multiplikatoren für saisonale Anpassungen (52 Wochen)
  // 1.0 = normal, 0.5 = schwach, 1.2 = stark
  const [weekMultipliers, setWeekMultipliers] = useState<number[]>(() =>
    Array(52).fill(1.0)
  )

  // Aktuelle Kalenderwoche (berechnet aus aktuellem Datum)
  const currentWeek = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    const diff = now.getTime() - start.getTime()
    const oneWeek = 1000 * 60 * 60 * 24 * 7
    return Math.floor(diff / oneWeek) + 1
  }, [])

  // ============================================================================
  // AUTOMATISCHE METRICS-BERECHNUNG
  // ============================================================================
  // Wird automatisch ausgeführt, wenn sich scenario.inputs oder weekMultipliers ändern
  // Siehe: calculateMetrics() in financial-scenario.ts für die Berechnungslogik
  useEffect(() => {
    const updatedMetrics = calculateMetrics(scenario.inputs, currentWeek, weekMultipliers)
    setScenario((prev) => ({
      ...prev,
      metrics: updatedMetrics,
      updatedAt: new Date().toISOString(),
    }))
  }, [scenario.inputs, currentWeek, weekMultipliers])

  /**
   * Aktualisiert einen einzelnen Input-Wert
   * 
   * @param key - Der Schlüssel des Input-Feldes
   * @param value - Der neue Wert
   * 
   * Beispiel:
   * ```tsx
   * updateInput('rent', 2000)
   * updateInput('ticketPrice', 20)
   * ```
   */
  const updateInput = useCallback(<K extends keyof FinancialInputs>(
    key: K,
    value: FinancialInputs[K]
  ) => {
    setScenario((prev) => {
      const updatedInputs = { ...prev.inputs, [key]: value }
      return updateScenarioMetadata(prev, { inputs: updatedInputs })
    })
  }, [])

  /**
   * Aktualisiert mehrere Input-Werte auf einmal
   * 
   * @param updates - Objekt mit den zu aktualisierenden Input-Werten
   * 
   * Beispiel:
   * ```tsx
   * updateInputs({
   *   rent: 2000,
   *   salaries: 1800,
   *   ticketPrice: 20
   * })
   * ```
   */
  const updateInputs = useCallback((updates: Partial<FinancialInputs>) => {
    setScenario((prev) => {
      const updatedInputs = { ...prev.inputs, ...updates }
      return updateScenarioMetadata(prev, { inputs: updatedInputs })
    })
  }, [])

  /**
   * Setzt alle Inputs auf die Standard-Werte zurück
   */
  const resetToDefaults = useCallback(() => {
    setScenario((prev) =>
      updateScenarioMetadata(prev, { inputs: DEFAULT_FINANCIAL_INPUTS })
    )
  }, [])

  /**
   * Lädt ein vollständiges Szenario
   * 
   * @param newScenario - Das zu ladende Szenario
   * 
   * Wird verwendet beim Laden aus localStorage oder beim Import
   */
  const loadScenario = useCallback((newScenario: FinancialScenario) => {
    setScenario(newScenario)
  }, [])

  /**
   * Aktualisiert den Namen des Szenarios
   */
  const updateName = useCallback((name: string) => {
    setScenario((prev) => updateScenarioMetadata(prev, { name }))
  }, [])

  /**
   * Erstellt eine Kopie des aktuellen Szenarios mit neuem Namen
   */
  const duplicateScenario = useCallback((newName: string) => {
    const duplicated: FinancialScenario = {
      ...scenario,
      id: crypto.randomUUID(),
      name: newName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return duplicated
  }, [scenario])

  /**
   * Aktualisiert die Multiplikatoren für Wochen
   */
  const updateWeekMultipliers = useCallback((multipliers: number[]) => {
    if (multipliers.length === 52) {
      setWeekMultipliers(multipliers)
    }
  }, [])

  /**
   * Setzt einen Wochen-Multiplikator
   */
  const setWeekMultiplier = useCallback((weekIndex: number, multiplier: number) => {
    setWeekMultipliers((prev) => {
      const updated = [...prev]
      updated[weekIndex] = multiplier
      return updated
    })
  }, [])

  /**
   * Setzt einen Bereich von Wochen-Multiplikatoren
   */
  const setWeekRange = useCallback((start: number, end: number, multiplier: number) => {
    setWeekMultipliers((prev) => {
      const updated = [...prev]
      for (let i = start; i <= end && i < 52; i++) {
        updated[i] = multiplier
      }
      return updated
    })
  }, [])

  /**
   * Toggelt einen Wochen-Multiplikator zwischen 1.0, 0.5 und 1.2
   */
  const toggleWeekMultiplier = useCallback((weekIndex: number) => {
    setWeekMultipliers((prev) => {
      const updated = [...prev]
      if (updated[weekIndex] === 1.0) {
        updated[weekIndex] = 0.5
      } else if (updated[weekIndex] === 0.5) {
        updated[weekIndex] = 1.2
      } else {
        updated[weekIndex] = 1.0
      }
      return updated
    })
  }, [])

  return {
    // State
    scenario,
    weekMultipliers,
    currentWeek,

    // Input-Updates
    updateInput,
    updateInputs,
    resetToDefaults,

    // Szenario-Management
    loadScenario,
    updateName,
    duplicateScenario,

    // Wochen-Multiplikatoren
    updateWeekMultipliers,
    setWeekMultiplier,
    setWeekRange,
    toggleWeekMultiplier,

    // Direkter Zugriff (für Kompatibilität)
    inputs: scenario.inputs,
    metrics: scenario.metrics,
  }
}

