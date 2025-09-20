import React, { memo } from 'react';
import { StyleSheet, View, Text, Image as RNImage } from 'react-native';
import FastImage from 'react-native-fast-image';

const logoResource = require('../assets/appstore.png');
const resolvedLogo = RNImage.resolveAssetSource(logoResource);

const fastImageSource = resolvedLogo?.uri
  ? {
      uri: resolvedLogo.uri,
      cache: FastImage.cacheControl.immutable,
      priority: FastImage.priority.high,
    }
  : logoResource;

if (resolvedLogo?.uri) {
  FastImage.preload([{ uri: resolvedLogo.uri }]);
}

const FooterBrand = ({ containerStyle, logoStyle, textStyle }) => (
  <View style={[styles.container, containerStyle]}>
    <FastImage
      source={fastImageSource}
      style={[styles.logo, logoStyle]}
      resizeMode={FastImage.resizeMode.contain}
      accessibilityRole="image"
      accessibilityLabel="Liquid Spirit"
    />
    <Text style={[styles.text, textStyle]}>Liquid Spirit</Text>
  </View>
);

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
});

export default memo(FooterBrand);
