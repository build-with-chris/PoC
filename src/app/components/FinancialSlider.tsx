/**
 * Wiederverwendbare Slider-Komponente für Finanz-Inputs
 * 
 * Diese Komponente reduziert Code-Duplikation bei der Darstellung von Reglern
 * für Kosten- und Einnahmen-Eingaben.
 */

import { FinancialInputs } from '@/types/financial-scenario'

interface FinancialSliderProps {
  /** Label für den Slider */
  label: string
  /** Aktueller Wert */
  value: number
  /** Callback beim Ändern des Werts */
  onChange: (value: number) => void
  /** Minimaler Wert */
  min?: number
  /** Maximaler Wert */
  max?: number
  /** Schrittweite */
  step?: number
  /** Optional: Zusätzliche Info-Zeile unter dem Slider */
  info?: string
  /** Optional: Währungssymbol anzeigen */
  showCurrency?: boolean
  /** Optional: CSS-Klassen für das Label */
  labelClassName?: string
}

export default function FinancialSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 1000,
  step = 1,
  info,
  showCurrency = false,
  labelClassName = 'block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2',
}: FinancialSliderProps) {
  const displayValue = showCurrency ? `${value.toFixed(0)} €` : value.toString()

  return (
    <div>
      <label className={labelClassName}>
        {label}: {displayValue}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
      />
      {info && <p className="text-xs text-zinc-500 mt-1">{info}</p>}
    </div>
  )
}

