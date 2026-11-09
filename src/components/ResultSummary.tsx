'use client'

import { useLocale, useTranslations } from 'next-intl'
import { formatEuro, monthName } from '@/lib/format'
import type { Inputs, YearResult } from '@/lib/model'

export default function ResultSummary({ year, inputs }: { year: YearResult; inputs: Inputs }) {
  const t = useTranslations('result')
  const locale = useLocale()
  const e = (v: number, signed = false) => formatEuro(v, locale, signed)
  const carries = year.yearResult >= 0

  let balanceNote: { tone: 'ok' | 'warn' | 'bad'; text: string }
  if (year.firstMonthBelowZero !== null) {
    balanceNote = {
      tone: 'bad',
      text:
        year.firstMonthBelowZero < 0
          ? t('warnZeroStart')
          : t('warnZero', { month: monthName(year.firstMonthBelowZero, locale, 'long') }),
    }
  } else if (year.firstMonthBelowBuffer !== null) {
    const buffer = e(inputs.liquidityBuffer)
    balanceNote = {
      tone: 'warn',
      text:
        year.firstMonthBelowBuffer < 0
          ? t('warnBufferStart', { buffer })
          : t('warnBuffer', { month: monthName(year.firstMonthBelowBuffer, locale, 'long'), buffer }),
    }
  } else {
    balanceNote = { tone: 'ok', text: t('balanceOk') }
  }

  const toneClass = {
    ok: 'bg-plus-soft text-plus',
    warn: 'bg-warn-soft text-warn',
    bad: 'bg-minus-soft text-minus',
  }[balanceNote.tone]

  return (
    <section className="rounded-xl border border-line bg-surface p-5" aria-live="polite">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            {t('avgMonth')} <span className="text-xs">({t('avgMonthHint')})</span>
          </p>
          <p className={`tabular text-4xl font-bold tracking-tight ${carries ? 'text-plus' : 'text-minus'}`}>
            {e(year.avgMonthlyResult, true)}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            carries ? 'bg-plus-soft text-plus' : 'bg-minus-soft text-minus'
          }`}
        >
          {carries ? t('carries') : t('notCarries')}
        </span>
      </div>

      <dl className="tabular mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted">{t('income')}</dt>
          <dd className="font-semibold">{e(year.avgMonthlyRevenue)}</dd>
        </div>
        <div>
          <dt className="text-muted">{t('costs')}</dt>
          <dd className="font-semibold">{e(year.avgMonthlyCosts)}</dd>
        </div>
        <div>
          <dt className="text-muted">{t('year')}</dt>
          <dd className={`font-semibold ${carries ? 'text-plus' : 'text-minus'}`}>{e(year.yearResult, true)}</dd>
        </div>
        <div>
          <dt className="text-muted">{t('startBalance')}</dt>
          <dd className="font-semibold">{e(year.startBalance)}</dd>
        </div>
        <div>
          <dt className="text-muted">{t('endBalance')}</dt>
          <dd className={`font-semibold ${year.endBalance < 0 ? 'text-minus' : ''}`}>{e(year.endBalance)}</dd>
        </div>
        <div>
          <dt className="text-muted">{t('lowestBalance')}</dt>
          <dd className={`font-semibold ${year.lowestBalance < 0 ? 'text-minus' : ''}`}>{e(year.lowestBalance)}</dd>
        </div>
      </dl>

      <p className={`mt-4 rounded-md px-3 py-2 text-sm ${toneClass}`}>{balanceNote.text}</p>
    </section>
  )
}
