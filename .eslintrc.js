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
    'no-alert': 'off',
    'no-console': 'off',
    'no-duplicate-imports': 'error',
    'no-shadow': 'off',
    'no-unreachable': 'error',
    'no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^(React|_)',
      ignoreRestSiblings: true,
    }],
    'object-shorthand': ['warn', 'always'],
    'prefer-const': ['warn', {
      destructuring: 'all',
    }],
    'react-native/no-inline-styles': 'off',
    'react/no-unstable-nested-components': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'jest/no-disabled-tests': 'off',
  },
};
