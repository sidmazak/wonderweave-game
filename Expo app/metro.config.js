const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

const extraBlocks = [
  /[\\/]web[\\/].*/,
  /[\\/]test-artifacts[\\/].*/,
  /[\\/]documentation[\\/].*/,
]

config.resolver.blockList = extraBlocks

module.exports = config
