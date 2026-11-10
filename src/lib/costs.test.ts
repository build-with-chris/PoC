import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculateYear } from './model'
import { EXAMPLE_INPUTS } from './inputs'
import { costGroups, costGroupsByMonth, fixedAndVariable } from './costs'

const year = calculateYear(EXAMPLE_INPUTS)

test('Gruppen ergeben zusammen die Gesamtkosten', () => {
  const groups = costGroups(year)
  const sum = groups.reduce((s, g) => s + g.perYear, 0)
  assert.ok(Math.abs(sum - year.totalCosts) < 1e-6)
  assert.ok(Math.abs(groups.reduce((s, g) => s + g.share, 0) - 1) < 1e-9)
})

test('Monatswerte je Gruppe ergeben die Monatskosten', () => {
  costGroupsByMonth(year).forEach((m, i) => {
    const sum = Object.values(m).reduce((a, b) => a + b, 0)
    assert.ok(Math.abs(sum - year.months[i].totalCosts) < 1e-6)
  })
})

test('Feste und veraenderliche Kosten ergeben die Monatskosten', () => {
  const { fixed, variable } = fixedAndVariable(year)
  assert.ok(Math.abs(fixed + variable - year.avgMonthlyCosts) < 1e-6)
})
