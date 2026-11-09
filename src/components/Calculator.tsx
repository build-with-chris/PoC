'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import NumberField from './NumberField'
import ResultSummary from './ResultSummary'
import WhatItTakes from './WhatItTakes'
import YearChart from './YearChart'
import Breakdown from './Breakdown'
import SeasonEditor from './SeasonEditor'
import ScenarioPanel from './ScenarioPanel'
import Missions from './Missions'
import { EXPERT_GROUPS, FIELDS, MAIN_FIELDS, NUDGE } from '@/lib/fields'
import { formatEuro, formatValue } from '@/lib/format'
import { MISSION_PRESET, type MissionId } from '@/lib/missions'
import { calculateYear, type Inputs, type NumberKey } from '@/lib/model'
import { diffInputs, mergeInputs } from '@/lib/inputs'
import { applyPreset, type PresetId } from '@/lib/presets'
import { buildShareUrl, encodeScenario, readSharedFromHash } from '@/lib/share'
import { loadScenarios, newId, storeScenarios, type SavedScenario } from '@/lib/storage'
import { buildCsv, buildReport, downloadFile } from '@/lib/export'

type Notice = { tone: 'ok' | 'warn'; text: string; link?: string } | null

export default function Calculator({ base }: { base: Inputs }) {
  const t = useTranslations()
  const locale = useLocale()

  const [inputs, setInputs] = useState<Inputs>(base)
  const [name, setName] = useState(() => t('presets.plan.title'))
  const [activePreset, setActivePreset] = useState<PresetId | null>('plan')
  const [saved, setSaved] = useState<SavedScenario[]>([])
  const [expert, setExpert] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [ready, setReady] = useState(false)
  const [mission, setMission] = useState<MissionId | null>(null)

  const year = useMemo(() => calculateYear(inputs), [inputs])
  const baseYear = useMemo(() => calculateYear(base), [base])

  // Was bringt ein Schritt mehr an einem Hauptregler? Macht Ursache und Wirkung sichtbar.
  const nudges = useMemo(() => {
    const out: Partial<Record<NumberKey, { text: string; positive: boolean } | null>> = {}
    for (const key of MAIN_FIELDS) {
      const step = NUDGE[key]
      if (!step) continue
      const effect = calculateYear({ ...inputs, [key]: inputs[key] + step }).avgMonthlyResult - year.avgMonthlyResult
      if (Math.abs(effect) < 0.5) {
        out[key] = null
        continue
      }
      out[key] = {
        text: t('calc.nudge', {
          step: formatValue(step, FIELDS[key].unit, locale),
          effect: formatEuro(effect, locale, true),
        }),
        positive: effect > 0,
      }
    }
    return out
  }, [inputs, year, t, locale])
  const changes = useMemo(() => diffInputs(base, inputs), [base, inputs])
  const changedCount = Object.keys(changes).length
  const isSaved = saved.some((s) => s.name === name && JSON.stringify(s.changes) === JSON.stringify(changes))

  // Beim ersten Laden: gespeicherte Szenarien und ein geteiltes Szenario aus dem Link holen
  // Browser-Speicher und Adresszeile gibt es erst nach dem Laden im Browser, nicht beim Rendern auf dem Server
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setSaved(loadScenarios())
    if (window.location.hash) {
      const shared = readSharedFromHash(window.location.hash)
      if (shared) {
        const sharedName = shared.name || t('scenario.sharedDefaultName')
        setInputs(mergeInputs(base, shared.changes))
        setName(sharedName)
        setActivePreset(null)
        setNotice({ tone: 'ok', text: t('scenario.sharedLoaded', { name: sharedName }) })
      } else {
        setNotice({ tone: 'warn', text: t('scenario.sharedInvalid') })
      }
    }
    setReady(true)
    /* eslint-enable react-hooks/set-state-in-effect */
    // Nur einmal beim Laden
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Link in der Adresszeile aktuell halten, damit Neuladen und Sprachwechsel nichts verlieren
  useEffect(() => {
    if (!ready) return
    const url = new URL(window.location.href)
    url.hash = changedCount > 0 ? `s=${encodeScenario({ name, changes })}` : ''
    window.history.replaceState(null, '', url.toString())
  }, [ready, changes, changedCount, name])

  // Sobald jemand an einer Vorlage dreht, zeigt der Name das an
  const markEdited = () => {
    if (activePreset) setName(`${t(`presets.${activePreset}.title`)} (${t('scenario.edited')})`)
    setActivePreset(null)
  }

  const setField = (key: NumberKey, value: number) => {
    setInputs((prev) => ({ ...prev, [key]: value }))
    markEdited()
  }

  const choosePreset = (id: PresetId, keepMission = false) => {
    setInputs(applyPreset(id, base))
    setName(t(`presets.${id}.title`))
    setActivePreset(id)
    setNotice(null)
    if (!keepMission) setMission(null)
  }

  const startMission = (id: MissionId | null) => {
    if (id) choosePreset(MISSION_PRESET[id], true)
    setMission(id)
  }

  const save = (scenarioName: string) => {
    const entry: SavedScenario = { id: newId(), name: scenarioName, savedAt: new Date().toISOString(), changes }
    const next = [entry, ...saved.filter((s) => s.name !== scenarioName)]
    if (storeScenarios(next)) {
      setSaved(next)
      setName(scenarioName)
      setNotice({ tone: 'ok', text: `${t('scenario.saved')}: ${scenarioName}` })
    } else {
      setNotice({ tone: 'warn', text: t('scenario.storageFailed') })
    }
  }

  const load = (s: SavedScenario) => {
    setInputs(mergeInputs(base, s.changes))
    setName(s.name)
    setActivePreset(null)
    setNotice(null)
    setMission(null)
  }

  const remove = (s: SavedScenario) => {
    const next = saved.filter((x) => x.id !== s.id)
    storeScenarios(next)
    setSaved(next)
  }

  const share = async () => {
    const url = buildShareUrl(window.location.href, { name, changes })
    try {
      await navigator.clipboard.writeText(url)
      setNotice({ tone: 'ok', text: t('scenario.copied') })
    } catch {
      setNotice({ tone: 'warn', text: t('scenario.copyFailed'), link: url })
    }
  }

  const download = (kind: 'csv' | 'txt') => {
    const slug = name.toLowerCase().replace(/[^a-z0-9äöüß]+/gi, '-').replace(/^-|-$/g, '') || 'szenario'
    const tt = (key: string, values?: Record<string, string | number>) => t(key, values)
    if (kind === 'csv') downloadFile(`pepe-dome-${slug}.csv`, buildCsv(year, locale, tt), 'text/csv;charset=utf-8')
    else downloadFile(`pepe-dome-${slug}.txt`, buildReport(name, inputs, year, locale, tt), 'text/plain;charset=utf-8')
  }

  const field = (key: NumberKey, large = false) => (
    <NumberField
      key={key}
      field={key}
      value={inputs[key]}
      baseValue={base[key]}
      large={large}
      nudge={large ? nudges[key] : undefined}
      onChange={(v) => setField(key, v)}
    />
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">{t('calc.title')}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t('calc.intro')}</p>

      <div className="mt-6">
        <ScenarioPanel
          name={name}
          activePreset={activePreset}
          changedCount={changedCount}
          saved={saved}
          isSaved={isSaved}
          onPreset={choosePreset}
          onReset={() => choosePreset('plan')}
          onSave={save}
          onLoad={load}
          onDelete={remove}
          onShare={share}
          onDownload={download}
          missionActive={mission !== null}
          missions={<Missions active={mission} inputs={inputs} base={base} year={year} onStart={startMission} />}
        />
        {notice && (
          <div
            role="status"
            className={`mt-3 flex items-start justify-between gap-4 rounded-lg px-4 py-2 text-sm ${
              notice.tone === 'ok' ? 'bg-plus-soft text-plus' : 'bg-warn-soft text-warn'
            }`}
          >
            <span>
              {notice.text}
              {notice.link && (
                <input
                  readOnly
                  value={notice.link}
                  onFocus={(e) => e.target.select()}
                  className="mt-1 block w-full rounded border border-line bg-surface px-2 py-1 text-xs text-ink"
                />
              )}
            </span>
            <button type="button" onClick={() => setNotice(null)} aria-label="OK" className="font-semibold">
              ×
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-6">
          <section className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-lg font-semibold">{t('calc.mainTitle')}</h2>
            <p className="mt-1 text-sm text-muted">{t('calc.mainIntro')}</p>
            <div className="mt-2 divide-y divide-line">{MAIN_FIELDS.map((k) => field(k, true))}</div>
          </section>

          <button
            type="button"
            aria-expanded={expert}
            onClick={() => setExpert((v) => !v)}
            className="w-full rounded-xl border border-dashed border-line px-4 py-3 text-sm font-semibold hover:border-ink"
          >
            {expert ? `− ${t('expert.close')}` : `+ ${t('expert.open')}`}
          </button>

          {expert && (
            <div className="space-y-4">
              <p className="text-sm text-muted">{t('expert.intro')}</p>
              {EXPERT_GROUPS.map((group) => (
                <details key={group.id} className="rounded-xl border border-line bg-surface px-5 py-3" open>
                  <summary className="cursor-pointer font-semibold">{t(`groups.${group.id}.title`)}</summary>
                  <div className="mt-1 divide-y divide-line">{group.keys.map((k) => field(k))}</div>
                </details>
              ))}
              <details className="rounded-xl border border-line bg-surface px-5 py-3" open>
                <summary className="cursor-pointer font-semibold">{t('season.title')}</summary>
                <div className="mt-2">
                  <SeasonEditor
                    inputs={inputs}
                    onChange={(part) => {
                      setInputs((prev) => ({ ...prev, ...part }))
                      markEdited()
                    }}
                  />
                </div>
              </details>
            </div>
          )}
        </div>

        <div className="space-y-6 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
          <ResultSummary year={year} inputs={inputs} baseYear={changedCount > 0 ? baseYear : undefined} />
          <WhatItTakes year={year} inputs={inputs} />
          <YearChart year={year} inputs={inputs} />
          <Breakdown year={year} />
        </div>
      </div>
    </div>
  )
}
