'use client'

import { useLocale, useTranslations } from 'next-intl'
import { monthName } from '@/lib/format'
import { startIndex, type Inputs, type MonthPlan } from '@/lib/model'

type SeasonPart = Pick<Inputs, 'startMonth' | 'activity' | 'winterMonths' | 'monthPlan'>

interface Props {
  inputs: Inputs
  onChange: (part: SeasonPart) => void
}

/** Dreht eine Liste so, dass Index 0 wieder zum neuen Startmonat gehoert. */
function rotate<T>(list: T[], shift: number): T[] {
  const n = list.length
  return list.map((_, i) => list[(((i + shift) % n) + n) % n])
}

const PLAN_KEYS = ['shows', 'guests', 'rentals'] as const

export default function SeasonEditor({ inputs, onChange }: Props) {
  const t = useTranslations('season')
  const locale = useLocale()
  const { startMonth, activity, winterMonths, monthPlan } = inputs
  const part: SeasonPart = { startMonth, activity, winterMonths, monthPlan }

  const setStart = (next: number) => {
    // Werte bleiben an ihrem Kalendermonat haengen, nur die Reihenfolge aendert sich
    const shift = startIndex(next) - startIndex(startMonth)
    onChange({
      startMonth: next,
      activity: rotate(activity, shift),
      winterMonths: rotate(winterMonths, shift),
      monthPlan: rotate(monthPlan, shift),
    })
  }
  const setActivity = (idx: number, value: number) =>
    onChange({ ...part, activity: activity.map((a, i) => (i === idx ? value : a)) })
  const toggleWinter = (idx: number) =>
    onChange({ ...part, winterMonths: winterMonths.map((w, i) => (i === idx ? !w : w)) })
  const setPlan = (idx: number, key: (typeof PLAN_KEYS)[number], text: string) => {
    const n = Number(text.replace(',', '.'))
    const next: MonthPlan = { ...monthPlan[idx] }
    if (text.trim() === '' || !Number.isFinite(n) || n < 0) delete next[key]
    else next[key] = n
    onChange({ ...part, monthPlan: monthPlan.map((p, i) => (i === idx ? next : p)) })
  }

  // Was ohne feste Planung gerechnet wuerde, als Platzhalter
  const auto = (idx: number) => {
    const f = (activity[idx] ?? 100) / 100
    return {
      shows: Math.round(inputs.showsPerMonth * f * 10) / 10,
      guests: inputs.guestsPerShow,
      rentals: Math.round(inputs.rentalsPerMonth * f * 10) / 10,
    }
  }

  return (
    <div>
      <p className="text-sm text-muted">{t('intro')}</p>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <span className="font-medium">{t('startMonth')}</span>
        <select
          value={startIndex(startMonth) + 1}
          onChange={(e) => setStart(Number(e.target.value))}
          className="rounded-md border border-line bg-surface px-2 py-1"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i + 1}>
              {monthName(i, locale, 'long', 1)}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-3 text-xs text-muted">{t('planIntro')}</p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
        {activity.map((a, idx) => {
          const name = monthName(idx, locale, 'long', startMonth)
          const placeholder = auto(idx)
          const planned = Object.keys(monthPlan[idx] ?? {}).length > 0
          return (
            <div
              key={idx}
              className={`rounded-lg border p-2 ${winterMonths[idx] ? 'border-winter/50 bg-winter/5' : 'border-line bg-sunken'}`}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold">
                  {monthName(idx, locale, 'short', startMonth)}
                  {planned && <span className="ml-1 text-xs font-normal text-accent">· {t('planned')}</span>}
                </span>
                <span className={`tabular text-xs ${a < 100 ? 'text-warn' : a > 100 ? 'text-plus' : 'text-muted'}`}>
                  {a} %
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={150}
                step={5}
                value={a}
                aria-label={`${t('activity')} ${name}`}
                onChange={(e) => setActivity(idx, Number(e.target.value))}
                className="mt-1 w-full"
              />
              <div className="mt-1 grid grid-cols-3 gap-1">
                {PLAN_KEYS.map((key) => (
                  <label key={key} className="text-[11px] text-muted">
                    {t(`plan.${key}`)}
                    <input
                      type="text"
                      inputMode="decimal"
                      aria-label={`${t(`plan.${key}`)} ${name}`}
                      value={monthPlan[idx]?.[key] ?? ''}
                      placeholder={String(placeholder[key])}
                      onChange={(e) => setPlan(idx, key, e.target.value)}
                      className="tabular mt-0.5 w-full rounded border border-line bg-surface px-1 py-0.5 text-right text-xs text-ink placeholder:text-muted/60"
                    />
                  </label>
                ))}
              </div>
              <label className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                <input type="checkbox" checked={winterMonths[idx]} onChange={() => toggleWinter(idx)} />
                {t('winter')}
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}
