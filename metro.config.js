// metro.config.js
const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// Grab Metro’s defaults for your project root
const defaultConfig = getDefaultConfig(__dirname);

// Break them out so we can extend without losing anything
const { transformer, resolver } = defaultConfig;

// Path to your local styleguide package
const styleguidePath = path.resolve(__dirname, '../liquid-spirit-styleguide');
const asyncRequireModulePath = require.resolve(
  'metro-runtime/src/modules/asyncRequire.js',
);

module.exports = mergeConfig(defaultConfig, {
  transformer: {
    // Preserve existing transformer settings and add Less transformer
    ...transformer,
    // Ensure Metro points at the hoisted metro-runtime location
    asyncRequireModulePath,
    babelTransformerPath: require.resolve('react-native-less-transformer'),
  },
  resolver: {
    // Preserve existing resolver settings and add .less extension
    ...resolver,
    sourceExts: [...resolver.sourceExts, 'less'],
    extraNodeModules: {
      ...(resolver.extraNodeModules || {}),
      'liquid-spirit-styleguide': styleguidePath,
    },
  },
  watchFolders: [...(defaultConfig.watchFolders || []), styleguidePath],
});
