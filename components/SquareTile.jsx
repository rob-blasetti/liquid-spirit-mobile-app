import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import themeVariables from '../styles/theme';
import BasicTile from './BasicTile';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 20;
const GUTTER = 10;
const CONTENT_WIDTH = SCREEN_WIDTH - 2 * GRID_PADDING;
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
  // white text/icon on red or blue bg covers
  const useWhiteText = bgImgColour === 'red' || bgImgColour === 'blue';
  return (
    <BasicTile
      heading={title}
      subheading={subheading}
      icon={actionIcon}
      iconColor={useWhiteText ? themeVariables.whiteColor : (actionIconColor || themeVariables.primaryColor)}
      headingColor={useWhiteText ? themeVariables.whiteColor : themeVariables.primaryColor}
      subheadingColor={useWhiteText ? themeVariables.whiteColor : themeVariables.blackColor}
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
  },
});

export default SquareTile;