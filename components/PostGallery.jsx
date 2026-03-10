import React, { memo, useCallback, useContext, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import Video from 'react-native-video';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { UserContext } from '../contexts/UserContext';
import { navigateToEventDetail } from '../utils/navigateToEventDetail';
import { navigateToPostDetail } from '../utils/navigateToPostDetail';
import { navigateToActivityDetail } from '../utils/navigateToActivityDetail';
import resolveImageSource from '../utils/imageSource';
import usePrefetchImages from '../hooks/usePrefetchImages';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / 2 - 15;

const PostGalleryItem = memo(({ item, onPress }) => {
  const mediaUrl = item.media?.[0] || item.imageUrl;
  const isVideo = mediaUrl?.endsWith('.mp4') || mediaUrl?.includes('video');
  const imageSource = resolveImageSource(mediaUrl, {
    priority: 'normal',
    fallback: '/img/events/Event_Placeholder.png',
  });
  const accessibilityLabel = item.content
    ? `Open post, ${item.content?.slice(0, 80)}`
    : `Open ${item.eventType ? 'event' : 'activity'}, ${item.title || 'item'}`;

  return (
    <TouchableOpacity
      style={styles.postContainer}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {mediaUrl && !isVideo &&
        <FastImage
          style={styles.postImage}
          source={imageSource}
          resizeMode={FastImage.resizeMode.cover}
        />
      }
      {mediaUrl && isVideo && (
        <View style={styles.mediaWrapper}>
          <Video
            source={{ uri: mediaUrl }}
            style={styles.videoInside}
            resizeMode="cover"
            muted
            repeat
            paused
            controls={false}
          />
        </View>
      )}

      {item.content ? (
        <Text style={styles.listContent}>
          {item.content?.length > 50 ? `${item.content?.slice(0, 50)}...` : item.content}
        </Text>
      ) : (
        <View style={styles.listContent}>
          <Text style={styles.listTitle}>{item.title}</Text>
          {item.activityType && <Text style={styles.listType}>{item.activityType?.name}</Text>}
          {item.eventType && <Text style={styles.listType}>{item.eventType}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
});

const EmptyGallery = memo(() => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>No items to display right now.</Text>
  </View>
));

const PostGallery = ({ posts = [], refreshing = false, onRefresh }) => {
  const navigation = useNavigation();
  const { token, isTokenExpired } = useContext(UserContext);

  const handlePress = useCallback((item) => {
    if (item.content) {
      navigateToPostDetail({
        navigation,
        post: item,
        postId: item._id,
        token,
        isTokenExpired,
      });
    } else if (item.title && item.imageUrl) {
      if (item.eventType) {
        // ✅ Navigate to the event detail page if it's an event
        navigateToEventDetail({ navigation, event: item, token, isTokenExpired });
      } else {
        navigateToActivityDetail({
          navigation,
          activity: item,
        });
      }
    }
  }, [navigation, token, isTokenExpired]);

  const prefetchTargets = useMemo(
    () =>
      posts
        .map(item => item?.media?.[0] || item?.imageUrl)
        .filter(uri => uri && !/\.(mp4|mov|m4v|avi)(\?.*)?$/i.test(uri)),
    [posts],
  );

  usePrefetchImages(prefetchTargets, { priority: 'normal' });

  const renderItem = useCallback(
    ({ item }) => <PostGalleryItem item={item} onPress={handlePress} />,
    [handlePress],
  );

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item._id.toString()}
      numColumns={2}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={styles.galleryContainer}
      renderItem={renderItem}
      ListEmptyComponent={EmptyGallery}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={5}
      removeClippedSubviews
    />
  );
};

const styles = StyleSheet.create({
  galleryContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  postContainer: {
    width: ITEM_SIZE,
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  postImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    borderBottomEndRadius: 0,
    borderBottomStartRadius: 0,
    marginBottom: 8,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    position: 'relative',
    top: 0,
    left: 0,
  },
  mediaWrapper: {
    width: '100%',
    height: 120, // Fixed height for media top section
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  videoInside: {
    width: '100%',
    height: 120,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#312783',
    textAlign: 'center',
  },
  listContent: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    margin: 12,
  },
  listType: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default memo(PostGallery);
