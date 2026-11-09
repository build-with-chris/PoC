import { COST_KEYS, REVENUE_KEYS, type Inputs, type YearResult } from './model'
import { FIELDS, EXPERT_GROUPS } from './fields'
import { formatEuro, formatValue, monthName } from './format'

type T = (key: string, values?: Record<string, string | number>) => string

/** Monatstabelle als CSV (Semikolon, fuer deutsches Excel). */
export function buildCsv(year: YearResult, locale: string, t: T): string {
  const sep = ';'
  const num = (v: number) => (locale === 'de' ? v.toFixed(2).replace('.', ',') : v.toFixed(2))
  const header = [t('export.row'), ...year.months.map((m) => monthName(m.index, locale)), t('export.year')]
  const row = (label: string, values: number[]) => [label, ...values.map(num), num(values.reduce((a, b) => a + b, 0))]

  const rows: string[][] = [header]
  rows.push([t('export.activity'), ...year.months.map((m) => String(m.activity)), ''])
  for (const k of REVENUE_KEYS) rows.push(row(`${t('export.income')}: ${t(`revenue.${k}`)}`, year.months.map((m) => m.revenue[k])))
  rows.push(row(t('export.totalIncome'), year.months.map((m) => m.totalRevenue)))
  for (const k of COST_KEYS) rows.push(row(`${t('export.cost')}: ${t(`costs.${k}`)}`, year.months.map((m) => m.costs[k])))
  rows.push(row(t('export.totalCosts'), year.months.map((m) => m.totalCosts)))
  rows.push(row(t('export.result'), year.months.map((m) => m.result)))
  rows.push([t('export.balance'), ...year.months.map((m) => num(m.balance)), ''])

  const escape = (cell: string) => (/[;"\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell)
  return '﻿' + rows.map((r) => r.map(escape).join(sep)).join('\r\n')
}

/** Kurzer Bericht als Textdatei. */
export function buildReport(name: string, inputs: Inputs, year: YearResult, locale: string, t: T): string {
  const e = (v: number, signed = false) => formatEuro(v, locale, signed)
  const lines: string[] = []
  lines.push(`${t('export.reportTitle')}: ${name}`)
  lines.push(`${t('export.createdAt')}: ${new Date().toLocaleString(locale)}`)
  lines.push('')
  lines.push(`== ${t('export.summary')} ==`)
  lines.push(`${t('result.avgMonth')}: ${e(year.avgMonthlyResult, true)}`)
  lines.push(`${t('result.year')}: ${e(year.yearResult, true)}`)
  lines.push(`${t('export.totalIncome')}: ${e(year.totalRevenue)}`)
  lines.push(`${t('export.totalCosts')}: ${e(year.totalCosts)}`)
  lines.push(`${t('result.startBalance')}: ${e(year.startBalance)}`)
  lines.push(`${t('result.endBalance')}: ${e(year.endBalance)}`)
  lines.push(`${t('result.lowestBalance')}: ${e(year.lowestBalance)}`)
  lines.push('')
  lines.push(`== ${t('export.perMonth')} ==`)
  for (const m of year.months) {
    lines.push(
      `${monthName(m.index, locale, 'long').padEnd(10)} ${t('export.income')} ${e(m.totalRevenue).padStart(10)}  ${t('export.cost')} ${e(m.totalCosts).padStart(10)}  ${t('export.result')} ${e(m.result, true).padStart(10)}  ${t('export.balance')} ${e(m.balance).padStart(10)}`,
    )
  }
  lines.push('')
  lines.push(`== ${t('export.inputs')} ==`)
  for (const group of EXPERT_GROUPS) {
    lines.push(`-- ${t(`groups.${group.id}.title`)}`)
    for (const key of group.keys) {
      lines.push(`${t(`fields.${key}.label`)}: ${formatValue(inputs[key], FIELDS[key].unit, locale)}`)
    }
  }
  lines.push(`-- ${t('season.title')}`)
  lines.push(
    inputs.activity
      .map((a, i) => `${monthName(i, locale)} ${a} %${inputs.winterMonths[i] ? ` (${t('season.winterShort')})` : ''}`)
      .join(', '),
  )
  lines.push('')
  lines.push(t('export.note'))
  return lines.join('\n')
}

export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
