import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as SplashScreen from 'expo-splash-screen'
import { GameScreen } from '../screens/GameScreen'

// Keep the native splash up until the WebView posts READY (branded in-game loader takes over).
void SplashScreen.preventAutoHideAsync().catch(() => {
  /* already prevented / unavailable */
})

export default function App() {
  useEffect(() => {
    // Safety: never leave users stuck on the native splash if the bridge fails.
    const t = setTimeout(() => {
      void SplashScreen.hideAsync().catch(() => {})
    }, 12_000)
    return () => clearTimeout(t)
  }, [])

  return (
    <SafeAreaProvider>
      <GameScreen
        onGameReady={() => {
          void SplashScreen.hideAsync().catch(() => {})
        }}
      />
    </SafeAreaProvider>
  )
}
