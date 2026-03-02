module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // NOTE: 'nativewind/babel' is intentionally absent here.
    // withNativeWind in metro.config.js injects it internally via its custom
    // babel-transformer. Adding it here too causes double-injection which
    // manifests as "[BABEL] .plugins is not a valid Plugin property" on RN 0.84.
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@shared': '../shared/src',
        },
      },
    ],
  ],
};
