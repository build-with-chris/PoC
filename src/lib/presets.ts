import { SEATS, type Inputs } from './model'

/**
 * Szenario-Vorlagen. Sie veraendern die Grundwerte relativ, damit keine
 * eigenen Zahlen im Code stehen. Texte stehen in den Sprachdateien unter
 * presets.<id>.
 */
export const PRESET_IDS = ['plan', 'goodYear', 'weakWinter', 'noFunding', 'firstYear'] as const
export type PresetId = (typeof PRESET_IDS)[number]

// Index 0 = Maerz
const WINTER_SLUMP = [8, 9, 10, 11] // November bis Februar
const RAMP_UP = [40, 50, 60, 70, 80] // Maerz bis Juli

export function applyPreset(id: PresetId, base: Inputs): Inputs {
  switch (id) {
    case 'plan':
      return base
    case 'goodYear':
      return {
        ...base,
        guestsPerShow: Math.min(SEATS, Math.round(base.guestsPerShow * 1.2)),
        participantsPerCourse: Math.round(base.participantsPerCourse * 1.2),
      }
    case 'weakWinter':
      return {
        ...base,
        activity: base.activity.map((a, idx) => (WINTER_SLUMP.includes(idx) ? Math.round(a * 0.5) : a)),
      }
    case 'noFunding':
      return { ...base, fundingPerMonth: 0 }
    case 'firstYear':
      return {
        ...base,
        activity: base.activity.map((a, idx) => (idx < RAMP_UP.length ? Math.min(a, RAMP_UP[idx]) : a)),
      }
  }
}
