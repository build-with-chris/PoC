import { test } from 'node:test'
import assert from 'node:assert/strict'
import { breakEvenValue, calculateYear, perShow, WEEKS_PER_MONTH, type Inputs } from './model'
import { EXAMPLE_INPUTS, diffInputs, mergeInputs, parsePartialInputs } from './inputs'
import { applyPreset } from './presets'
import { decodeScenario, encodeScenario } from './share'

const empty: Inputs = {
  ...Object.fromEntries(Object.keys(EXAMPLE_INPUTS).map((k) => [k, 0])),
  activity: Array(12).fill(100),
  winterMonths: Array(12).fill(false),
} as Inputs

test('eine Show: Gaeste mal (Ticket plus Cafe) minus Gage und Gebuehren', () => {
  const s = perShow({ ...empty, guestsPerShow: 100, ticketPrice: 20, cafeProfitPerGuest: 2, artistFeePerShow: 1000, gemaPerShow: 50, kvrPerShow: 50 })
  assert.equal(s.result, 100 * 22 - 1100)
})

test('Kurse rechnen mit 52/12 Wochen pro Monat', () => {
  const y = calculateYear({ ...empty, coursesPerWeek: 3, participantsPerCourse: 10, pricePerParticipant: 10 })
  assert.ok(Math.abs(y.months[0].revenue.courses - 3 * WEEKS_PER_MONTH * 100) < 1e-9)
  assert.ok(Math.abs(y.totalRevenue - 3 * 52 * 100) < 1e-6)
})

test('Heizung nur in Wintermonaten, Saison halbiert Shows', () => {
  const winter = Array(12).fill(false)
  winter[10] = true
  const activity = Array(12).fill(100)
  activity[5] = 50
  const y = calculateYear({ ...empty, heatingPerWinterMonth: 1000, showsPerMonth: 4, artistFeePerShow: 100, winterMonths: winter, activity })
  assert.equal(y.months[10].costs.heating, 1000)
  assert.equal(y.months[0].costs.heating, 0)
  assert.equal(y.months[5].costs.artists, 200)
  assert.equal(y.months[0].costs.artists, 400)
})

test('Cafe: im Sommer taeglich offen, im Winter nur an Showtagen', () => {
  const winter = Array(12).fill(false)
  winter[9] = true
  const y = calculateYear({ ...empty, cafeDaysPerWeek: 3, cafeProfitPerDay: 100, cafeProfitPerGuest: 2, showsPerMonth: 1, guestsPerShow: 50, winterMonths: winter })
  assert.equal(y.months[9].revenue.cafe, 100)
  assert.equal(y.months[9].revenue.cafeDays, 0)
  assert.equal(y.months[0].revenue.cafe, 100)
  assert.ok(Math.abs(y.months[0].revenue.cafeDays - 3 * WEEKS_PER_MONTH * 100) < 1e-9)
})

test('Kernteam: Personen mal Gehalt, Veranstaltungsversicherung anteilig pro Monat', () => {
  const y = calculateYear({ ...empty, coreTeamCount: 2, salaryPerPerson: 1500, eventInsurancePerYear: 600, insurancePerMonth: 100 })
  assert.equal(y.months[0].costs.coreTeam, 3000)
  assert.equal(y.months[0].costs.insurance, 150)
})

test('Kontostand: Start plus Kredit minus Anschaffungen, dann Monat fuer Monat', () => {
  const y = calculateYear({ ...empty, startingCash: 500, oneOffFunding: 500, loanAmount: 5000, initialExpenses: 2000, partTimePerMonth: 500, liquidityBuffer: 2000 })
  assert.equal(y.startBalance, 4000)
  assert.equal(y.months[0].balance, 3500)
  assert.equal(y.endBalance, 4000 - 12 * 500)
  assert.equal(y.firstMonthBelowBuffer, 4)
  assert.equal(y.firstMonthBelowZero, 8)
})

test('Break-even: so viele Gaeste, dass das Jahr bei null landet', () => {
  const i = { ...EXAMPLE_INPUTS }
  const guests = breakEvenValue(i, 'guestsPerShow')
  assert.ok(guests !== null)
  const y = calculateYear({ ...i, guestsPerShow: guests! })
  assert.ok(Math.abs(y.yearResult) < 1e-6)
})

test('Break-even gibt null, wenn die Stellschraube nicht hilft', () => {
  assert.equal(breakEvenValue({ ...empty, partTimePerMonth: 100 }, 'guestsPerShow'), null)
})

test('Link: nur Aenderungen, hin und zurueck gleich', () => {
  const changed = applyPreset('weakWinter', EXAMPLE_INPUTS)
  const diff = diffInputs(EXAMPLE_INPUTS, { ...changed, guestsPerShow: 120 })
  assert.deepEqual(Object.keys(diff).sort(), ['activity', 'guestsPerShow'])
  const decoded = decodeScenario(encodeScenario({ name: 'Wintertest äöü', changes: diff }))
  assert.equal(decoded?.name, 'Wintertest äöü')
  assert.deepEqual(mergeInputs(EXAMPLE_INPUTS, decoded!.changes), { ...changed, guestsPerShow: 120 })
})

test('Unbekannte Felder in Umgebungsvariable oder Link werden abgelehnt', () => {
  assert.equal(parsePartialInputs({ gibtsNicht: 1 }).ok, false)
  assert.equal(parsePartialInputs({ activity: [100] }).ok, false)
  assert.equal(parsePartialInputs({ ticketPrice: 18 }).ok, true)
})
