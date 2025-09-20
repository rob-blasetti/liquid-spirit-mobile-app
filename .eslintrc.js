module.exports = {
  root: true,
  extends: '@react-native',
  env: {
    jest: true,
  },
  ignorePatterns: [
    'android/',
    'ios/',
    'build/',
    'coverage/',
    'Host/',
    'vendor/',
  ],
  rules: {
    curly: ['error', 'multi-line', 'consistent'],
    'react-native/no-inline-styles': 'off',
    'react/no-unstable-nested-components': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'no-unused-vars': 'off',
    'no-shadow': 'off',
    'no-alert': 'off',
    'jest/no-disabled-tests': 'off',
  },
};
