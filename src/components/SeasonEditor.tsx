'use client'

import { useLocale, useTranslations } from 'next-intl'
import { monthName } from '@/lib/format'

interface Props {
  activity: number[]
  winterMonths: boolean[]
  onChange: (activity: number[], winterMonths: boolean[]) => void
}

export default function SeasonEditor({ activity, winterMonths, onChange }: Props) {
  const t = useTranslations('season')
  const locale = useLocale()

  const setActivity = (idx: number, value: number) =>
    onChange(activity.map((a, i) => (i === idx ? value : a)), winterMonths)
  const toggleWinter = (idx: number) =>
    onChange(activity, winterMonths.map((w, i) => (i === idx ? !w : w)))

  return (
    <div>
      <p className="text-sm text-muted">{t('intro')}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
        {activity.map((a, idx) => {
          const name = monthName(idx, locale, 'long')
          return (
            <div
              key={idx}
              className={`rounded-lg border p-2 ${winterMonths[idx] ? 'border-winter/50 bg-winter/5' : 'border-line bg-sunken'}`}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold">{monthName(idx, locale)}</span>
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
              <label className="flex items-center gap-1.5 text-xs text-muted">
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
