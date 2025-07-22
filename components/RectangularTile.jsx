import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import themeVariables from '../styles/theme';
import BasicTile from './BasicTile';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 20;
const GUTTER = 10;
const CONTENT_WIDTH = SCREEN_WIDTH - 2 * GRID_PADDING;
const SQUARE_SIZE = (CONTENT_WIDTH - GUTTER) * 0.25;
const RECT_WIDTH = SQUARE_SIZE * 3;
const RECT_HEIGHT = SQUARE_SIZE * 2 + GUTTER;

const RIBBON_HEIGHT = 30;
const RIBBON_WIDTH = RECT_WIDTH * 1.5;

const RectangularTile = ({
  title,
  subheading,
  dateTime,
  imageSource,
  onPress,
  actionIcon,
  actionIconColor,
  bgImgColour,
  style,
  showRibbon = true,
  ribbonText = 'Upcoming',
}) => (
  <View style={[styles.container, style]}>
    <BasicTile
      heading={title}
      subheading={subheading}
      dateTime={dateTime}
      icon={actionIcon}
      iconColor={actionIconColor || themeVariables.whiteColor}
      headingStyle={{ fontSize: 18 }}
      onPress={onPress}
      imageSource={imageSource}
      bgImgColour={bgImgColour}
      overlayColor="rgba(0,0,0,0.4)"
      style={styles.tileContent}
    />

    {showRibbon && (
      <View style={styles.ribbon}>
        <Text style={styles.ribbonText}>{ribbonText}</Text>
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: RECT_WIDTH,
    height: RECT_HEIGHT,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  tileContent: {
    flex: 1,
  },
  ribbon: {
    position: 'absolute',
    top: -RIBBON_HEIGHT / 2,
    left: -RIBBON_HEIGHT / 2,
    width: RIBBON_WIDTH,
    height: RIBBON_HEIGHT / 1.4,
    backgroundColor: themeVariables.secondaryColor, // or secondaryColour
    transform: [{ rotate: '45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,  // ensures it sits above the tile
  },
  ribbonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'none',
    left: 60
  },
});

export default RectangularTile;
