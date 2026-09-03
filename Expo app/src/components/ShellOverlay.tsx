import { Image, StyleSheet, Text, View, Pressable } from 'react-native'

/** Boot bridge: same look as the native splash — image only, no title text. */
export function ShellLoading() {
  return (
    <View style={styles.fill} accessibilityLabel="Loading" pointerEvents="none">
      <Image source={require('../../assets/splash-icon.png')} style={styles.logo} resizeMode="contain" />
    </View>
  )
}

export function ShellError({
  message,
  onRetry,
  diagnostic,
}: {
  message: string
  onRetry: () => void
  diagnostic?: string
}) {
  return (
    <View style={styles.fill} accessibilityRole="alert">
      <Image source={require('../../assets/splash-icon.png')} style={styles.logoSmall} resizeMode="contain" />
      <Text style={styles.sub}>{message}</Text>
      {__DEV__ && diagnostic ? <Text style={styles.diag}>{diagnostic}</Text> : null}
      <Pressable onPress={onRetry} style={styles.btn} accessibilityRole="button">
        <Text style={styles.btnText}>Try again</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#101d13',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 20,
  },
  logo: {
    width: 220,
    height: 220,
  },
  logoSmall: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  sub: {
    fontSize: 15,
    color: '#c9b080',
    textAlign: 'center',
    marginBottom: 16,
  },
  diag: {
    fontSize: 11,
    color: '#8a6a3a',
    textAlign: 'center',
    marginBottom: 16,
  },
  btn: {
    backgroundColor: '#dfb36a',
    borderColor: '#7c4a1e',
    borderWidth: 2,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  btnText: {
    color: '#5d3a1a',
    fontWeight: '700',
  },
})
