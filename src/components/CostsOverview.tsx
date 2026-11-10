'use client'

import { useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { COST_GROUPS, costGroups, costGroupsByMonth, fixedAndVariable, type CostGroupId } from '@/lib/costs'
import { formatEuro, formatNumber, monthName } from '@/lib/format'
import { calculateYear, trainerCostPerSession, type CostKey, type Inputs } from '@/lib/model'

const COLOR: Record<CostGroupId, string> = {
  team: 'var(--color-series-1)',
  program: 'var(--color-series-2)',
  venue: 'var(--color-series-3)',
  outreach: 'var(--color-series-4)',
  admin: 'var(--color-series-5)',
}

export default function CostsOverview({ base }: { base: Inputs }) {
  const t = useTranslations('costsPage')
  const tc = useTranslations('costs')
  const locale = useLocale()
  const e = (v: number) => formatEuro(v, locale)

  const year = useMemo(() => calculateYear(base), [base])
  const groups = useMemo(() => costGroups(year), [year])
  const byMonth = useMemo(() => costGroupsByMonth(year), [year])
  const { fixed, variable } = fixedAndVariable(year)
  const total = year.avgMonthlyCosts
  const winterCount = base.winterMonths.filter(Boolean).length

  // Kurze Erklaerung, woraus sich ein Posten zusammensetzt
  const detail = (key: CostKey): string => {
    const m = year.avgCosts
    switch (key) {
      case 'coreTeam':
        return t('detail.coreTeam', { count: base.coreTeamCount, salary: e(base.salaryPerPerson) })
      case 'artists':
        return t('detail.artists', {
          fee: e(base.artistFeePerShow),
          shows: formatNumber(base.artistFeePerShow > 0 ? m.artists / base.artistFeePerShow : 0, locale, 1),
        })
      case 'showFees':
        return t('detail.showFees', { gema: e(base.gemaPerShow), kvr: e(base.kvrPerShow) })
      case 'trainers': {
        const perSession = trainerCostPerSession(base)
        return t('detail.trainers', {
          perPerson: e(base.trainerPerParticipant),
          cap: e(base.trainerCapPerCourse),
          sessions: formatNumber(perSession > 0 ? m.trainers / perSession : 0, locale, 1),
        })
      }
      case 'heating':
        return t('detail.heating', { amount: e(base.heatingPerWinterMonth), months: winterCount })
      case 'insurance':
        return t('detail.insurance', { monthly: e(base.insurancePerMonth), event: e(base.eventInsurancePerYear) })
      case 'admin':
        return t('detail.admin', {
          tax: e(base.taxAdvisorPerYear),
          report: e(base.annualReportPerYear),
          books: e(base.bookkeepingPerYear),
          payroll: e(base.payrollPerYear),
        })
      case 'loanInterest':
        return t('detail.loanInterest', { rate: formatNumber(base.loanInterestRate, locale, 1), amount: e(base.loanAmount) })
      default:
        return t(`detail.${key}`)
    }
  }

  const monthData = byMonth.map((g, i) => ({
    name: monthName(i, locale, 'short', base.startMonth),
    longName: monthName(i, locale, 'long', base.startMonth),
    ...g,
  }))
  const compact = (v: number) =>
    new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(v) + ' €'

  const legend = (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {groups.map((g) => (
        <li key={g.id} className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: COLOR[g.id] }} />
          {t(`groups.${g.id}`)}
        </li>
      ))}
    </ul>
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t('intro')}</p>

      {/* Kennzahlen */}
      <dl className="tabular mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t('perMonth'), value: e(total), hint: t('perMonthHint') },
          { label: t('perYear'), value: e(year.totalCosts), hint: t('perYearHint') },
          { label: t('fixed'), value: e(fixed), hint: t('fixedHint', { percent: Math.round((fixed / (total || 1)) * 100) }) },
          { label: t('oneOff'), value: e(base.initialExpenses), hint: t('oneOffHint') },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-line bg-surface p-4">
            <dt className="text-sm text-muted">{k.label}</dt>
            <dd className="mt-1 text-2xl font-bold">{k.value}</dd>
            <dd className="mt-1 text-xs text-muted">{k.hint}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Anteile als Ring */}
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="text-lg font-semibold">{t('shareTitle')}</h2>
          <p className="mt-1 text-sm text-muted">{t('shareIntro')}</p>
          <div className="relative mx-auto mt-4 h-56 w-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={groups.filter((g) => g.perMonth >= 1)}
                  dataKey="perMonth"
                  nameKey="id"
                  innerRadius="62%"
                  outerRadius="100%"
                  paddingAngle={1}
                  stroke="var(--color-surface)"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {groups
                    .filter((g) => g.perMonth >= 1)
                    .map((g) => (
                      <Cell key={g.id} fill={COLOR[g.id]} />
                    ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const g = payload[0].payload as (typeof groups)[number]
                    return (
                      <div className="tabular rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-sm">
                        <p className="font-semibold">{t(`groups.${g.id}`)}</p>
                        <p>
                          {e(g.perMonth)} {t('perMonthShort')} · {Math.round(g.share * 100)} %
                        </p>
                      </div>
                    )
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="tabular text-xl font-bold">{e(total)}</span>
              <span className="text-xs text-muted">{t('perMonthShort')}</span>
            </div>
          </div>
          <ul className="tabular mt-4 space-y-1.5 text-sm">
            {groups.map((g) => (
              <li key={g.id} className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 shrink-0 rounded-sm" style={{ background: COLOR[g.id] }} />
                <span className="mr-auto">{t(`groups.${g.id}`)}</span>
                <span className="text-muted">{Math.round(g.share * 100)} %</span>
                <span className="w-20 text-right font-medium">{e(g.perMonth)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Verlauf ueber das Jahr */}
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="text-lg font-semibold">{t('monthTitle')}</h2>
          <p className="mt-1 text-sm text-muted">{t('monthIntro')}</p>
          <div className="mt-3">{legend}</div>
          <div className="mt-3 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--color-line)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-muted)', fontSize: 12 }} />
                <YAxis
                  tickFormatter={compact}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                  tick={{ fill: 'var(--color-muted)', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: 'var(--color-sunken)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload as (typeof monthData)[number]
                    const sum = COST_GROUPS.reduce((s, g) => s + d[g.id], 0)
                    return (
                      <div className="tabular rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-sm">
                        <p className="mb-1 font-semibold">
                          {d.longName}: {e(sum)}
                        </p>
                        {[...COST_GROUPS].reverse().map((g) => (
                          <p key={g.id} className="flex items-center gap-1.5">
                            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: COLOR[g.id] }} />
                            <span className="mr-3">{t(`groups.${g.id}`)}</span>
                            <span className="ml-auto">{e(d[g.id])}</span>
                          </p>
                        ))}
                      </div>
                    )
                  }}
                />
                {COST_GROUPS.map((g, i) => (
                  <Bar
                    key={g.id}
                    dataKey={g.id}
                    stackId="costs"
                    fill={COLOR[g.id]}
                    stroke="var(--color-surface)"
                    strokeWidth={1}
                    maxBarSize={36}
                    radius={i === COST_GROUPS.length - 1 ? [4, 4, 0, 0] : 0}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted">{t('monthNote', { variable: e(variable) })}</p>
        </section>
      </div>

      {/* Alle Posten untereinander */}
      <section className="mt-6 rounded-xl border border-line bg-surface p-5">
        <h2 className="text-lg font-semibold">{t('listTitle')}</h2>
        <p className="mt-1 text-sm text-muted">{t('listIntro')}</p>
        <div className="mt-4 space-y-6">
          {COST_GROUPS.map((g) => {
            const summary = groups.find((x) => x.id === g.id)!
            const rows = (g.keys as readonly CostKey[]).map((k) => ({ key: k, perMonth: year.avgCosts[k] }))
            return (
              <div key={g.id}>
                <div className="flex items-baseline gap-2 border-b border-line pb-1">
                  <span className="inline-block h-3 w-3 rounded-sm" style={{ background: COLOR[g.id] }} />
                  <h3 className="mr-auto font-semibold">{t(`groups.${g.id}`)}</h3>
                  <span className="tabular text-sm font-semibold">
                    {e(summary.perMonth)} {t('perMonthShort')}
                  </span>
                </div>
                <table className="tabular mt-1 w-full text-sm">
                  <thead className="sr-only">
                    <tr>
                      <th>{t('colItem')}</th>
                      <th>{t('colShare')}</th>
                      <th>{t('colMonth')}</th>
                      <th>{t('colYear')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.key} className={`border-b border-line/60 last:border-0 ${r.perMonth < 0.5 ? 'text-muted' : ''}`}>
                        <td className="py-2 pr-3 align-top">
                          <span className="font-medium">{tc(r.key)}</span>
                          <span className="block text-xs text-muted">{detail(r.key)}</span>
                        </td>
                        <td className="hidden w-40 py-2 pr-3 align-middle sm:table-cell">
                          <span className="block h-2 rounded-full bg-sunken">
                            <span
                              className="block h-full rounded-full"
                              style={{ width: `${total > 0 ? (r.perMonth / total) * 100 : 0}%`, background: COLOR[g.id] }}
                            />
                          </span>
                        </td>
                        <td className="w-24 py-2 text-right align-top whitespace-nowrap">
                          {e(r.perMonth)}
                          <span className="block text-xs text-muted">{t('perMonthShort')}</span>
                        </td>
                        <td className="w-28 py-2 text-right align-top whitespace-nowrap">
                          {e(r.perMonth * 12)}
                          <span className="block text-xs text-muted">{t('perYearShort')}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-xs text-muted">{t('note')}</p>
      </section>
    </div>
  )
}
