import { test } from 'node:test'
import assert from 'node:assert/strict'
import { breakEvenValue, calculateYear, perShow, WEEKS_PER_MONTH, type Inputs } from './model'
import { EXAMPLE_INPUTS, diffInputs, mergeInputs, parsePartialInputs } from './inputs'
import { applyPreset } from './presets'
import { decodeScenario, encodeScenario } from './share'

const empty: Inputs = {
  ...Object.fromEntries(Object.keys(EXAMPLE_INPUTS).map((k) => [k, 0])),
  startMonth: 3,
  activity: Array(12).fill(100),
  winterMonths: Array(12).fill(false),
  monthPlan: Array.from({ length: 12 }, () => ({})),
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

test('Fest geplanter Monat ueberschreibt Shows, Gaeste und Vermietungen', () => {
  const monthPlan = Array.from({ length: 12 }, () => ({})) as Inputs['monthPlan']
  monthPlan[1] = { shows: 3, guests: 25, rentals: 1 }
  const activity = Array(12).fill(100)
  activity[2] = 0
  const y = calculateYear({ ...empty, showsPerMonth: 4, guestsPerShow: 60, ticketPrice: 10, artistFeePerShow: 100, rentalsPerMonth: 5, rentalPrice: 200, monthPlan, activity })
  assert.equal(y.months[1].revenue.tickets, 3 * 25 * 10)
  assert.equal(y.months[1].costs.artists, 300)
  assert.equal(y.months[1].revenue.rentals, 200)
  assert.equal(y.months[0].revenue.tickets, 4 * 60 * 10)
  assert.equal(y.months[2].revenue.tickets, 0)
})

test('Dauermieter laufen auch in Pausenmonaten', () => {
  const activity = Array(12).fill(0)
  const y = calculateYear({ ...empty, fixedRentPerMonth: 250, rentalHoursPerWeek: 4, rentalPricePerHour: 45, activity })
  assert.ok(Math.abs(y.months[0].revenue.fixedRent - (250 + 4 * WEEKS_PER_MONTH * 45)) < 1e-9)
})

test('Startmonat verschiebt die Kalendermonate', () => {
  const y = calculateYear({ ...empty, startMonth: 11 })
  assert.equal(y.months[0].calendarMonth, 10)
  assert.equal(y.months[2].calendarMonth, 0)
})

test('Trainer: pro Person bezahlt, aber nie mehr als die Obergrenze', () => {
  const base = { ...empty, coursesPerWeek: 1, pricePerParticipant: 20, trainerPerParticipant: 15, trainerCapPerCourse: 70 }
  const sessions = WEEKS_PER_MONTH
  assert.ok(Math.abs(calculateYear({ ...base, participantsPerCourse: 3 }).months[0].costs.trainers - 45 * sessions) < 1e-9)
  assert.ok(Math.abs(calculateYear({ ...base, participantsPerCourse: 9 }).months[0].costs.trainers - 70 * sessions) < 1e-9)
})

test('Break-even findet den Nullpunkt auch mit Obergrenze beim Trainer', () => {
  const i = { ...empty, coursesPerWeek: 1, pricePerParticipant: 20, trainerPerParticipant: 15, trainerCapPerCourse: 70, partTimePerMonth: 200 }
  const p = breakEvenValue(i, 'participantsPerCourse')
  assert.ok(p !== null)
  assert.ok(Math.abs(calculateYear({ ...i, participantsPerCourse: p! }).yearResult) < 1e-3)
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
