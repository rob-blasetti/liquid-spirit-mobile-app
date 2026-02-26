import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';

// Unified banner height shared across screens; slightly taller than the previous home banner.
export const IMAGE_BANNER_HEIGHT = 300;

const ImageBanner = ({
  imageSource,
  defaultImageSource,
  renderContent,
  children,
  height = IMAGE_BANNER_HEIGHT,
  topInset = 0,
  overlayColor = null,
  containerStyle,
  imageStyle,
  contentContainerStyle,
  pointerEvents = 'box-none',
}) => {
  const isAnimatedHeight = typeof height !== 'number';
  const resolvedTotalHeight = isAnimatedHeight ? (IMAGE_BANNER_HEIGHT + topInset) : (height + topInset);
  const heightWithInset = isAnimatedHeight ? Animated.add(height, topInset) : resolvedTotalHeight;
  const ContainerComponent = isAnimatedHeight ? Animated.View : View;
  const ImageWrapper = Animated.View;
  const heightStyle = { height: heightWithInset, marginTop: -topInset };

  const renderBannerContent = renderContent
    ? renderContent({ height, totalHeight: heightWithInset, topInset })
    : null;

  return (
    <ContainerComponent
      style={[styles.container, heightStyle, containerStyle]}
    >
      {renderBannerContent}
      {!renderBannerContent && imageSource ? (
        <ImageWrapper style={[styles.imageWrapper, { height: heightWithInset }, imageStyle]}>
          <FastImage
            source={imageSource}
            defaultSource={defaultImageSource}
            style={styles.image}
            resizeMode={FastImage.resizeMode.cover}
          />
        </ImageWrapper>
      ) : null}
      {overlayColor ? (
        <View style={[styles.overlay, { backgroundColor: overlayColor }]} pointerEvents="none" />
      ) : null}
      {children ? (
        <View
          style={[styles.content, { paddingTop: topInset }, contentContainerStyle]}
          pointerEvents={pointerEvents}
        >
          {children}
        </View>
      ) : null}
    </ContainerComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default ImageBanner;
