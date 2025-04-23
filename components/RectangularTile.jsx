import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import themeVariables from '../styles/theme';
import BasicTile from './BasicTile';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 20;
const GUTTER = 10;
const CONTENT_WIDTH = SCREEN_WIDTH - 2 * GRID_PADDING;
// One grid cell size
const SQUARE_SIZE = (CONTENT_WIDTH - GUTTER) * 0.25;
// Rect spans 3 columns * cell width
const RECT_WIDTH = SQUARE_SIZE * 3;
// Rect spans 2 rows + vertical gutter
const RECT_HEIGHT = SQUARE_SIZE * 2 + GUTTER;
/** RectangularTile: spans 3x2 cells with overlay */
const RectangularTile = ({
  title,
  subheading,
  /** Optional bottom-left date/time text */
  dateTime,
  imageSource,
  onPress,
  actionIcon,
  actionIconColor,
  bgImgColour,
  style,
}) => (
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
    style={[styles.wrapper, style]}
  />
);

const styles = StyleSheet.create({
  wrapper: {
    width: RECT_WIDTH,
    height: RECT_HEIGHT,
    borderRadius: 8,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
});

export default RectangularTile;