# Environment

Recorded for the Windows Android migration host. Absolute paths are **local notes** — do not hard-require them in committed app config.

| Tool | Notes |
| --- | --- |
| Node.js | v22.x recommended (20+ OK) |
| npm | 10.x |
| JDK for Gradle | **17** — set `JAVA_HOME` to JDK 17 (JDK 25 on PATH breaks AGP) |
| Android SDK | `ANDROID_HOME` / `ANDROID_SDK_ROOT` |
| Platforms | API 35 / 36 |
| Build-tools | 35 / 36 |
| ADB | SDK `platform-tools` |
| AVD example | API 35 phone image (e.g. `Metronoma_API35`) |
| Expo SDK | 54 |
| React Native | 0.81.x |
| React | 19.1.x |
| react-native-webview | 13.15.x |

## Suggested env (bash)

```bash
export JAVA_HOME="/path/to/jdk-17"
export ANDROID_HOME="/path/to/AndroidSDK"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
```

Gradle / AGP versions come from Expo SDK 54 prebuild.

## Expo Go

Not supported for this game packaging path — the APK must include `assets/www`. Use `expo run:android` or a release APK.
