module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // NativeWind v4 — must be before other plugins that transform JSX
    'nativewind/babel',
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
        },
      },
    ],
  ],
};
