import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getBaseInputs } from './base-inputs'
import { EXAMPLE_INPUTS } from './inputs'

test('Ohne Variablen gelten die Beispielwerte', () => {
  const r = getBaseInputs({})
  assert.equal(r.source, 'example')
  assert.deepEqual(r.inputs, EXAMPLE_INPUTS)
})

test('PEPE_DOME_WERTE ueberschreibt einzelne Felder', () => {
  const r = getBaseInputs({ PEPE_DOME_WERTE: '{"ticketPrice":21}' })
  assert.equal(r.source, 'env')
  assert.equal(r.inputs.ticketPrice, 21)
  assert.equal(r.inputs.guestsPerShow, EXAMPLE_INPUTS.guestsPerShow)
})

test('PEPE_DOME_KONTOSTAND ersetzt den Kontostand, auch in deutscher Schreibweise', () => {
  assert.equal(getBaseInputs({ PEPE_DOME_WERTE: '{}', PEPE_DOME_KONTOSTAND: '12.345,50' }).inputs.startingCash, 12345.5)
  assert.equal(getBaseInputs({ PEPE_DOME_KONTOSTAND: '8000' }).inputs.startingCash, 8000)
  assert.equal(getBaseInputs({ PEPE_DOME_KONTOSTAND: 'viel' }).inputs.startingCash, EXAMPLE_INPUTS.startingCash)
})
