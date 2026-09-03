export const WEB_TO_NATIVE_TYPES = [
  'SAVE_DATA',
  'HAPTIC',
  'READY',
  'ERROR',
  'BACK_RESULT',
  'EXIT_REQUEST',
  'DIAGNOSTICS',
] as const

export const NATIVE_TO_WEB_TYPES = [
  'HYDRATE',
  'BACK',
  'SAFE_AREA',
  'LIFECYCLE',
  'APP_VERSION',
] as const

export type WebToNativeType = (typeof WEB_TO_NATIVE_TYPES)[number]
export type NativeToWebType = (typeof NATIVE_TO_WEB_TYPES)[number]

export type SavePayload = {
  key: string
  value: string | null
}

export type WebToNativeMessage =
  | { type: 'SAVE_DATA'; payload: SavePayload }
  | { type: 'HAPTIC'; payload: { pattern?: number | number[] } }
  | { type: 'READY'; payload?: { hasRoot?: boolean; splash?: boolean; href?: string } }
  | { type: 'ERROR'; payload: { message: string; source?: string } }
  | { type: 'BACK_RESULT'; payload: { handled: boolean; via?: string } }
  | { type: 'EXIT_REQUEST' }
  | { type: 'DIAGNOSTICS'; payload?: unknown }

export type NativeToWebMessage =
  | { type: 'HYDRATE'; payload: Record<string, string> }
  | { type: 'BACK' }
  | { type: 'SAFE_AREA'; payload: { top: number; bottom: number; left: number; right: number } }
  | { type: 'LIFECYCLE'; payload: 'background' | 'foreground' }
  | { type: 'APP_VERSION'; payload: { version: string } }

export const STORAGE_BACKUP_KEY = 'ww-native-backup-v1'

export function parseBridgeMessage(raw: unknown): { type: string; payload?: unknown } | null {
  let value: unknown = raw
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw)
    } catch {
      return null
    }
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const type = (value as { type?: unknown }).type
  if (typeof type !== 'string' || type.length === 0 || type.length > 64) return null
  return value as { type: string; payload?: unknown }
}

export function isWebToNativeMessage(raw: unknown): raw is WebToNativeMessage {
  const msg = parseBridgeMessage(raw)
  if (!msg) return false
  return (WEB_TO_NATIVE_TYPES as readonly string[]).includes(msg.type)
}

export function isSavePayload(payload: unknown): payload is SavePayload {
  if (typeof payload !== 'object' || payload === null) return false
  const p = payload as { key?: unknown; value?: unknown }
  if (typeof p.key !== 'string' || p.key.length === 0 || p.key.length > 128) return false
  if (!p.key.startsWith('ww-')) return false
  if (p.value !== null && typeof p.value !== 'string') return false
  if (typeof p.value === 'string' && p.value.length > 500_000) return false
  return true
}

export function applySave(
  current: Record<string, string>,
  patch: SavePayload,
): Record<string, string> {
  const next = { ...current }
  if (patch.key === 'ww-__clear__') return {}
  if (patch.value == null) delete next[patch.key]
  else next[patch.key] = patch.value
  return next
}

export function sanitizeBackup(raw: unknown): Record<string, string> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof k !== 'string' || !k.startsWith('ww-')) continue
    if (typeof v !== 'string') continue
    if (v.length > 500_000) continue
    out[k] = v
  }
  return out
}

export function serializeNativeMessage(msg: NativeToWebMessage): string {
  return JSON.stringify(msg)
}
