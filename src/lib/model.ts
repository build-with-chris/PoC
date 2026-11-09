/**
 * Rechenkern des Pepe Dome Finanzreglers.
 *
 * Reine Funktionen ohne React und ohne Zugriff auf Umgebungsvariablen,
 * damit sie im Browser, auf dem Server und in Tests gleich laufen.
 *
 * Grundsaetze:
 * - Alle Betraege sind netto, also ohne Mehrwertsteuer.
 * - Das Planungsjahr laeuft von Maerz bis Februar (12 Monate).
 * - Die Saison (activity) skaliert alles, was vom Betrieb abhaengt:
 *   Shows, Kurse, Workshops und Vermietungen. Feste Einnahmen und Kosten
 *   bleiben jeden Monat gleich. Heizkosten fallen nur in Wintermonaten an.
 */

/** Kalendermonat, mit dem das Planungsjahr beginnt (0 = Januar, 2 = Maerz). */
export const PLANNING_START_MONTH = 2
export const MONTH_COUNT = 12
/** Durchschnittliche Wochen pro Monat (52 / 12). */
export const WEEKS_PER_MONTH = 52 / 12
/** Sitzplaetze im Dome. */
export const SEATS = 170

export interface Inputs {
  // Shows
  showsPerMonth: number
  guestsPerShow: number
  ticketPrice: number
  cafeProfitPerGuest: number
  artistFeePerShow: number
  gemaPerShow: number
  kvrPerShow: number
  // Kurse
  coursesPerWeek: number
  participantsPerCourse: number
  pricePerParticipant: number
  trainerCostPerCourse: number
  // Workshops
  workshopsPerMonth: number
  participantsPerWorkshop: number
  profitPerWorkshopParticipant: number
  // Weitere Einnahmen
  profiTrainingPerMonth: number
  fundingPerMonth: number
  rentalsPerMonth: number
  rentalPrice: number
  members: number
  memberFeePerYear: number
  // Laufende Kosten pro Monat
  personnelPerMonth: number
  insurancePerMonth: number
  toiletsPerMonth: number
  marketingPerMonth: number
  technologyPerMonth: number
  otherCostsPerMonth: number
  heatingPerWinterMonth: number
  reservesPerMonth: number
  // Kosten pro Jahr
  taxAdvisorPerYear: number
  annualReportPerYear: number
  bookkeepingPerYear: number
  payrollPerYear: number
  // Start, Kredit, Polster
  startingCash: number
  loanAmount: number
  loanInterestRate: number
  initialExpenses: number
  liquidityBuffer: number
  // Saison: 12 Eintraege, Index 0 = Maerz
  activity: number[]
  winterMonths: boolean[]
}

export type NumberKey = {
  [K in keyof Inputs]: Inputs[K] extends number ? K : never
}[keyof Inputs]

export const REVENUE_KEYS = [
  'tickets',
  'cafe',
  'courses',
  'workshops',
  'rentals',
  'profiTraining',
  'funding',
  'members',
] as const
export type RevenueKey = (typeof REVENUE_KEYS)[number]

export const COST_KEYS = [
  'artists',
  'showFees',
  'trainers',
  'personnel',
  'heating',
  'toilets',
  'insurance',
  'marketing',
  'technology',
  'other',
  'admin',
  'loanInterest',
  'reserves',
] as const
export type CostKey = (typeof COST_KEYS)[number]

export interface MonthResult {
  /** 0 = erster Monat des Planungsjahres (Maerz) */
  index: number
  /** Kalendermonat 0 bis 11 */
  calendarMonth: number
  activity: number
  isWinter: boolean
  revenue: Record<RevenueKey, number>
  costs: Record<CostKey, number>
  totalRevenue: number
  totalCosts: number
  result: number
  /** Kontostand am Monatsende */
  balance: number
}

export interface YearResult {
  months: MonthResult[]
  totalRevenue: number
  totalCosts: number
  yearResult: number
  avgMonthlyRevenue: number
  avgMonthlyCosts: number
  avgMonthlyResult: number
  avgRevenue: Record<RevenueKey, number>
  avgCosts: Record<CostKey, number>
  startBalance: number
  endBalance: number
  lowestBalance: number
  lowestBalanceMonth: number
  /** Erster Monat, in dem der Kontostand unter das Polster faellt, sonst null */
  firstMonthBelowBuffer: number | null
  /** Erster Monat, in dem der Kontostand unter null faellt, sonst null */
  firstMonthBelowZero: number | null
}

const zeroRecord = <K extends string>(keys: readonly K[]) =>
  Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>

/** Was eine einzelne Show unterm Strich bringt (vor festen Kosten). */
export function perShow(i: Inputs) {
  const income = i.guestsPerShow * (i.ticketPrice + i.cafeProfitPerGuest)
  const costs = i.artistFeePerShow + i.gemaPerShow + i.kvrPerShow
  return { income, costs, result: income - costs }
}

/** Was ein einzelner Kurstermin unterm Strich bringt. */
export function perCourse(i: Inputs) {
  const income = i.participantsPerCourse * i.pricePerParticipant
  const costs = i.trainerCostPerCourse
  return { income, costs, result: income - costs }
}

/** Kosten, die jeden Monat gleich anfallen, egal ob gespielt wird. */
export function fixedMonthlyCosts(i: Inputs) {
  return (
    i.personnelPerMonth +
    i.insurancePerMonth +
    i.toiletsPerMonth +
    i.marketingPerMonth +
    i.technologyPerMonth +
    i.otherCostsPerMonth +
    i.reservesPerMonth +
    annualCosts(i) / 12 +
    loanInterestPerYear(i) / 12
  )
}

export function annualCosts(i: Inputs) {
  return i.taxAdvisorPerYear + i.annualReportPerYear + i.bookkeepingPerYear + i.payrollPerYear
}

/** Im ersten Jahr wird nur Zins gezahlt, noch keine Tilgung. */
export function loanInterestPerYear(i: Inputs) {
  return (i.loanAmount * i.loanInterestRate) / 100
}

export function calculateMonth(i: Inputs, index: number): Omit<MonthResult, 'balance'> {
  const activity = i.activity[index] ?? 100
  const f = activity / 100
  const isWinter = i.winterMonths[index] ?? false

  const shows = i.showsPerMonth * f
  const guests = shows * i.guestsPerShow
  const courseSessions = i.coursesPerWeek * WEEKS_PER_MONTH * f

  const revenue: Record<RevenueKey, number> = {
    tickets: guests * i.ticketPrice,
    cafe: guests * i.cafeProfitPerGuest,
    courses: courseSessions * i.participantsPerCourse * i.pricePerParticipant,
    workshops: i.workshopsPerMonth * f * i.participantsPerWorkshop * i.profitPerWorkshopParticipant,
    rentals: i.rentalsPerMonth * f * i.rentalPrice,
    profiTraining: i.profiTrainingPerMonth,
    funding: i.fundingPerMonth,
    members: (i.members * i.memberFeePerYear) / 12,
  }

  const costs: Record<CostKey, number> = {
    artists: shows * i.artistFeePerShow,
    showFees: shows * (i.gemaPerShow + i.kvrPerShow),
    trainers: courseSessions * i.trainerCostPerCourse,
    personnel: i.personnelPerMonth,
    heating: isWinter ? i.heatingPerWinterMonth : 0,
    toilets: i.toiletsPerMonth,
    insurance: i.insurancePerMonth,
    marketing: i.marketingPerMonth,
    technology: i.technologyPerMonth,
    other: i.otherCostsPerMonth,
    admin: annualCosts(i) / 12,
    loanInterest: loanInterestPerYear(i) / 12,
    reserves: i.reservesPerMonth,
  }

  const totalRevenue = sum(Object.values(revenue))
  const totalCosts = sum(Object.values(costs))

  return {
    index,
    calendarMonth: (PLANNING_START_MONTH + index) % 12,
    activity,
    isWinter,
    revenue,
    costs,
    totalRevenue,
    totalCosts,
    result: totalRevenue - totalCosts,
  }
}

export function calculateYear(i: Inputs): YearResult {
  const startBalance = i.startingCash + i.loanAmount - i.initialExpenses
  let balance = startBalance
  let lowestBalance = startBalance
  let lowestBalanceMonth = -1
  let firstMonthBelowBuffer: number | null = startBalance < i.liquidityBuffer ? -1 : null
  let firstMonthBelowZero: number | null = startBalance < 0 ? -1 : null

  const months: MonthResult[] = []
  for (let m = 0; m < MONTH_COUNT; m++) {
    const month = calculateMonth(i, m)
    balance += month.result
    months.push({ ...month, balance })
    if (balance < lowestBalance) {
      lowestBalance = balance
      lowestBalanceMonth = m
    }
    if (firstMonthBelowBuffer === null && balance < i.liquidityBuffer) firstMonthBelowBuffer = m
    if (firstMonthBelowZero === null && balance < 0) firstMonthBelowZero = m
  }

  const totalRevenue = sum(months.map((m) => m.totalRevenue))
  const totalCosts = sum(months.map((m) => m.totalCosts))

  const avgRevenue = zeroRecord(REVENUE_KEYS)
  const avgCosts = zeroRecord(COST_KEYS)
  for (const m of months) {
    for (const k of REVENUE_KEYS) avgRevenue[k] += m.revenue[k] / MONTH_COUNT
    for (const k of COST_KEYS) avgCosts[k] += m.costs[k] / MONTH_COUNT
  }

  return {
    months,
    totalRevenue,
    totalCosts,
    yearResult: totalRevenue - totalCosts,
    avgMonthlyRevenue: totalRevenue / MONTH_COUNT,
    avgMonthlyCosts: totalCosts / MONTH_COUNT,
    avgMonthlyResult: (totalRevenue - totalCosts) / MONTH_COUNT,
    avgRevenue,
    avgCosts,
    startBalance,
    endBalance: balance,
    lowestBalance,
    lowestBalanceMonth,
    firstMonthBelowBuffer,
    firstMonthBelowZero,
  }
}

/**
 * Welcher Wert einer Stellschraube reicht, damit das Jahr bei null landet?
 *
 * Das Jahresergebnis haengt bei allen Stellschrauben, die hier gefragt
 * werden, linear vom Wert ab. Zwei Rechnungen genuegen also fuer die Gerade.
 * Gibt null zurueck, wenn die Stellschraube das Ergebnis nicht verbessert.
 */
export function breakEvenValue(i: Inputs, key: NumberKey): number | null {
  const at = (v: number) => calculateYear({ ...i, [key]: v }).yearResult
  const r0 = at(0)
  const slope = at(1) - r0
  if (slope <= 1e-9) return null
  return Math.max(0, -r0 / slope)
}

function sum(values: number[]) {
  return values.reduce((a, b) => a + b, 0)
}
