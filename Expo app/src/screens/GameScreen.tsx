import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BackHandler,
  Platform,
  StyleSheet,
  View,
  type AppStateStatus,
  AppState,
} from 'react-native'
import { WebView } from 'react-native-webview'
import type { WebViewMessageEvent, WebViewNavigation } from 'react-native-webview'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ScreenOrientation from 'expo-screen-orientation'
import { useKeepAwake } from 'expo-keep-awake'
import * as NavigationBar from 'expo-navigation-bar'
import { StatusBar } from 'expo-status-bar'
import { ShellError, ShellLoading } from '../components/ShellOverlay'
import {
  applySave,
  isSavePayload,
  isWebToNativeMessage,
  parseBridgeMessage,
  serializeNativeMessage,
} from '../bridge/protocol'
import { loadBackup, persistBackup } from '../storage/persistStore'
import { GAME_FILE_URI, hydrateInjection } from '../services/webviewBundle'
import { playHaptic } from '../services/haptics'

type ShellState = 'booting' | 'ready' | 'failed'

export function GameScreen({ onGameReady }: { onGameReady?: () => void }) {
  useKeepAwake()
  const insets = useSafeAreaInsets()
  const webRef = useRef<WebView>(null)
  const backupRef = useRef<Record<string, string>>({})
  const [hydratedJs, setHydratedJs] = useState('true;')
  const [shell, setShell] = useState<ShellState>('booting')
  const [error, setError] = useState<string>('')
  const [reloadKey, setReloadKey] = useState(0)
  const readyOnce = useRef(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const backup = await loadBackup()
      if (!alive) return
      backupRef.current = backup
      setHydratedJs(hydrateInjection(backup))
    })()
    return () => {
      alive = false
    }
  }, [reloadKey])

  useEffect(() => {
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
    if (Platform.OS === 'android') {
      void NavigationBar.setVisibilityAsync('hidden')
    }
  }, [])

  const postToWeb = useCallback((msg: Parameters<typeof serializeNativeMessage>[0]) => {
    const json = serializeNativeMessage(msg)
    webRef.current?.postMessage(json)
    webRef.current?.injectJavaScript(
      `try{window.__WW_ON_NATIVE_MESSAGE__&&window.__WW_ON_NATIVE_MESSAGE__(${json});}catch(e){} true;`,
    )
  }, [])

  useEffect(() => {
    postToWeb({
      type: 'SAFE_AREA',
      payload: {
        top: insets.top,
        bottom: insets.bottom,
        left: insets.left,
        right: insets.right,
      },
    })
  }, [insets.bottom, insets.left, insets.right, insets.top, postToWeb, shell])

  useEffect(() => {
    const onChange = (status: AppStateStatus) => {
      postToWeb({ type: 'LIFECYCLE', payload: status === 'active' ? 'foreground' : 'background' })
    }
    const sub = AppState.addEventListener('change', onChange)
    return () => sub.remove()
  }, [postToWeb])

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      postToWeb({ type: 'BACK' })
      return true
    })
    return () => sub.remove()
  }, [postToWeb])

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const parsed = parseBridgeMessage(event.nativeEvent.data)
      if (!parsed || !isWebToNativeMessage(parsed)) return
      switch (parsed.type) {
        case 'SAVE_DATA': {
          if (!isSavePayload(parsed.payload)) return
          backupRef.current = applySave(backupRef.current, parsed.payload)
          void persistBackup(backupRef.current)
          break
        }
        case 'HAPTIC':
          void playHaptic(parsed.payload?.pattern)
          break
        case 'READY':
          // Drop the RN boot overlay first, then dismiss the native splash so
          // users never see a text-only "Wonderweave" flash between images.
          setShell('ready')
          if (!readyOnce.current) {
            readyOnce.current = true
            requestAnimationFrame(() => {
              onGameReady?.()
            })
          }
          postToWeb({
            type: 'SAFE_AREA',
            payload: {
              top: insets.top,
              bottom: insets.bottom,
              left: insets.left,
              right: insets.right,
            },
          })
          postToWeb({ type: 'HYDRATE', payload: backupRef.current })
          break
        case 'ERROR':
          if (__DEV__) setError(parsed.payload.message)
          break
        case 'EXIT_REQUEST':
          BackHandler.exitApp()
          break
        default:
          break
      }
    },
    [insets.bottom, insets.left, insets.right, insets.top, onGameReady, postToWeb],
  )

  const onNav = useCallback((request: WebViewNavigation) => {
    const url = request.url || ''
    if (url.startsWith('file://') || url === 'about:blank') return true
    return false
  }, [])

  const injectedBefore = useMemo(() => hydratedJs, [hydratedJs])

  const retry = useCallback(() => {
    setError('')
    setShell('booting')
    setReloadKey((k) => k + 1)
  }, [])

  return (
    <View style={styles.root}>
      <StatusBar style="light" hidden translucent backgroundColor="transparent" />
      <WebView
        key={reloadKey}
        ref={webRef}
        source={{ uri: GAME_FILE_URI }}
        style={styles.webview}
        originWhitelist={['file://*', 'about:blank']}
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        allowingReadAccessToURL={GAME_FILE_URI}
        mixedContentMode="never"
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        thirdPartyCookiesEnabled={false}
        setSupportMultipleWindows={false}
        javaScriptCanOpenWindowsAutomatically={false}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        bounces={false}
        overScrollMode="never"
        nestedScrollEnabled={false}
        scalesPageToFit={false}
        setBuiltInZoomControls={false}
        setDisplayZoomControls={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        androidLayerType="hardware"
        webviewDebuggingEnabled={__DEV__}
        startInLoadingState={false}
        injectedJavaScriptBeforeContentLoaded={injectedBefore}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={onNav}
        onError={(e) => {
          setShell('failed')
          setError(e.nativeEvent.description || 'WebView failed to load the game bundle')
        }}
        onHttpError={() => {
          setShell('failed')
          setError('The packaged game bundle could not be read')
        }}
        onLoadEnd={() => {
          postToWeb({
            type: 'SAFE_AREA',
            payload: {
              top: insets.top,
              bottom: insets.bottom,
              left: insets.left,
              right: insets.right,
            },
          })
        }}
      />
      {shell === 'booting' ? <ShellLoading /> : null}
      {shell === 'failed' ? (
        <ShellError
          message="The Folio could not be opened."
          diagnostic={error}
          onRetry={retry}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#101d13',
  },
  webview: {
    flex: 1,
    backgroundColor: '#101d13',
  },
})
