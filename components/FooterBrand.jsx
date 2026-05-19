import React, { memo } from 'react';
import { StyleSheet, View, Text, Image as RNImage } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useTheme } from '../contexts/ThemeContext';

const lightLogoResource = require('../assets/footer_logo.png');
const darkLogoResource = require('../assets/footer_logo_dark_mode.png');

const createFastImageSource = resource => {
  const resolvedLogo = RNImage.resolveAssetSource(resource);
  return resolvedLogo?.uri
    ? {
      uri: resolvedLogo.uri,
      cache: FastImage.cacheControl.immutable,
      priority: FastImage.priority.high,
    }
    : resource;
};

const lightLogoSource = createFastImageSource(lightLogoResource);
const darkLogoSource = createFastImageSource(darkLogoResource);
const preloadSources = [lightLogoSource, darkLogoSource].filter(source => source?.uri);

if (preloadSources.length > 0) {
  FastImage.preload(preloadSources);
}

const FooterBrand = ({ containerStyle, logoStyle, textStyle }) => {
  const { isDarkMode } = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      <FastImage
        source={isDarkMode ? darkLogoSource : lightLogoSource}
        style={[styles.logo, logoStyle]}
        resizeMode={FastImage.resizeMode.contain}
        accessibilityRole="image"
        accessibilityLabel="Liquid Spirit"
      />
      <Text style={[styles.text, textStyle, isDarkMode && styles.textDark]}>
        Liquid Spirit
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  text: {
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#999',
  },
  textDark: {
    color: 'rgba(255, 255, 255, 0.72)',
  },
});

export default memo(FooterBrand);
