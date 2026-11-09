import { applyPreset, type PresetId } from './presets'
import type { Inputs, YearResult } from './model'

/**
 * Aufgaben: Eine Vorlage als Start, eine Regel, die gilt, und ein Ziel.
 * Texte stehen in den Sprachdateien unter missions.<id>.
 */
export const MISSION_IDS = ['noFunding', 'weakWinter', 'firstYear'] as const
export type MissionId = (typeof MISSION_IDS)[number]

export const MISSION_PRESET: Record<MissionId, PresetId> = {
  noFunding: 'noFunding',
  weakWinter: 'weakWinter',
  firstYear: 'firstYear',
}

const sameSeason = (a: Inputs, b: Inputs) => a.activity.every((v, i) => v === b.activity[i])

/** Wird die Regel der Aufgabe eingehalten? */
export function ruleKept(id: MissionId, inputs: Inputs, base: Inputs): boolean {
  const start = applyPreset(MISSION_PRESET[id], base)
  if (id === 'noFunding') return inputs.fundingPerMonth === 0
  return sameSeason(inputs, start)
}

/** Ist das Ziel erreicht? */
export function goalReached(id: MissionId, year: YearResult): boolean {
  if (id === 'noFunding') return year.yearResult >= 0
  if (id === 'weakWinter') return year.firstMonthBelowBuffer === null
  return year.firstMonthBelowZero === null
}
