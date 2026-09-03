/** Shared native ↔ WebView message contract. Keep in sync with src/bridge/protocol.ts */

export const WEB_TO_NATIVE_TYPES = [
  'SAVE_DATA',
  'HAPTIC',
  'READY',
  'ERROR',
  'BACK_RESULT',
  'EXIT_REQUEST',
  'DIAGNOSTICS',
]

export const NATIVE_TO_WEB_TYPES = [
  'HYDRATE',
  'BACK',
  'SAFE_AREA',
  'LIFECYCLE',
  'APP_VERSION',
]

export const PERSIST_KEYS = [
  'ww-player-id',
  'ww-player-name',
  'ww-progress',
  'ww-lumens',
  'ww-inventory',
  'ww-daily',
  'ww-settings',
  'ww-codex',
  'ww-codex-seen',
]

export const STORAGE_BACKUP_KEY = 'ww-native-backup-v1'

/**
 * @param {unknown} raw
 * @returns {raw is { type: string, payload?: unknown }}
 */
export function parseBridgeMessage(raw) {
  if (raw == null) return false
  let value = raw
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw)
    } catch {
      return false
    }
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  if (typeof value.type !== 'string' || value.type.length === 0 || value.type.length > 64) {
    return false
  }
  return true
}

/**
 * @param {unknown} raw
 */
export function isWebToNativeMessage(raw) {
  if (!parseBridgeMessage(raw)) return false
  const msg = typeof raw === 'string' ? JSON.parse(raw) : raw
  return WEB_TO_NATIVE_TYPES.includes(msg.type)
}

/**
 * @param {unknown} payload
 * @returns {payload is { key: string, value: string | null }}
 */
export function isSavePayload(payload) {
  if (typeof payload !== 'object' || payload === null) return false
  if (typeof payload.key !== 'string' || payload.key.length === 0 || payload.key.length > 128) {
    return false
  }
  if (!payload.key.startsWith('ww-')) return false
  if (payload.value !== null && typeof payload.value !== 'string') return false
  if (typeof payload.value === 'string' && payload.value.length > 500_000) return false
  return true
}

/**
 * Merge a save into the backup object. Returns a new object.
 * @param {Record<string, string>} current
 * @param {{ key: string, value: string | null }} patch
 */
export function applySave(current, patch) {
  const next = { ...current }
  if (patch.key === 'ww-__clear__') return {}
  if (patch.value == null) delete next[patch.key]
  else next[patch.key] = patch.value
  return next
}

/**
 * @param {unknown} raw
 * @returns {Record<string, string>}
 */
export function sanitizeBackup(raw) {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
  /** @type {Record<string, string>} */
  const out = {}
  for (const [k, v] of Object.entries(raw)) {
    if (typeof k !== 'string' || !k.startsWith('ww-')) continue
    if (typeof v !== 'string') continue
    if (v.length > 500_000) continue
    out[k] = v
  }
  return out
}
