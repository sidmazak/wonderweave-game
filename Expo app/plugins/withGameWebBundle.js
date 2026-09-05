const { withDangerousMod } = require('expo/config-plugins')
const fs = require('fs')
const path = require('path')

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    if (ent.name === '_originals' || ent.name === '.git' || ent.name === 'node_modules') continue
    const from = path.join(src, ent.name)
    const to = path.join(dest, ent.name)
    if (ent.isDirectory()) copyDir(from, to)
    else if (ent.isFile()) fs.copyFileSync(from, to)
  }
}

/**
 * Pack Expo app/web into android/app/src/main/assets/www so the WebView can
 * load file:///android_asset/www/index.html from the APK with no server.
 * @type {import('expo/config-plugins').ConfigPlugin}
 */
const withGameWebBundle = (config) => {
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const web = path.join(mod.modRequest.projectRoot, 'web')
      const dest = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/assets/www')
      if (!fs.existsSync(path.join(web, 'index.html'))) {
        // Hard failure: warning-and-continue here silently produces an APK with
        // no game in it (or, worse, a stale one from a previous sync).
        throw new Error(
          '[withGameWebBundle] web/index.html is missing — run `npm run game:sync` before prebuild. ' +
            'Refusing to build an APK without the packaged game bundle.',
        )
      }
      fs.rmSync(dest, { recursive: true, force: true })
      copyDir(web, dest)
      return mod
    },
  ])
}

module.exports = withGameWebBundle
