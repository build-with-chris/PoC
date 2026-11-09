/**
 * Gibt die Grundwerte als einzeiliges JSON aus, fertig zum Einfuegen in
 * PEPE_DOME_WERTE (lokal in .env, online in Vercel unter
 * Settings > Environment Variables).
 *
 * Ist PEPE_DOME_WERTE in .env gesetzt, wird der aktuelle Stand ausgegeben,
 * sonst die Beispielwerte.
 *
 *   npm run werte:vorlage
 */
import { getBaseInputs, ENV_KEY } from '../src/lib/base-inputs'

try {
  process.loadEnvFile('.env')
} catch {
  // keine .env vorhanden, dann eben Beispielwerte
}

const { inputs, source } = getBaseInputs()
console.error(source === 'env' ? `Aktueller Stand aus ${ENV_KEY}:` : `${ENV_KEY} ist nicht gesetzt. Beispielwerte:`)
console.log(JSON.stringify(inputs))
