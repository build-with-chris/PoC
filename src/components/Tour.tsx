'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import ResultSummary from './ResultSummary'
import WhatItTakes from './WhatItTakes'
import { formatEuro, formatNumber } from '@/lib/format'
import { calculateYear, perCourse, perShow, SEATS, type CostKey, type Inputs, type RevenueKey } from '@/lib/model'

const STEPS = ['intro', 'fixed', 'show', 'more', 'result'] as const

/** Kosten, die unabhaengig vom Programm jeden Monat anfallen. */
const FIXED_COSTS: CostKey[] = [
  'personnel',
  'heating',
  'toilets',
  'insurance',
  'marketing',
  'technology',
  'other',
  'admin',
  'reserves',
  'loanInterest',
]
const OTHER_INCOME: RevenueKey[] = ['cafeDays', 'courses', 'funding', 'profiTraining', 'rentals', 'workshops', 'members']

export default function Tour({ base }: { base: Inputs }) {
  const t = useTranslations()
  const locale = useLocale()
  const [step, setStep] = useState(0)
  const year = useMemo(() => calculateYear(base), [base])
  const e = (v: number, signed = false) => formatEuro(v, locale, signed)
  const id = STEPS[step]

  const fixedRows = FIXED_COSTS.map((k) => ({ key: k, value: year.avgCosts[k] })).filter((r) => r.value >= 1)
  const fixedTotal = fixedRows.reduce((a, r) => a + r.value, 0)
  const show = perShow(base)
  const course = perCourse(base)
  const avgShows = year.months.reduce((a, m) => a + base.showsPerMonth * (m.activity / 100), 0) / 12
  const otherRows = OTHER_INCOME.map((k) => ({ key: k, value: year.avgRevenue[k] })).filter((r) => r.value >= 1)

  const line = (label: string, value: string, tone?: 'plus' | 'minus' | 'strong') => (
    <div
      key={label}
      className={`tabular flex justify-between gap-4 py-1.5 ${tone === 'strong' ? 'border-t border-line pt-2 font-semibold' : ''}`}
    >
      <span>{label}</span>
      <span className={tone === 'plus' ? 'text-plus' : tone === 'minus' ? 'text-minus' : ''}>{value}</span>
    </div>
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">{t('tour.stepOf', { current: step + 1, total: STEPS.length })}</p>
        <Link href="/regler" className="text-sm text-muted underline hover:text-ink">
          {t('tour.skip')}
        </Link>
      </div>
      <div className="mb-8 flex gap-1.5" aria-hidden>
        {STEPS.map((s, i) => (
          <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-accent' : 'bg-line'}`} />
        ))}
      </div>

      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t(`tour.${id}.title`)}</h1>

      <div className="mt-6 text-lg leading-relaxed">
        {id === 'intro' && (
          <>
            <p>{t('tour.intro.text')}</p>
            <ul className="mt-6 space-y-2 text-base text-muted">
              <li>· {t('tour.intro.point1')}</li>
              <li>· {t('tour.intro.point2')}</li>
              <li>· {t('tour.intro.point3')}</li>
            </ul>
          </>
        )}

        {id === 'fixed' && (
          <>
            <p>{t('tour.fixed.text')}</p>
            <div className="mt-6 rounded-xl border border-line bg-surface p-5 text-base">
              {fixedRows.map((r) => line(t(`costs.${r.key}`), e(r.value)))}
              {line(t('tour.fixed.total'), e(fixedTotal), 'strong')}
            </div>
            {base.heatingPerWinterMonth > 0 && <p className="mt-2 text-sm text-muted">{t('tour.fixed.heatingNote')}</p>}
            <p className="mt-6">{t('tour.fixed.after')}</p>
          </>
        )}

        {id === 'show' && (
          <>
            <p>{t('tour.show.text')}</p>
            <div className="mt-6 rounded-xl border border-line bg-surface p-5 text-base">
              {line(
                t('tour.show.tickets', { guests: base.guestsPerShow, price: e(base.ticketPrice) }),
                e(base.guestsPerShow * base.ticketPrice),
                'plus',
              )}
              {base.cafeProfitPerGuest > 0 &&
                line(
                  t('tour.show.cafe', { guests: base.guestsPerShow, amount: e(base.cafeProfitPerGuest) }),
                  e(base.guestsPerShow * base.cafeProfitPerGuest),
                  'plus',
                )}
              {line(t('tour.show.artists'), e(-base.artistFeePerShow), 'minus')}
              {line(t('tour.show.fees'), e(-(base.gemaPerShow + base.kvrPerShow)), 'minus')}
              {line(t('tour.show.result'), e(show.result, true), 'strong')}
            </div>
            <p className="mt-6">
              {t('tour.show.perMonth', {
                shows: formatNumber(avgShows, locale, 1),
                amount: e(show.result * avgShows, true),
              })}
            </p>
            <p className="mt-2 text-base text-muted">
              {t('tour.show.seats', {
                seats: SEATS,
                guests: base.guestsPerShow,
                percent: Math.round((base.guestsPerShow / SEATS) * 100),
              })}
            </p>
          </>
        )}

        {id === 'more' && (
          <>
            <p>{t('tour.more.text')}</p>
            <div className="mt-6 rounded-xl border border-line bg-surface p-5 text-base">
              {line(
                t('tour.more.courseLine', {
                  participants: base.participantsPerCourse,
                  price: e(base.pricePerParticipant),
                  trainer: e(base.trainerCostPerCourse),
                }),
                '',
              )}
              {line(t('tour.more.courseResult'), e(course.result, true), 'strong')}
            </div>
            <div className="mt-4 rounded-xl border border-line bg-surface p-5 text-base">
              <p className="mb-1 text-sm font-semibold text-muted">{t('tour.more.perMonth')}</p>
              {otherRows.map((r) => line(t(`revenue.${r.key}`), e(r.value), 'plus'))}
            </div>
          </>
        )}

        {id === 'result' && (
          <div className="space-y-4 text-base">
            <p className="text-lg">{t('tour.result.text')}</p>
            <ResultSummary year={year} inputs={base} />
            <WhatItTakes year={year} inputs={base} />
          </div>
        )}
      </div>

      <div className="sticky bottom-0 mt-10 flex items-center justify-between gap-4 border-t border-line bg-bg/95 py-4 backdrop-blur">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-md px-4 py-2 font-medium text-muted hover:text-ink disabled:invisible"
        >
          ← {t('tour.back')}
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => {
              setStep((s) => s + 1)
              window.scrollTo({ top: 0 })
            }}
            className="rounded-md bg-accent px-5 py-2.5 font-semibold text-accent-ink"
          >
            {t('tour.next')} →
          </button>
        ) : (
          <Link href="/regler" className="rounded-md bg-accent px-5 py-2.5 font-semibold text-accent-ink">
            {t('tour.finish')} →
          </Link>
        )}
      </div>
    </div>
  )
}
