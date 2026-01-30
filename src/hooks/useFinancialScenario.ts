'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FinancialScenario,
  FinancialInputs,
  FinancialMetrics,
  createFinancialScenario,
  calculateMetrics,
  updateScenarioMetadata,
  migrateScenario,
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
  // 1.0 = normal, 0.5 = schwach, 1.2 = stark, 0 = ausgeschlossen
  const [weekMultipliers, setWeekMultipliers] = useState<number[]>(() =>
    Array(52).fill(1.0)
  )

  // Separate Multiplikatoren für Ausgaben (52 Wochen)
  // Standardmäßig gleich wie weekMultipliers, aber manuell änderbar
  const [costMultipliers, setCostMultipliers] = useState<number[]>(() =>
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
  // Wird automatisch ausgeführt, wenn sich scenario.inputs, weekMultipliers oder costMultipliers ändern
  // Siehe: calculateMetrics() in financial-scenario.ts für die Berechnungslogik
  useEffect(() => {
    const updatedMetrics = calculateMetrics(scenario.inputs, currentWeek, weekMultipliers, costMultipliers)
    setScenario((prev) => ({
      ...prev,
      metrics: updatedMetrics,
      updatedAt: new Date().toISOString(),
    }))
  }, [scenario.inputs, currentWeek, weekMultipliers, costMultipliers])

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
   * Migriert automatisch alte Szenarien auf die aktuelle Struktur
   */
  const loadScenario = useCallback((newScenario: FinancialScenario) => {
    // Migriere das Szenario, um sicherzustellen, dass alle Felder vorhanden sind
    const migrated = migrateScenario(newScenario)
    setScenario(migrated)
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
   * Toggelt einen Wochen-Multiplikator zwischen 0 (ausgeschlossen), 0.5, 1.0 und 1.2
   * Synchronisiert automatisch die costMultipliers, wenn eine Woche ausgeschlossen wird
   */
  const toggleWeekMultiplier = useCallback((weekIndex: number) => {
    setWeekMultipliers((prev) => {
      const updated = [...prev]
      const current = updated[weekIndex]
      // Zyklus: 0 (ausgeschlossen) → 0.5 (schwach) → 1.0 (normal) → 1.2 (stark) → 0
      let newValue: number
      if (current === 0) {
        newValue = 0.5
      } else if (current === 0.5 || (current > 0 && current < 1.0)) {
        newValue = 1.0
      } else if (current === 1.0) {
        newValue = 1.2
      } else {
        newValue = 0 // Von 1.2 oder anderen Werten zurück zu 0
      }
      updated[weekIndex] = newValue
      
      // Wenn Woche ausgeschlossen wird (0), setze auch costMultiplier auf 0
      // Wenn Woche wieder aktiviert wird, synchronisiere costMultiplier mit weekMultiplier
      if (newValue === 0) {
        setCostMultipliers((prevCosts) => {
          const updatedCosts = [...prevCosts]
          updatedCosts[weekIndex] = 0
          return updatedCosts
        })
      } else {
        // Synchronisiere costMultiplier mit weekMultiplier, wenn Woche aktiviert wird
        setCostMultipliers((prevCosts) => {
          const updatedCosts = [...prevCosts]
          // Nur synchronisieren, wenn costMultiplier aktuell 0 ist (also noch nicht manuell angepasst)
          if (updatedCosts[weekIndex] === 0) {
            updatedCosts[weekIndex] = newValue
          }
          return updatedCosts
        })
      }
      
      return updated
    })
  }, [])

  /**
   * Setzt einen Wochen-Multiplikator auf einen manuellen Wert (0-200%)
   */
  const setWeekMultiplierManually = useCallback((weekIndex: number, value: number) => {
    // Begrenze auf 0-2.0 (0-200%)
    const clampedValue = Math.max(0, Math.min(2.0, value))
    setWeekMultipliers((prev) => {
      const updated = [...prev]
      updated[weekIndex] = clampedValue
      
      // Wenn Woche ausgeschlossen wird (0), setze auch costMultiplier auf 0
      if (clampedValue === 0) {
        setCostMultipliers((prevCosts) => {
          const updatedCosts = [...prevCosts]
          updatedCosts[weekIndex] = 0
          return updatedCosts
        })
      }
      
      return updated
    })
  }, [])

  /**
   * Setzt einen Kosten-Multiplikator auf einen manuellen Wert (0-200%)
   */
  const setCostMultiplierManually = useCallback((weekIndex: number, value: number) => {
    // Begrenze auf 0-2.0 (0-200%)
    const clampedValue = Math.max(0, Math.min(2.0, value))
    setCostMultipliers((prev) => {
      const updated = [...prev]
      updated[weekIndex] = clampedValue
      return updated
    })
  }, [])

  /**
   * Toggelt einen Kosten-Multiplikator zwischen 0 (ausgeschlossen), 0.5, 1.0 und 1.2
   */
  const toggleCostMultiplier = useCallback((weekIndex: number) => {
    setCostMultipliers((prev) => {
      const updated = [...prev]
      const current = updated[weekIndex]
      // Zyklus: 0 (ausgeschlossen) → 0.5 (schwach) → 1.0 (normal) → 1.2 (stark) → 0
      if (current === 0) {
        updated[weekIndex] = 0.5
      } else if (current === 0.5 || (current > 0 && current < 1.0)) {
        updated[weekIndex] = 1.0
      } else if (current === 1.0) {
        updated[weekIndex] = 1.2
      } else {
        updated[weekIndex] = 0 // Von 1.2 oder anderen Werten zurück zu 0
      }
      return updated
    })
  }, [])

  return {
    // State
    scenario,
    weekMultipliers,
    costMultipliers,
    currentWeek,

    // Input-Updates
    updateInput,
    updateInputs,
    resetToDefaults,

    // Szenario-Management
    loadScenario,
    updateName,
    duplicateScenario,

    // Wochen-Multiplikatoren (Einnahmen)
    updateWeekMultipliers,
    setWeekMultiplier,
    setWeekMultiplierManually,
    setWeekRange,
    toggleWeekMultiplier,

    // Kosten-Multiplikatoren (Ausgaben)
    setCostMultiplierManually,
    toggleCostMultiplier,
    updateCostMultipliers: (multipliers: number[]) => {
      if (multipliers.length === 52) {
        setCostMultipliers(multipliers)
      }
    },

    // Direkter Zugriff (für Kompatibilität)
    inputs: scenario.inputs,
    metrics: scenario.metrics,
  }
}

