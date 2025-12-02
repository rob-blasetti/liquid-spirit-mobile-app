import React from 'react';
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';
import resolveImageSource from '../../../../utils/imageSource';

const MediaSection = ({
  mediaUrl,
  isVideo,
  imageAspect,
  mediaHeight,
  mediaOpacity,
  onVideoLoad,
  onImageLoad,
  onImageError,
  onPressImage,
}) => (
  <View style={styles.mediaWrapper}>
    {mediaUrl && (
      isVideo ? (
        <Animated.View style={{ opacity: mediaOpacity }}>
          <Video
            source={{ uri: mediaUrl }}
            style={[styles.media, { height: mediaHeight }]}
            controls
            resizeMode="contain"
            onLoad={onVideoLoad}
            onError={onImageError}
          />
        </Animated.View>
      ) : imageAspect ? (
        <TouchableOpacity activeOpacity={1} onPress={onPressImage}>
          <Animated.View style={{ opacity: mediaOpacity }}>
            <FastImage
              source={resolveImageSource(mediaUrl, { priority: 'high' })}
              style={[styles.media, { height: mediaHeight }]}
              resizeMode={FastImage.resizeMode.cover}
              onLoadStart={() => {}}
              onLoad={onImageLoad}
              onError={onImageError}
            />
          </Animated.View>
        </TouchableOpacity>
      ) : (
        <View style={[styles.mediaPlaceholder, { height: mediaHeight }]} />
      )
    )}
  </View>
);

const styles = StyleSheet.create({
  mediaWrapper: {
    width: '100%',
    position: 'relative',
  },
  media: {
    width: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  mediaPlaceholder: {
    width: '100%',
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
});

export default MediaSection;
