/**
 * ============================================================================
 * SZENARIO-STORAGE UTILITIES
 * ============================================================================
 * 
 * Diese Funktionen verwalten das Speichern und Laden von FinancialScenario
 * im Browser-localStorage.
 * 
 * Speicherformat:
 *   - Alle Szenarien werden als Array in einem einzigen localStorage-Key gespeichert
 *   - Key: 'financialCalculator.scenarios'
 *   - Format: JSON-Array von FinancialScenario-Objekten
 * 
 * Datenfluss beim Speichern:
 *   1. loadScenarios() lädt alle vorhandenen Szenarien
 *   2. Neues/aktualisiertes Szenario wird zum Array hinzugefügt/ersetzt
 *   3. Array wird als JSON in localStorage gespeichert
 * 
 * Datenfluss beim Laden:
 *   1. localStorage.getItem() holt JSON-String
 *   2. JSON.parse() konvertiert zu Array
 *   3. Array wird nach updatedAt sortiert (neueste zuerst)
 * 
 * Fehlerbehandlung:
 *   - Alle Funktionen haben try/catch für robustes Fehlerhandling
 *   - Bei Fehlern wird ein leeres Array zurückgegeben (keine App-Crashes)
 * 
 * ============================================================================
 */

import { FinancialScenario } from '@/types/financial-scenario'

const STORAGE_KEY = 'financialCalculator.scenarios'

/**
 * Lädt alle gespeicherten Szenarien aus localStorage
 * 
 * @returns Array aller gespeicherten Szenarien, oder leeres Array falls keine vorhanden
 */
export function loadScenarios(): FinancialScenario[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []

    const scenarios = JSON.parse(data) as FinancialScenario[]
    
    // Validiere, dass es ein Array ist
    if (!Array.isArray(scenarios)) {
      console.warn('Ungültiges Format in localStorage, setze zurück auf leeres Array')
      localStorage.removeItem(STORAGE_KEY)
      return []
    }

    // Sortiere nach updatedAt (neueste zuerst)
    return scenarios.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  } catch (error) {
    console.error('Fehler beim Laden der Szenarien:', error)
    // Bei Fehler: Lösche den fehlerhaften Eintrag und gib leeres Array zurück
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignoriere Fehler beim Löschen
    }
    return []
  }
}

/**
 * Speichert ein Szenario im localStorage
 * 
 * Wenn ein Szenario mit gleicher ID existiert, wird es aktualisiert (Update).
 * Ansonsten wird ein neues Szenario hinzugefügt.
 * 
 * @param scenario - Das zu speichernde Szenario
 * @returns true wenn erfolgreich, false bei Fehler
 */
export function saveScenario(scenario: FinancialScenario): boolean {
  try {
    const scenarios = loadScenarios()
    
    // Prüfe, ob ein Szenario mit dieser ID bereits existiert
    const existingIndex = scenarios.findIndex((s) => s.id === scenario.id)
    
    if (existingIndex >= 0) {
      // Update: Ersetze das existierende Szenario
      scenarios[existingIndex] = {
        ...scenario,
        updatedAt: new Date().toISOString(),
      }
    } else {
      // Neu: Füge das Szenario hinzu
      scenarios.push({
        ...scenario,
        createdAt: scenario.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    // Speichere das aktualisierte Array
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios))
    return true
  } catch (error) {
    console.error('Fehler beim Speichern des Szenarios:', error)
    return false
  }
}

/**
 * Löscht ein Szenario aus dem localStorage
 * 
 * @param id - Die ID des zu löschenden Szenarios
 * @returns true wenn erfolgreich, false bei Fehler
 */
export function deleteScenario(id: string): boolean {
  try {
    const scenarios = loadScenarios()
    const filtered = scenarios.filter((s) => s.id !== id)
    
    // Speichere das aktualisierte Array
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Fehler beim Löschen des Szenarios:', error)
    return false
  }
}

/**
 * Exportiert ein Szenario als JSON-String
 * 
 * @param scenario - Das zu exportierende Szenario
 * @returns JSON-String
 */
export function exportScenarioAsJSON(scenario: FinancialScenario): string {
  return JSON.stringify(scenario, null, 2)
}

/**
 * Importiert ein Szenario aus einem JSON-String
 * 
 * @param json - Der JSON-String
 * @returns Das importierte Szenario oder null bei Fehler
 */
export function importScenarioFromJSON(json: string): FinancialScenario | null {
  try {
    const scenario = JSON.parse(json) as FinancialScenario

    // Validiere die Struktur
    if (!scenario.inputs || !scenario.metrics) {
      throw new Error('Ungültige Szenario-Struktur')
    }

    // Generiere neue ID und Timestamps für importiertes Szenario
    const now = new Date().toISOString()
    return {
      ...scenario,
      id: crypto.randomUUID(),
      name: scenario.name || 'Importiertes Szenario',
      createdAt: now,
      updatedAt: now,
    }
  } catch (error) {
    console.error('Fehler beim Importieren des Szenarios:', error)
    return null
  }
}

/**
 * Erstellt einen Download-Link für ein Szenario
 * 
 * @param scenario - Das zu exportierende Szenario
 * @param filename - Optionaler Dateiname (ohne Extension)
 */
export function downloadScenarioAsFile(scenario: FinancialScenario, filename?: string): void {
  const json = exportScenarioAsJSON(scenario)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename ? `${filename}.json` : `scenario-${scenario.name}-${scenario.id}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Lädt ein Szenario aus einer Datei
 * 
 * @param file - Die Datei (File-Objekt)
 * @returns Promise mit dem geladenen Szenario oder null bei Fehler
 */
export async function loadScenarioFromFile(file: File): Promise<FinancialScenario | null> {
  try {
    const text = await file.text()
    return importScenarioFromJSON(text)
  } catch (error) {
    console.error('Fehler beim Laden der Datei:', error)
    return null
  }
}
