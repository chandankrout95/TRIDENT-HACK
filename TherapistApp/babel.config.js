module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-worklets-core/plugin', // 👈 keep this first
    'react-native-reanimated/plugin',    // 👈 MUST BE LAST
  ],
};