module.exports = {
  preset: 'react-native',
  // Ignore the default App.tsx test which uses TSX without proper transform
  testPathIgnorePatterns: ['<rootDir>/__tests__/App.test.tsx'],
  // Use babel-jest to transform JS and TS files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  // Transform modules from react-native and specific ESM packages
  // Transform specific modules that use ESM syntax
  transformIgnorePatterns: [
    // Allow ESM modules in react-native and selected packages to be transformed
    'node_modules/(?!(react-native|@react-native|react-native-progress|react-native-config|react-native-vector-icons)/)',
  ],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
};
