'use client'

import { useLocale, useTranslations } from 'next-intl'
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatEuro, monthName } from '@/lib/format'
import type { Inputs, YearResult } from '@/lib/model'

export default function YearChart({ year, inputs }: { year: YearResult; inputs: Inputs }) {
  const t = useTranslations('chart')
  const locale = useLocale()

  const data = year.months.map((m) => ({
    name: monthName(m.index, locale),
    longName: monthName(m.index, locale, 'long'),
    result: Math.round(m.result),
    balance: Math.round(m.balance),
    winter: m.isWinter,
    activity: m.activity,
  }))

  const compact = (v: number) =>
    new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(v) + ' €'

  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <h2 className="text-lg font-semibold">{t('title')}</h2>
      <p className="mt-1 text-sm text-muted">{t('intro')}</p>
      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-line)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-muted)', fontSize: 12 }} />
            <YAxis
              tickFormatter={compact}
              tickLine={false}
              axisLine={false}
              width={80}
              tick={{ fill: 'var(--color-muted)', fontSize: 12 }}
            />
            <ReferenceLine y={0} stroke="var(--color-muted)" />
            {inputs.liquidityBuffer > 0 && (
              <ReferenceLine
                y={inputs.liquidityBuffer}
                ifOverflow="extendDomain"
                stroke="var(--color-warn)"
                strokeDasharray="4 4"
                label={{ value: t('buffer'), position: 'insideTopLeft', fill: 'var(--color-warn)', fontSize: 12 }}
              />
            )}
            <Tooltip
              cursor={{ fill: 'var(--color-sunken)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload as (typeof data)[number]
                return (
                  <div className="tabular rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-sm">
                    <p className="font-semibold">
                      {d.longName}
                      {d.winter && <span className="ml-2 text-xs text-winter">{t('winter')}</span>}
                    </p>
                    <p className={d.result >= 0 ? 'text-plus' : 'text-minus'}>
                      {t('result')}: {formatEuro(d.result, locale, true)}
                    </p>
                    <p>
                      {t('balance')}: {formatEuro(d.balance, locale)}
                    </p>
                  </div>
                )
              }}
            />
            <Bar dataKey="result" name={t('result')} radius={[4, 4, 0, 0]} maxBarSize={36}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.result >= 0 ? 'var(--color-plus)' : 'var(--color-minus)'} />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="balance"
              name={t('balance')}
              stroke="var(--color-ink)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--color-ink)' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-plus" /> / <span className="inline-block h-3 w-3 rounded-sm bg-minus" />
          {t('result')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-ink" />
          {t('balance')}
        </span>
        {inputs.liquidityBuffer > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 border-t-2 border-dashed border-warn" />
            {t('buffer')}
          </span>
        )}
      </div>
    </section>
  )
}
