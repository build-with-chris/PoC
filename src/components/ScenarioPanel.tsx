'use client'

import { useState, type ReactNode } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { PRESET_IDS, type PresetId } from '@/lib/presets'
import type { SavedScenario } from '@/lib/storage'

interface Props {
  name: string
  activePreset: PresetId | null
  changedCount: number
  saved: SavedScenario[]
  isSaved: boolean
  onPreset: (id: PresetId) => void
  onReset: () => void
  onSave: (name: string) => void
  onLoad: (s: SavedScenario) => void
  onDelete: (s: SavedScenario) => void
  onShare: () => void
  onDownload: (kind: 'csv' | 'txt') => void
  missions: ReactNode
  missionActive: boolean
}

export default function ScenarioPanel(p: Props) {
  const t = useTranslations()
  const locale = useLocale()
  const [draftName, setDraftName] = useState('')
  const [tab, setTab] = useState<'presets' | 'missions'>(p.missionActive ? 'missions' : 'presets')

  const button = 'rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:border-ink'

  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <div role="tablist" className="flex gap-1 border-b border-line">
        {(['presets', 'missions'] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`-mb-px border-b-2 px-3 pb-2 text-sm font-semibold ${
              tab === id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t(id === 'presets' ? 'presets.title' : 'missions.title')}
            {id === 'missions' && p.missionActive && <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-accent" />}
          </button>
        ))}
      </div>
      <div className="mt-3">
      {tab === 'missions' ? (
        p.missions
      ) : (
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {PRESET_IDS.map((id) => {
          const active = p.activePreset === id
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => p.onPreset(id)}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                active ? 'border-accent bg-accent-soft' : 'border-line hover:border-ink'
              }`}
            >
              <span className={`block text-sm font-semibold ${active ? 'text-accent' : ''}`}>{t(`presets.${id}.title`)}</span>
              <span className="block text-xs text-muted">{t(`presets.${id}.text`)}</span>
            </button>
          )
        })}
      </div>
      )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-line pt-4">
        <div className="mr-auto">
          <p className="text-xs text-muted">{t('scenario.current')}</p>
          <p className="font-semibold">
            {p.name}{' '}
            <span className="text-sm font-normal text-muted">
              · {t('scenario.changed', { count: p.changedCount })}
              {!p.isSaved && p.changedCount > 0 && ` · ${t('scenario.unsaved')}`}
            </span>
            {p.changedCount > 0 && (
              <button type="button" onClick={p.onReset} className="ml-2 text-sm font-normal text-muted underline hover:text-ink">
                {t('scenario.reset')}
              </button>
            )}
          </p>
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            p.onSave(draftName.trim() || p.name)
            setDraftName('')
          }}
        >
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder={t('scenario.namePlaceholder')}
            aria-label={t('scenario.namePlaceholder')}
            maxLength={80}
            className="w-48 rounded-md border border-line bg-surface px-2 py-1.5 text-sm"
          />
          <button type="submit" className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink">
            {t('scenario.save')}
          </button>
        </form>

        <button type="button" onClick={p.onShare} className={button}>
          {t('scenario.share')}
        </button>
        <details className="relative">
          <summary className={`${button} cursor-pointer list-none`}>↓ {t('scenario.download')}</summary>
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-line bg-surface p-1 shadow-lg">
            <button type="button" onClick={() => p.onDownload('csv')} className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-sunken">
              {t('scenario.downloadCsv')}
            </button>
            <button type="button" onClick={() => p.onDownload('txt')} className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-sunken">
              {t('scenario.downloadTxt')}
            </button>
          </div>
        </details>
      </div>

      <details className="mt-4 border-t border-line pt-3">
        <summary className="cursor-pointer text-sm font-medium">
          {t('scenario.savedTitle')} ({p.saved.length})
        </summary>
        <p className="mt-1 text-xs text-muted">{t('scenario.savedHint')}</p>
        {p.saved.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{t('scenario.empty')}</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {p.saved.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="mr-auto">
                  <span className="font-medium">{s.name}</span>
                  {s.savedAt && (
                    <span className="ml-2 text-xs text-muted">{new Date(s.savedAt).toLocaleDateString(locale)}</span>
                  )}
                </span>
                <button type="button" onClick={() => p.onLoad(s)} className="underline">
                  {t('scenario.load')}
                </button>
                <button
                  type="button"
                  onClick={() => window.confirm(t('scenario.deleteConfirm', { name: s.name })) && p.onDelete(s)}
                  className="text-minus underline"
                >
                  {t('scenario.delete')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </details>
    </section>
  )
}
