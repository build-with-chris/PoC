'use client'

import { useTranslations } from 'next-intl'
import { goalReached, MISSION_IDS, ruleKept, type MissionId } from '@/lib/missions'
import type { Inputs, YearResult } from '@/lib/model'

interface Props {
  active: MissionId | null
  inputs: Inputs
  base: Inputs
  year: YearResult
  onStart: (id: MissionId | null) => void
}

/**
 * Kleine Aufgaben zum Selbst-Erleben: Start mit einer schwierigen Lage,
 * eine Regel, ein Ziel. Der Status rechnet live mit.
 */
export default function Missions({ active, inputs, base, year, onStart }: Props) {
  const t = useTranslations('missions')

  return (
    <div>
      <p className="text-sm text-muted">{t('intro')}</p>
      <div className="mt-2 grid gap-2 md:grid-cols-3">
        {MISSION_IDS.map((id) => {
          const isActive = active === id
          const kept = isActive && ruleKept(id, inputs, base)
          const reached = isActive && kept && goalReached(id, year)
          return (
            <div
              key={id}
              className={`flex flex-col rounded-lg border px-3 py-2 ${
                isActive ? (reached ? 'border-plus bg-plus-soft' : 'border-accent bg-accent-soft') : 'border-line'
              }`}
            >
              <p className="font-semibold">{t(`${id}.title`)}</p>
              <p className="text-sm">{t(`${id}.goal`)}</p>
              <p className="mt-1 text-xs text-muted">
                {t('ruleLabel')}: {t(`${id}.rule`)}
              </p>
              <div className="mt-2 flex items-center justify-between gap-2">
                {isActive ? (
                  <>
                    <span
                      role="status"
                      className={`text-sm font-semibold ${reached ? 'text-plus' : kept ? 'text-accent' : 'text-minus'}`}
                    >
                      {reached ? t('done') : kept ? t('open') : t('ruleBroken')}
                    </span>
                    <button type="button" onClick={() => onStart(null)} className="text-xs text-muted underline">
                      {t('stop')}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => onStart(id)}
                    className="rounded-md border border-line bg-surface px-3 py-1 text-sm font-medium hover:border-ink"
                  >
                    {t('start')}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
