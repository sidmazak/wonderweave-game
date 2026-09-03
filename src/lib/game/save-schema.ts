/**
 * Local save schema versioning for Wonderweave `ww-*` keys.
 * Bump SAVE_SCHEMA_VERSION when persisted shapes change, and add a migrate step.
 */

export const SAVE_SCHEMA_VERSION = 1
export const LS_SAVE_VERSION = 'ww-save-version'

export type StorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem?(key: string): void
}

/** Normalize / migrate local saves. Safe to call on every boot. */
export function ensureSaveSchema(storage: StorageLike = localStorage): number {
  let raw = storage.getItem(LS_SAVE_VERSION)
  let version = raw ? Number.parseInt(raw, 10) : 0
  if (!Number.isFinite(version) || version < 0) version = 0

  if (version < 1) {
    // v0 → v1: first versioned schema. Existing ww-* keys already match v1 shapes.
    version = 1
  }

  // Future: if (version < 2) { ...; version = 2 }

  if (version > SAVE_SCHEMA_VERSION) {
    // Newer client wrote data we do not understand — keep keys, pin to known max.
    version = SAVE_SCHEMA_VERSION
  }

  try {
    storage.setItem(LS_SAVE_VERSION, String(version))
  } catch {
    /* quota / private mode */
  }
  return version
}
