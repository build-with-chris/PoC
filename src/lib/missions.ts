import { applyPreset, type PresetId } from './presets'
import type { Inputs, YearResult } from './model'

/**
 * Aufgaben: Eine Vorlage als Start, eine Regel, die gilt, und ein Ziel.
 * Texte stehen in den Sprachdateien unter missions.<id>.
 */
export const MISSION_IDS = ['livingWage', 'safetyWork', 'noFunding', 'weakWinter'] as const
export type MissionId = (typeof MISSION_IDS)[number]

export const MISSION_PRESET: Record<MissionId, PresetId> = {
  livingWage: 'livingWage',
  safetyWork: 'plan',
  noFunding: 'noFunding',
  weakWinter: 'weakWinter',
}

const sameSeason = (a: Inputs, b: Inputs) => a.activity.every((v, i) => v === b.activity[i])

/** Wird die Regel der Aufgabe eingehalten? */
export function ruleKept(id: MissionId, inputs: Inputs, base: Inputs): boolean {
  const start = applyPreset(MISSION_PRESET[id], base)
  switch (id) {
    case 'livingWage':
      return inputs.salaryPerPerson >= base.livingSalaryTarget && inputs.coreTeamCount >= base.coreTeamCount
    case 'safetyWork':
      return inputs.initialExpenses >= base.initialExpenses
    case 'noFunding':
      return inputs.fundingPerMonth === 0
    case 'weakWinter':
      return sameSeason(inputs, start)
  }
}

/** Ist das Ziel erreicht? */
export function goalReached(id: MissionId, year: YearResult): boolean {
  switch (id) {
    case 'livingWage':
    case 'noFunding':
      return year.yearResult >= 0
    case 'safetyWork':
      return year.firstMonthBelowZero === null
    case 'weakWinter':
      return year.firstMonthBelowBuffer === null
  }
}
