import { COST_KEYS, type CostKey, type YearResult } from './model'

/**
 * Kosten in Gruppen, damit man sie auf einen Blick vergleichen kann.
 * Reihenfolge = Reihenfolge der Farben in den Diagrammen (fest, nie neu sortiert).
 */
export const COST_GROUPS = [
  { id: 'team', keys: ['coreTeam', 'partTime'] },
  { id: 'program', keys: ['artists', 'showFees', 'trainers'] },
  { id: 'venue', keys: ['heating', 'toilets', 'insurance', 'other'] },
  { id: 'outreach', keys: ['marketing', 'technology'] },
  { id: 'admin', keys: ['admin', 'loanInterest', 'reserves'] },
] as const satisfies readonly { id: string; keys: readonly CostKey[] }[]

export type CostGroupId = (typeof COST_GROUPS)[number]['id']

/** Kosten, die mit dem Programm mitwachsen (mehr Shows, mehr Kurse). Alles andere faellt sowieso an. */
export const VARIABLE_COSTS: readonly CostKey[] = ['artists', 'showFees', 'trainers']

export interface CostGroupSummary {
  id: CostGroupId
  perMonth: number
  perYear: number
  share: number
}

export function costGroups(year: YearResult): CostGroupSummary[] {
  const total = year.totalCosts
  return COST_GROUPS.map((g) => {
    const perYear = g.keys.reduce((s, k) => s + year.avgCosts[k] * 12, 0)
    return { id: g.id, perMonth: perYear / 12, perYear, share: total > 0 ? perYear / total : 0 }
  })
}

/** Kosten jedes Monats, nach Gruppen aufgeteilt (fuer gestapelte Balken). */
export function costGroupsByMonth(year: YearResult): Record<CostGroupId, number>[] {
  return year.months.map(
    (m) =>
      Object.fromEntries(COST_GROUPS.map((g) => [g.id, g.keys.reduce((s, k) => s + m.costs[k], 0)])) as Record<
        CostGroupId,
        number
      >,
  )
}

export function fixedAndVariable(year: YearResult) {
  const variable = VARIABLE_COSTS.reduce((s, k) => s + year.avgCosts[k], 0)
  return { variable, fixed: year.avgMonthlyCosts - variable }
}

// Jede Kostenart steckt in genau einer Gruppe; sonst wuerde sie in den Diagrammen fehlen
const grouped = COST_GROUPS.flatMap((g) => g.keys as readonly CostKey[])
if (grouped.length !== COST_KEYS.length || COST_KEYS.some((k) => !grouped.includes(k))) {
  throw new Error('COST_GROUPS deckt nicht alle Kostenarten ab')
}
