import React from 'react';
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import resolveImageSource from '../../../../utils/imageSource';
import themeVariables from '../../../../styles/theme';

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
  onLike,
  onCommentPress,
  isLiked,
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
    <View style={styles.imageOverlayIcons}>
      <TouchableOpacity onPress={onLike} style={styles.overlayIconBtn}>
        <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={22} color={themeVariables.primaryColor} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onCommentPress}
        style={[styles.overlayIconBtn, { marginLeft: 16 }]}
      >
        <Ionicons name="chatbubble-outline" size={22} color={themeVariables.primaryColor} />
      </TouchableOpacity>
    </View>
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
  imageOverlayIcons: {
    position: 'absolute',
    bottom: 56,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  overlayIconBtn: {
    backgroundColor: themeVariables.greyColor,
    borderRadius: themeVariables.borderRadiusPill,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default MediaSection;
