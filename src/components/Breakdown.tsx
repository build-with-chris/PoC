'use client'

import { useLocale, useTranslations } from 'next-intl'
import { formatEuro } from '@/lib/format'
import { COST_KEYS, REVENUE_KEYS, type YearResult } from '@/lib/model'

/** Einnahmen und Kosten als Balken im gleichen Massstab, damit Groessen vergleichbar sind. */
export default function Breakdown({ year }: { year: YearResult }) {
  const t = useTranslations()
  const locale = useLocale()
  const scale = Math.max(year.avgMonthlyRevenue, year.avgMonthlyCosts, 1)

  const income = REVENUE_KEYS.map((k) => ({ key: k, label: t(`revenue.${k}`), value: year.avgRevenue[k] }))
    .filter((r) => r.value >= 1)
    .sort((a, b) => b.value - a.value)
  const costs = COST_KEYS.map((k) => ({ key: k, label: t(`costs.${k}`), value: year.avgCosts[k] }))
    .filter((r) => r.value >= 1)
    .sort((a, b) => b.value - a.value)

  const renderList = (title: string, total: number, rows: { key: string; label: string; value: number }[], bar: string) => (
    <div>
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className="tabular text-sm font-semibold">{formatEuro(total, locale)}</span>
      </div>
      <ul className="mt-2 space-y-1.5">
        {rows.map((r) => (
          <li key={r.key} className="grid grid-cols-[9rem_1fr_5rem] items-center gap-2 text-sm">
            <span className="truncate" title={r.label}>
              {r.label}
            </span>
            <span className="h-2.5 rounded-full bg-sunken">
              <span className={`block h-full rounded-full ${bar}`} style={{ width: `${(r.value / scale) * 100}%` }} />
            </span>
            <span className="tabular text-right text-muted">{formatEuro(r.value, locale)}</span>
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <h2 className="text-lg font-semibold">{t('breakdown.title')}</h2>
      <p className="mt-1 text-sm text-muted">{t('breakdown.intro')}</p>
      <div className="mt-4 grid gap-6">
        {renderList(t('breakdown.income'), year.avgMonthlyRevenue, income, 'bg-plus')}
        {renderList(t('breakdown.costs'), year.avgMonthlyCosts, costs, 'bg-minus')}
      </div>
    </section>
  )
}
