'use client'

import { useLocale, useTranslations } from 'next-intl'
import { LEVERS, FIELDS } from '@/lib/fields'
import { formatEuro, formatValue } from '@/lib/format'
import { breakEvenValue, SEATS, type Inputs, type YearResult } from '@/lib/model'

/**
 * Beantwortet die Leitfrage: Welche einzelne Stellschraube muesste sich wie
 * weit bewegen, damit das Jahr bei null landet?
 */
export default function WhatItTakes({ inputs, year }: { inputs: Inputs; year: YearResult }) {
  const t = useTranslations('need')
  const tf = useTranslations('fields')
  const locale = useLocale()
  const missing = year.yearResult < 0

  const rows = LEVERS.map((key) => {
    const raw = breakEvenValue(inputs, key)
    const unit = FIELDS[key].unit
    const current = inputs[key]
    if (raw === null) return { key, text: t('noEffect'), value: null, current, unit, over: false }
    // Bei Mangel aufrunden (mindestens so viel), bei Ueberschuss abrunden (hoechstens so weit runter)
    const rounded =
      unit === 'euro'
        ? missing
          ? Math.ceil(raw * 2) / 2
          : Math.floor(raw * 2) / 2
        : missing
          ? Math.ceil(raw)
          : Math.floor(raw)
    const over = key === 'guestsPerShow' && rounded > SEATS
    // Bei Ueberschuss und Wert 0: Diese Stellschraube allein bringt das Jahr nicht ins Minus
    if (!missing && rounded <= 0) return { key, text: t('notNeeded'), value: null, current, unit, over: false }
    return { key, text: null, value: rounded, current, unit, over }
  })

  // Wenn jede Stellschraube allein auf null fallen koennte, reicht ein Satz statt vier gleicher Zeilen
  const allSafe = !missing && rows.every((r) => r.value === null && r.text === t('notNeeded'))

  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <h2 className="text-lg font-semibold">{t('title')}</h2>
      <p className="mt-1 text-sm text-muted">
        {missing
          ? t('missing', { amount: formatEuro(-year.avgMonthlyResult, locale) })
          : t('surplus', { amount: formatEuro(year.avgMonthlyResult, locale) })}
      </p>
      {allSafe ? (
        <p className="mt-3 rounded-lg bg-plus-soft px-3 py-2 text-sm text-plus">{t('allSafe')}</p>
      ) : (
      <ul className="mt-3 space-y-2">
        {rows.map((row) => (
          <li key={row.key} className="rounded-lg bg-sunken px-3 py-2 text-sm">
            {row.value === null ? (
              <span className="text-muted">
                {tf(`${row.key}.label`)}: {row.text}
              </span>
            ) : (
              <>
                <span className="font-semibold">
                  {t(`levers.${row.key}`, { value: formatValue(row.value, row.unit, locale) })}
                </span>{' '}
                <span className="text-muted">{t('from', { current: formatValue(row.current, row.unit, locale) })}</span>
                {row.over && <span className="block text-xs text-minus">{t('overSeats', { seats: SEATS })}</span>}
              </>
            )}
          </li>
        ))}
      </ul>
      )}
      {missing && <p className="mt-3 text-xs text-muted">{t('combine')}</p>}
    </section>
  )
}
