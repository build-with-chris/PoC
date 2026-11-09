import { parsePartialInputs, type PartialInputs } from './inputs'

/**
 * Gespeicherte Szenarien im Browser. Gespeichert werden nur die Aenderungen
 * gegenueber dem Grundstand, damit sie auch nach einem Update der
 * Grundwerte noch sinnvoll sind.
 */
const STORAGE_KEY = 'pepe-dome-szenarien-v1'

export interface SavedScenario {
  id: string
  name: string
  savedAt: string
  changes: PartialInputs
}

export function loadScenarios(): SavedScenario[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as unknown
    if (!Array.isArray(list)) return []
    return list.flatMap((item): SavedScenario[] => {
      if (!item || typeof item !== 'object') return []
      const { id, name, savedAt, changes } = item as Record<string, unknown>
      const parsed = parsePartialInputs(changes ?? {})
      if (typeof id !== 'string' || typeof name !== 'string' || !parsed.ok) return []
      return [{ id, name, savedAt: typeof savedAt === 'string' ? savedAt : '', changes: parsed.data }]
    })
  } catch {
    return []
  }
}

export function storeScenarios(list: SavedScenario[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    return true
  } catch {
    return false
  }
}

export function newId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
