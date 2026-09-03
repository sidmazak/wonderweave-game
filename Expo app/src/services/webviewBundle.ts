import { Platform } from 'react-native'

export const GAME_FILE_URI =
  Platform.OS === 'android' ? 'file:///android_asset/www/index.html' : 'file://www/index.html'

export const GAME_BASE_URL =
  Platform.OS === 'android' ? 'file:///android_asset/www/' : 'file://www/'

export function hydrateInjection(backup: Record<string, string>): string {
  const payload = JSON.stringify(backup)
  return (
    `window.TURBOPACK_CHUNK_BASE_PATH="./_next/";` +
    `window.__WW_HYDRATE__=${payload};` +
    `if(window.__WW_COMPAT__&&window.__WW_COMPAT__.applyHydrate){window.__WW_COMPAT__.applyHydrate(window.__WW_HYDRATE__);}` +
    `true;`
  )
}
