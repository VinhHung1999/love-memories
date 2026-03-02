const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

// shared/ lives outside the mobile/ project root — must be in watchFolders
// so Metro can resolve and process @shared/* imports.
const sharedDir = path.resolve(__dirname, '../shared');

const config = mergeConfig(getDefaultConfig(__dirname), {
  watchFolders: [sharedDir],
});

module.exports = withNativeWind(config, { input: './src/global.css' });
