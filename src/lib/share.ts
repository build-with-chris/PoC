import { parsePartialInputs, type PartialInputs } from './inputs'

/**
 * Teilen per Link. Im Link stehen nur die Werte, die vom Grundstand
 * abweichen. Sie stehen hinter dem #, damit sie nicht an den Server gehen.
 */
const HASH_KEY = 's'

export interface SharedScenario {
  name?: string
  changes: PartialInputs
}

export function encodeScenario(s: SharedScenario): string {
  const json = JSON.stringify({ n: s.name || undefined, c: s.changes })
  const bytes = new TextEncoder().encode(json)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeScenario(encoded: string): SharedScenario | null {
  try {
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const bin = atob(b64)
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    const data = JSON.parse(new TextDecoder().decode(bytes)) as { n?: unknown; c?: unknown }
    const parsed = parsePartialInputs(data.c ?? {})
    if (!parsed.ok) return null
    return { name: typeof data.n === 'string' ? data.n.slice(0, 80) : undefined, changes: parsed.data }
  } catch {
    return null
  }
}

export function buildShareUrl(currentUrl: string, s: SharedScenario): string {
  const url = new URL(currentUrl)
  url.hash = `${HASH_KEY}=${encodeScenario(s)}`
  return url.toString()
}

export function readSharedFromHash(hash: string): SharedScenario | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const value = params.get(HASH_KEY)
  return value ? decodeScenario(value) : null
}
