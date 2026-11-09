'use client'

import { useId, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { FIELDS } from '@/lib/fields'
import { formatValue } from '@/lib/format'
import type { NumberKey } from '@/lib/model'

interface Props {
  field: NumberKey
  value: number
  baseValue: number
  onChange: (value: number) => void
  large?: boolean
}

/** Regler mit Zahlenfeld. Zeigt an, wenn der Wert vom Grundstand abweicht. */
export default function NumberField({ field, value, baseValue, onChange, large }: Props) {
  const t = useTranslations('fields')
  const locale = useLocale()
  const def = FIELDS[field]
  const id = useId()
  const [draft, setDraft] = useState(String(value))

  // Zahlenfeld nachziehen, wenn der Regler oder eine Vorlage den Wert aendert
  const [shownValue, setShownValue] = useState(value)
  if (shownValue !== value) {
    setShownValue(value)
    setDraft(String(value))
  }

  const max = Math.max(def.max, value, baseValue)
  const changed = value !== baseValue
  const help = t(`${field}.help`)
  const suffix = def.unit === 'euro' ? '€' : def.unit === 'percent' ? '%' : ''

  const commit = (text: string) => {
    const n = Number(text.replace(',', '.'))
    if (text.trim() !== '' && Number.isFinite(n) && n >= 0) onChange(n)
    else setDraft(String(value))
  }

  return (
    <div className={large ? 'py-3' : 'py-2'}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={`font-medium ${large ? 'text-base' : 'text-sm'}`}>
          {t(`${field}.label`)}
        </label>
        <div className="flex items-center gap-1">
          <input
            type="text"
            inputMode="decimal"
            aria-label={t(`${field}.label`)}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commit((e.target as HTMLInputElement).value)}
            className={`tabular w-24 rounded-md border bg-surface px-2 py-1 text-right text-sm ${
              changed ? 'border-accent text-accent font-semibold' : 'border-line'
            }`}
          />
          {suffix && <span className="w-3 text-sm text-muted">{suffix}</span>}
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={def.min}
        max={max}
        step={def.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full"
      />
      <div className="flex justify-between gap-3 text-xs text-muted">
        <span>{help}</span>
        {changed && (
          <button type="button" onClick={() => onChange(baseValue)} className="shrink-0 underline hover:text-ink">
            {formatValue(baseValue, def.unit, locale)}
          </button>
        )}
      </div>
    </div>
  )
}
