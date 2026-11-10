import { z } from 'zod'
import { MONTH_COUNT, type Inputs } from './model'

/**
 * BEISPIELWERTE, keine echten Zahlen des Pepe Dome.
 *
 * Das Repo ist oeffentlich. Die echten Grundwerte stehen deshalb nur in der
 * Umgebungsvariable PEPE_DOME_WERTE (lokal in .env, online in Vercel).
 * Fehlt die Variable, zeigt die App diese Werte und weist darauf hin.
 */
export const EXAMPLE_INPUTS: Inputs = {
  showsPerMonth: 6,
  guestsPerShow: 70,
  ticketPrice: 16,
  cafeProfitPerGuest: 3,
  cafeDaysPerWeek: 5,
  cafeProfitPerDay: 80,
  artistFeePerShow: 1000,
  gemaPerShow: 60,
  kvrPerShow: 40,

  coursesPerWeek: 6,
  participantsPerCourse: 8,
  pricePerParticipant: 15,
  trainerPerParticipant: 10,
  trainerCapPerCourse: 60,

  workshopsPerMonth: 2,
  participantsPerWorkshop: 12,
  profitPerWorkshopParticipant: 20,

  profiTrainingPerMonth: 500,
  fundingPerMonth: 2000,
  rentalsPerMonth: 4,
  rentalPrice: 300,
  fixedRentPerMonth: 200,
  rentalHoursPerWeek: 3,
  rentalPricePerHour: 40,
  newIncomePerMonth: 0,
  members: 0,
  memberFeePerYear: 0,

  coreTeamCount: 2,
  salaryPerPerson: 1000,
  livingSalaryTarget: 2500,
  partTimePerMonth: 1000,
  insurancePerMonth: 400,
  toiletsPerMonth: 600,
  marketingPerMonth: 300,
  technologyPerMonth: 150,
  otherCostsPerMonth: 300,
  heatingPerWinterMonth: 3500,
  reservesPerMonth: 200,

  taxAdvisorPerYear: 800,
  annualReportPerYear: 2000,
  bookkeepingPerYear: 1200,
  payrollPerYear: 400,
  eventInsurancePerYear: 400,

  startingCash: 10000,
  oneOffFunding: 0,
  loanAmount: 0,
  loanInterestRate: 4.5,
  initialExpenses: 0,
  liquidityBuffer: 5000,

  // Planungsjahr ab Maerz; activity, winterMonths und monthPlan beginnen mit dem Startmonat
  startMonth: 3,
  activity: [100, 100, 100, 100, 85, 70, 100, 100, 100, 80, 90, 100],
  winterMonths: [true, false, false, false, false, false, false, false, true, true, true, true],
  monthPlan: Array.from({ length: 12 }, () => ({})),
}

const NUMBER_KEYS = (Object.keys(EXAMPLE_INPUTS) as (keyof Inputs)[]).filter(
  (k) => typeof EXAMPLE_INPUTS[k] === 'number',
)

const num = z.number().finite()

/** Teilweise Eingaben, wie sie in der Umgebungsvariable, im Link oder im Speicher stehen. */
export const partialInputsSchema = z
  .object({
    ...Object.fromEntries(NUMBER_KEYS.map((k) => [k, num.optional()])),
    activity: z.array(num.min(0).max(300)).length(MONTH_COUNT).optional(),
    winterMonths: z.array(z.boolean()).length(MONTH_COUNT).optional(),
    monthPlan: z
      .array(
        z
          .object({ shows: num.min(0).optional(), guests: num.min(0).optional(), rentals: num.min(0).optional() })
          .strict(),
      )
      .length(MONTH_COUNT)
      .optional(),
  })
  .strict()

export type PartialInputs = Partial<Inputs>

export function mergeInputs(base: Inputs, changes: PartialInputs): Inputs {
  return { ...base, ...changes }
}

/** Nur die Werte, die sich von der Grundlage unterscheiden. */
export function diffInputs(base: Inputs, current: Inputs): PartialInputs {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(current) as (keyof Inputs)[]) {
    const a = base[key]
    const b = current[key]
    const same = Array.isArray(a) && Array.isArray(b) ? JSON.stringify(a) === JSON.stringify(b) : a === b
    if (!same) out[key] = b
  }
  return out as PartialInputs
}

export function parsePartialInputs(value: unknown): { ok: true; data: PartialInputs } | { ok: false; error: string } {
  const parsed = partialInputsSchema.safeParse(value)
  if (parsed.success) return { ok: true, data: parsed.data as PartialInputs }
  return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') }
}
