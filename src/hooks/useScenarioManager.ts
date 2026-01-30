'use client'

import { useState, useEffect, useCallback } from 'react'
import { FinancialScenario, createFinancialScenario, calculateMetrics, migrateScenario } from '@/types/financial-scenario'
import { loadScenarios, saveScenario, deleteScenario } from '@/utils/scenario-storage'

/**
 * ============================================================================
 * SZENARIO-MANAGER HOOK
 * ============================================================================
 * 
 * Hook für die Verwaltung mehrerer gespeicherter Szenarien
 * 
 * Funktionalität:
 *   - Lädt alle gespeicherten Szenarien beim Initialisieren aus localStorage
 *   - Verwaltet die Liste der Szenarien (scenarios State)
 *   - Verwaltet das aktuell ausgewählte Szenario (currentScenario State)
 *   - Bietet Funktionen zum Speichern, Laden und Löschen
 * 
 * localStorage-Integration:
 *   - Beim Initialisieren: loadScenarios() lädt alle Szenarien
 *   - Beim Speichern: saveScenario() → localStorage.setItem()
 *   - Beim Löschen: deleteScenario() → Array filtern → localStorage.setItem()
 * 
 * Verwendung:
 * ```tsx
 * const {
 *   scenarios,
 *   currentScenario,
 *   saveCurrentScenario,
 *   loadScenarioById,
 *   deleteScenarioById,
 * } = useScenarioManager()
 * ```
 * 
 * ============================================================================
 */
export function useScenarioManager() {
  const [scenarios, setScenarios] = useState<FinancialScenario[]>([])
  const [currentScenario, setCurrentScenario] = useState<FinancialScenario | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Lade alle Szenarien beim Initialisieren
  useEffect(() => {
    const loaded = loadScenarios()
    // Migriere alle geladenen Szenarien, um sicherzustellen, dass sie die aktuelle Struktur haben
    const migrated = loaded.map(migrateScenario)
    setScenarios(migrated)
    setIsLoading(false)
  }, [])

  /**
   * Speichert das aktuelle Szenario
   * 
   * @param scenario - Das zu speichernde Szenario
   * @param name - Optional: Name für neues Szenario (wird nur verwendet, wenn scenario keine ID hat)
   * @returns true wenn erfolgreich
   */
  const saveCurrentScenario = useCallback((scenario: FinancialScenario, name?: string): boolean => {
    // Wenn keine ID vorhanden, erstelle eine neue
    let scenarioToSave = scenario
    
    if (!scenarioToSave.id) {
      const scenarioName = name || prompt('Bitte gib einen Namen für diese Konfiguration ein:')
      if (!scenarioName || scenarioName.trim() === '') {
        return false // Benutzer hat abgebrochen oder keinen Namen eingegeben
      }
      
      scenarioToSave = {
        ...scenarioToSave,
        id: crypto.randomUUID(),
        name: scenarioName.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    } else {
      // Update: Aktualisiere updatedAt
      scenarioToSave = {
        ...scenarioToSave,
        updatedAt: new Date().toISOString(),
      }
    }

    // Speichere im localStorage
    const success = saveScenario(scenarioToSave)
    if (success) {
      // Aktualisiere die Liste
      const updated = loadScenarios()
      setScenarios(updated)
      setCurrentScenario(scenarioToSave)
    }
    return success
  }, [])

  /**
   * Lädt ein Szenario nach ID
   * 
   * @param id - Die ID des zu ladenden Szenarios
   * @returns Das geladene Szenario oder null
   */
  const loadScenarioById = useCallback((id: string): FinancialScenario | null => {
    const scenario = scenarios.find((s) => s.id === id)
    if (scenario) {
      // Migriere das Szenario, um sicherzustellen, dass alle Felder vorhanden sind
      const migrated = migrateScenario(scenario)
      setCurrentScenario(migrated)
      return migrated
    }
    return null
  }, [scenarios])

  /**
   * Löscht ein Szenario nach ID
   * 
   * @param id - Die ID des zu löschenden Szenarios
   * @returns true wenn erfolgreich
   */
  const deleteScenarioById = useCallback((id: string): boolean => {
    const success = deleteScenario(id)
    if (success) {
      // Aktualisiere die Liste
      const updated = loadScenarios()
      setScenarios(updated)
      
      // Wenn das gelöschte Szenario das aktuelle war, setze currentScenario auf null
      if (currentScenario?.id === id) {
        setCurrentScenario(null)
      }
    }
    return success
  }, [currentScenario])

  /**
   * Erstellt ein neues, leeres Szenario
   */
  const createNewScenario = useCallback((name: string = 'Neues Szenario') => {
    const newScenario = createFinancialScenario(name)
    setCurrentScenario(newScenario)
    return newScenario
  }, [])

  /**
   * Aktualisiert den Namen eines Szenarios
   */
  const updateScenarioName = useCallback((id: string, newName: string): boolean => {
    const scenario = scenarios.find((s) => s.id === id)
    if (scenario) {
      const updated: FinancialScenario = {
        ...scenario,
        name: newName,
        updatedAt: new Date().toISOString(),
      }
      const success = saveScenario(updated)
      if (success) {
        const updatedList = loadScenarios()
        setScenarios(updatedList)
        if (currentScenario?.id === id) {
          setCurrentScenario(updated)
        }
      }
      return success
    }
    return false
  }, [scenarios, currentScenario])

  return {
    scenarios,
    currentScenario,
    isLoading,
    setCurrentScenario,
    saveCurrentScenario,
    loadScenarioById,
    deleteScenarioById,
    createNewScenario,
    updateScenarioName,
    refreshScenarios: () => {
      const updated = loadScenarios()
      setScenarios(updated)
    },
  }
}

