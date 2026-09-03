import AsyncStorage from '@react-native-async-storage/async-storage'
import { applySave, sanitizeBackup, STORAGE_BACKUP_KEY, type SavePayload } from '../bridge/protocol'

export async function loadBackup(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_BACKUP_KEY)
    if (!raw) return {}
    return sanitizeBackup(JSON.parse(raw))
  } catch {
    return {}
  }
}

export async function persistBackup(data: Record<string, string>): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_BACKUP_KEY, JSON.stringify(data))
  } catch {
    /* storage full — game localStorage remains source of truth inside the WebView */
  }
}

export async function mergeSave(patch: SavePayload): Promise<Record<string, string>> {
  const current = await loadBackup()
  const next = applySave(current, patch)
  await persistBackup(next)
  return next
}
