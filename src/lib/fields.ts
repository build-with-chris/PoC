import { SEATS, type NumberKey } from './model'

/**
 * Beschreibung aller Regler. Beschriftung und Erklaerung stehen in den
 * Sprachdateien unter fields.<key>.label und fields.<key>.help.
 */
export type Unit = 'euro' | 'count' | 'percent'

export interface FieldDef {
  key: NumberKey
  unit: Unit
  min: number
  max: number
  step: number
}

const f = (key: NumberKey, unit: Unit, max: number, step = 1, min = 0): FieldDef => ({ key, unit, min, max, step })

export const FIELDS: Record<NumberKey, FieldDef> = {
  showsPerMonth: f('showsPerMonth', 'count', 30),
  guestsPerShow: f('guestsPerShow', 'count', SEATS),
  ticketPrice: f('ticketPrice', 'euro', 60),
  cafeProfitPerGuest: f('cafeProfitPerGuest', 'euro', 15, 0.5),
  cafeDaysPerWeek: f('cafeDaysPerWeek', 'count', 7),
  cafeProfitPerDay: f('cafeProfitPerDay', 'euro', 1000, 10),
  artistFeePerShow: f('artistFeePerShow', 'euro', 5000, 50),
  gemaPerShow: f('gemaPerShow', 'euro', 500, 5),
  kvrPerShow: f('kvrPerShow', 'euro', 500, 5),

  coursesPerWeek: f('coursesPerWeek', 'count', 40),
  participantsPerCourse: f('participantsPerCourse', 'count', 30),
  pricePerParticipant: f('pricePerParticipant', 'euro', 60),
  trainerCostPerCourse: f('trainerCostPerCourse', 'euro', 300, 5),

  workshopsPerMonth: f('workshopsPerMonth', 'count', 20),
  participantsPerWorkshop: f('participantsPerWorkshop', 'count', 50),
  profitPerWorkshopParticipant: f('profitPerWorkshopParticipant', 'euro', 100),

  profiTrainingPerMonth: f('profiTrainingPerMonth', 'euro', 5000, 50),
  fundingPerMonth: f('fundingPerMonth', 'euro', 20000, 100),
  rentalsPerMonth: f('rentalsPerMonth', 'count', 30),
  rentalPrice: f('rentalPrice', 'euro', 3000, 25),
  members: f('members', 'count', 1000, 5),
  memberFeePerYear: f('memberFeePerYear', 'euro', 500, 5),

  coreTeamCount: f('coreTeamCount', 'count', 10),
  salaryPerPerson: f('salaryPerPerson', 'euro', 6000, 50),
  livingSalaryTarget: f('livingSalaryTarget', 'euro', 6000, 50),
  partTimePerMonth: f('partTimePerMonth', 'euro', 10000, 50),
  insurancePerMonth: f('insurancePerMonth', 'euro', 3000, 10),
  toiletsPerMonth: f('toiletsPerMonth', 'euro', 3000, 10),
  marketingPerMonth: f('marketingPerMonth', 'euro', 3000, 10),
  technologyPerMonth: f('technologyPerMonth', 'euro', 3000, 10),
  otherCostsPerMonth: f('otherCostsPerMonth', 'euro', 5000, 10),
  heatingPerWinterMonth: f('heatingPerWinterMonth', 'euro', 10000, 100),
  reservesPerMonth: f('reservesPerMonth', 'euro', 5000, 50),

  taxAdvisorPerYear: f('taxAdvisorPerYear', 'euro', 10000, 50),
  annualReportPerYear: f('annualReportPerYear', 'euro', 10000, 50),
  bookkeepingPerYear: f('bookkeepingPerYear', 'euro', 10000, 50),
  payrollPerYear: f('payrollPerYear', 'euro', 10000, 50),
  eventInsurancePerYear: f('eventInsurancePerYear', 'euro', 5000, 10),

  startingCash: f('startingCash', 'euro', 200000, 500),
  oneOffFunding: f('oneOffFunding', 'euro', 200000, 500),
  loanAmount: f('loanAmount', 'euro', 300000, 5000),
  loanInterestRate: f('loanInterestRate', 'percent', 15, 0.1),
  initialExpenses: f('initialExpenses', 'euro', 200000, 500),
  liquidityBuffer: f('liquidityBuffer', 'euro', 50000, 500),
}

/** Die Stellschrauben, die Einsteiger zuerst sehen. */
export const MAIN_FIELDS: NumberKey[] = [
  'showsPerMonth',
  'guestsPerShow',
  'ticketPrice',
  'artistFeePerShow',
  'coursesPerWeek',
  'participantsPerCourse',
  'fundingPerMonth',
  'salaryPerPerson',
]

/**
 * Lernschritt pro Hauptregler: Um wie viel aendert sich das Monatsergebnis,
 * wenn man den Regler um diesen Schritt erhoeht?
 */
export const NUDGE: Partial<Record<NumberKey, number>> = {
  showsPerMonth: 1,
  guestsPerShow: 10,
  ticketPrice: 1,
  artistFeePerShow: 100,
  coursesPerWeek: 1,
  participantsPerCourse: 1,
  fundingPerMonth: 100,
  salaryPerPerson: 100,
}

/** Gruppen im Expertenmodus. Die Saison hat einen eigenen Bereich. */
export const EXPERT_GROUPS: { id: string; keys: NumberKey[] }[] = [
  { id: 'shows', keys: ['showsPerMonth', 'guestsPerShow', 'ticketPrice', 'artistFeePerShow', 'gemaPerShow', 'kvrPerShow'] },
  { id: 'cafe', keys: ['cafeProfitPerGuest', 'cafeDaysPerWeek', 'cafeProfitPerDay'] },
  { id: 'courses', keys: ['coursesPerWeek', 'participantsPerCourse', 'pricePerParticipant', 'trainerCostPerCourse'] },
  { id: 'workshops', keys: ['workshopsPerMonth', 'participantsPerWorkshop', 'profitPerWorkshopParticipant'] },
  { id: 'otherIncome', keys: ['profiTrainingPerMonth', 'fundingPerMonth', 'rentalsPerMonth', 'rentalPrice', 'members', 'memberFeePerYear'] },
  { id: 'team', keys: ['coreTeamCount', 'salaryPerPerson', 'livingSalaryTarget', 'partTimePerMonth'] },
  { id: 'monthlyCosts', keys: ['heatingPerWinterMonth', 'toiletsPerMonth', 'insurancePerMonth', 'marketingPerMonth', 'technologyPerMonth', 'otherCostsPerMonth', 'reservesPerMonth'] },
  { id: 'annualCosts', keys: ['taxAdvisorPerYear', 'annualReportPerYear', 'bookkeepingPerYear', 'payrollPerYear', 'eventInsurancePerYear'] },
  { id: 'money', keys: ['startingCash', 'oneOffFunding', 'liquidityBuffer', 'initialExpenses', 'loanAmount', 'loanInterestRate'] },
]

/** Stellschrauben fuer die Frage "Was muss passieren?" */
export const LEVERS: NumberKey[] = ['guestsPerShow', 'showsPerMonth', 'participantsPerCourse', 'ticketPrice']
