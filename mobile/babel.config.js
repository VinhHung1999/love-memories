module.exports = {
  // 'nativewind/babel' MUST be in presets, not plugins.
  // It is a Babel preset (returns { plugins: [...] }). Placing it in
  // plugins[] causes "[BABEL] .plugins is not a valid Plugin property"
  // because plugins must return a visitor, not a { plugins } object.
  presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
  plugins: [
    'react-native-worklets/plugin',
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
