import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../styles/theme';
import FastImage from 'react-native-fast-image';

const BasicTile = ({ heading, subheading, icon, iconColor, headingColor, subheadingColor, headingStyle, subheadingStyle, dateTime, dateTimeStyle, onPress, imageSource, bgImgColour, overlayColor, style }) => {
  // Background image mapping
  const BG_IMAGES = {
    blue: require('../assets/img/bgCovers/blue.png'),
    red: require('../assets/img/bgCovers/red.png'),
    green: require('../assets/img/bgCovers/green.png'),
  };
  // Choose provided imageSource or bgImgColour default
  const finalImageSource = imageSource || (bgImgColour && BG_IMAGES[bgImgColour]);
  const Container = finalImageSource ? FastImage : View;
  const containerProps = finalImageSource
    ? { source: finalImageSource, style: styles.container, imageStyle: styles.imageStyle }
    : { style: styles.container };

  return (
    <TouchableOpacity onPress={onPress} style={[styles.wrapper, style]}>
      <Container {...containerProps}>
        {overlayColor && <View style={[styles.overlay, { backgroundColor: overlayColor }]} />}
        <View>
        {heading && (
            <Text
              style={[
                styles.heading,
                headingColor ? { color: headingColor } : null,
                headingStyle || null,
              ]}
            >
              {heading}
            </Text>
          )}
          {subheading && (
            <Text
              style={[
                styles.subheading,
                subheadingColor ? { color: subheadingColor } : null,
                subheadingStyle || null,
              ]}
            >
              {subheading}
            </Text>
          )}
        </View>
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={16} color={iconColor || themeVariables.whiteColor} />
          </View>
        )}
        {dateTime && (
          <Text style={[styles.dateTime, dateTimeStyle || null]}>{dateTime}</Text>
        )}
      </Container>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    borderRadius: 8,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heading: {
    fontSize: 12,
    fontWeight: '600',
    color: themeVariables.whiteColor,
    textDecorationLine: 'underline',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 12,
    color: themeVariables.whiteColor,
  },
  iconContainer: {
    alignSelf: 'flex-end',
  },
  imageStyle: {
    resizeMode: 'cover',
  },
  dateTime: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    fontSize: 14,
    color: themeVariables.whiteColor,
    width: Platform.select({ android: 160 }),
  },
});

export default BasicTile;
