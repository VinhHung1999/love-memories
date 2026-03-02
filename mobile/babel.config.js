module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // nativewind/babel MUST be here — it transforms JSX className props into
    // React Native style objects at compile time. Without it className is ignored.
    // The previous crash ("[BABEL] .plugins is not a valid Plugin property") was
    // caused by module-resolver failing on @shared paths that were outside
    // Metro's project root (missing watchFolders), not by this plugin.
    // watchFolders is now set in metro.config.js, which fixes that crash.
    'nativewind/babel',
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
