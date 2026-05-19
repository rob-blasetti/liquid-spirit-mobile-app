import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import themeVariables from '../styles/theme';
import BasicTile from './BasicTile';
import { useTheme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 20;
const GUTTER = 10;
const CONTENT_WIDTH = SCREEN_WIDTH - 2 * GRID_PADDING;
const TILE_TEXT_ON_IMAGE_COLOR = '#ffffff';
// Grid cell size
export const SQUARE_SIZE = (CONTENT_WIDTH - GUTTER) * 0.25;
/** SquareTile: spans 1x1 cell */
const SquareTile = ({
  title,
  subheading,
  onPress,
  actionIcon,
  actionIconColor,
  imageSource,
  bgImgColour,
  style,
}) => {
  const { isDarkMode } = useTheme();
  // white text/icon on red or blue bg covers
  const useWhiteText = isDarkMode || bgImgColour === 'red' || bgImgColour === 'blue';
  return (
    <BasicTile
      heading={title}
      subheading={subheading}
      icon={actionIcon}
      iconColor={useWhiteText ? TILE_TEXT_ON_IMAGE_COLOR : (actionIconColor || themeVariables.primaryColor)}
      headingColor={useWhiteText ? TILE_TEXT_ON_IMAGE_COLOR : themeVariables.primaryColor}
      subheadingColor={useWhiteText ? TILE_TEXT_ON_IMAGE_COLOR : themeVariables.blackColor}
      onPress={onPress}
      imageSource={imageSource}
      bgImgColour={bgImgColour}
      style={[styles.wrapper, style]}
    />
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: themeVariables.primaryColor,
    // Shadow similar to SearchCard & ListItem
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default SquareTile;
