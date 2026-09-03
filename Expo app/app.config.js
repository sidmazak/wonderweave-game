module.exports = {
  expo: {
    name: 'Wonderweave: Match-3 Puzzle',
    slug: 'wonderweave',
    version: '0.2.5',
    description:
      'Cozy offline match-3 puzzle adventure. Swap charms, chain combos, explore floating isles with Pip the lantern bunny — play anytime without an always-online grind.',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    scheme: 'wonderweave',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#101d13',
    },
    primaryColor: '#101d13',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.wonderweave.game',
      requireFullScreen: true,
    },
    android: {
      package: 'com.wonderweave.game',
      versionCode: 25,
      // Launcher label (keep concise for home screen)
      label: 'Wonderweave',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#101d13',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      softwareKeyboardLayoutMode: 'resize',
      allowBackup: true,
      // Play Console listing copy lives in documentation/PLAY_STORE.md
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.wonderweave.game',
    },
    plugins: [
      './plugins/withGameWebBundle.js',
      [
        'expo-screen-orientation',
        {
          initialOrientation: 'PORTRAIT_UP',
        },
      ],
      'expo-navigation-bar',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#101d13',
          image: './assets/splash-icon.png',
          imageWidth: 220,
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            minSdkVersion: 24,
            compileSdkVersion: 36,
            targetSdkVersion: 36,
            kotlinVersion: '2.1.20',
            extraMavenRepos: [],
          },
        },
      ],
    ],
    extra: {
      gameEntrypoint: 'file:///android_asset/www/index.html',
      aso: {
        primaryCategory: 'Puzzle',
        tags: [
          'match 3',
          'match-3',
          'puzzle',
          'casual',
          'cozy',
          'offline',
          'tile matching',
        ],
      },
    },
  },
}
