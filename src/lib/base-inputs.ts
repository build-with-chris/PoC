import { EXAMPLE_INPUTS, mergeInputs, parsePartialInputs } from './inputs'
import type { Inputs } from './model'

export const ENV_KEY = 'PEPE_DOME_WERTE'
/** Eigene Variable fuer den Kontostand, damit er getrennt und privat gepflegt werden kann. */
export const BALANCE_ENV_KEY = 'PEPE_DOME_KONTOSTAND'

export interface BaseInputs {
  inputs: Inputs
  source: 'env' | 'example'
}

/**
 * Liest die Grundwerte aus der Umgebungsvariable PEPE_DOME_WERTE.
 *
 * Nur auf dem Server aufrufen. Die Variable enthaelt ein JSON-Objekt mit
 * beliebig vielen Feldern aus Inputs; fehlende Felder kommen aus den
 * Beispielwerten. Ist sie leer oder fehlerhaft, gelten die Beispielwerte.
 *
 * Ist PEPE_DOME_KONTOSTAND gesetzt (eine Zahl), ersetzt sie startingCash.
 */
export function getBaseInputs(env: Record<string, string | undefined> = process.env): BaseInputs {
  const result = readValues(env[ENV_KEY])
  const balance = readBalance(env[BALANCE_ENV_KEY])
  if (balance === null) return result
  return { ...result, inputs: { ...result.inputs, startingCash: balance } }
}

function readValues(raw: string | undefined): BaseInputs {
  if (!raw || !raw.trim()) return { inputs: EXAMPLE_INPUTS, source: 'example' }

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    console.error(`[${ENV_KEY}] ist kein gueltiges JSON. Es werden Beispielwerte verwendet.`)
    return { inputs: EXAMPLE_INPUTS, source: 'example' }
  }

  const parsed = parsePartialInputs(json)
  if (!parsed.ok) {
    console.error(`[${ENV_KEY}] passt nicht zum erwarteten Aufbau: ${parsed.error}. Es werden Beispielwerte verwendet.`)
    return { inputs: EXAMPLE_INPUTS, source: 'example' }
  }

  return { inputs: mergeInputs(EXAMPLE_INPUTS, parsed.data), source: 'env' }
}

/** Erlaubt auch deutsche Schreibweise wie 12.345,67 oder 12345,67. */
function readBalance(raw: string | undefined): number | null {
  if (!raw || !raw.trim()) return null
  const text = raw.trim().replace(/\s|€/g, '')
  const normalized = text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text
  const n = Number(normalized)
  if (!Number.isFinite(n)) {
    console.error(`[${BALANCE_ENV_KEY}] ist keine Zahl und wird ignoriert.`)
    return null
  }
  return n
}
