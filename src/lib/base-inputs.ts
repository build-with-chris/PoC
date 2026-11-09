import { EXAMPLE_INPUTS, mergeInputs, parsePartialInputs } from './inputs'
import type { Inputs } from './model'

export const ENV_KEY = 'PEPE_DOME_WERTE'

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
 */
export function getBaseInputs(): BaseInputs {
  const raw = process.env[ENV_KEY]
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
