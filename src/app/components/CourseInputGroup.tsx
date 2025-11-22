/**
 * Komponente für die Eingabe von Kurs-Parametern
 * 
 * Reduziert Code-Duplikation für die 3 Kurse (Kurs 1, 2, 3)
 */

import { FinancialInputs } from '@/types/financial-scenario'
import FinancialSlider from './FinancialSlider'

interface CourseInputGroupProps {
  /** Kurs-Nummer (1, 2 oder 3) */
  courseNumber: 1 | 2 | 3
  /** Übersetzung-Funktion */
  t: (key: string) => string
  /** Locale für Text-Anzeige */
  locale: string
  /** Input-Werte */
  inputs: FinancialInputs
  /** Callback zum Aktualisieren eines Inputs */
  onUpdateInput: <K extends keyof FinancialInputs>(key: K, value: FinancialInputs[K]) => void
  /** Berechnete Einnahmen pro Woche für diesen Kurs */
  weeklyRevenue: number
}

export default function CourseInputGroup({
  courseNumber,
  t,
  locale,
  inputs,
  onUpdateInput,
  weeklyRevenue,
}: CourseInputGroupProps) {
  // Dynamische Feldnamen basierend auf Kurs-Nummer
  // Konsistente Benennung: course{Number}PricePerParticipant, course{Number}Participants, etc.
  const priceKey = `course${courseNumber}PricePerParticipant` as keyof FinancialInputs
  const participantsKey = `course${courseNumber}Participants` as keyof FinancialInputs
  const perWeekKey = `course${courseNumber}PerWeek` as keyof FinancialInputs
  const trainerCostsKey = `course${courseNumber}TrainerCosts` as keyof FinancialInputs

  const price = inputs[priceKey] as number
  const participants = inputs[participantsKey] as number
  const perWeek = inputs[perWeekKey] as number
  const trainerCosts = inputs[trainerCostsKey] as number

  const courseTitle = t(`course${courseNumber}`)
  const maxParticipants = courseNumber === 3 ? 20 : 30

  return (
    <div className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
      <h4 className="text-sm font-semibold mb-3 text-zinc-700 dark:text-zinc-300">{courseTitle}</h4>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FinancialSlider
          label={t('pricePerParticipant')}
          value={price}
          onChange={(value) => onUpdateInput(priceKey, value)}
          min={10}
          max={30}
          step={1}
          showCurrency
          labelClassName="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
        />
        <FinancialSlider
          label={t('participants')}
          value={participants}
          onChange={(value) => onUpdateInput(participantsKey, value)}
          min={0}
          max={maxParticipants}
          step={1}
          labelClassName="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
        />
        <FinancialSlider
          label={t('trainerCosts')}
          value={trainerCosts}
          onChange={(value) => onUpdateInput(trainerCostsKey, value)}
          min={0}
          max={150}
          step={5}
          showCurrency
          labelClassName="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
        />
        <FinancialSlider
          label={t('coursesPerWeek')}
          value={perWeek}
          onChange={(value) => onUpdateInput(perWeekKey, value)}
          min={0}
          max={7}
          step={1}
          labelClassName="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
        />
      </div>
      <p className="text-xs text-zinc-500 mt-2">
        {t('revenue')}: {(price * participants).toFixed(2)} € - {t('trainerCosts')}: {trainerCosts} € =
        <strong className="text-zinc-700 dark:text-zinc-300"> {weeklyRevenue.toFixed(2)} € / {locale === 'de' ? 'Woche' : 'Week'}</strong>
      </p>
    </div>
  )
}

