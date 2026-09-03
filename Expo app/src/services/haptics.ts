import * as Haptics from 'expo-haptics'

export async function playHaptic(pattern: unknown): Promise<void> {
  try {
    const duration = Array.isArray(pattern) ? Number(pattern[0]) || 20 : Number(pattern) || 20
    if (duration >= 40) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    } else if (duration >= 20) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  } catch {
    /* emulator / missing vibrator */
  }
}
