import { DEFAULT_START_MONTH, startIndex } from './model'
import type { Unit } from './fields'

export function formatEuro(value: number, locale: string, signed = false) {
  const text = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Math.round(value))
  return signed && value > 0.5 ? `+${text}` : text
}

export function formatNumber(value: number, locale: string, digits = 0) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value)
}

export function formatValue(value: number, unit: Unit, locale: string) {
  if (unit === 'euro') {
    const digits = Number.isInteger(value) ? 0 : 2
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value)
  }
  if (unit === 'percent') return `${formatNumber(value, locale, 1)} %`
  return formatNumber(value, locale, 1)
}

/** Monatsname fuer einen Index im Planungsjahr (0 = Startmonat). */
export function monthName(
  index: number,
  locale: string,
  style: 'short' | 'long' = 'short',
  startMonth: number = DEFAULT_START_MONTH,
) {
  const calendarMonth = (startIndex(startMonth) + index) % 12
  return new Intl.DateTimeFormat(locale, { month: style }).format(new Date(2026, calendarMonth, 1))
}
