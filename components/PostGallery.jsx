import React from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import Video from 'react-native-video';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '../config';
import localImages from '../utils/localImages'
import FastImage from 'react-native-fast-image';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / 2 - 15;

const PostGallery = ({ posts = [], refreshing = false, onRefresh }) => {
  const navigation = useNavigation();

  const handlePress = (item) => {
    if (item.content) {
      // Navigate to the post detail card if it's a post
      navigation.navigate('PostDetailCard', { postPreload: item, postId: item._id });
    } else if (item.title && item.imageUrl) {
      if (item.eventType) {
        // ✅ Navigate to the event detail page if it's an event
        navigation.navigate('EventDetailCard', { eventPreload: item });
      } else {
        // ✅ Navigate to the activity detail page if it's an activity
        navigation.navigate('ActivityDetailCard', { activityId: item._id, activityPreload: item });
      }
    }
  };

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item._id.toString()}
      numColumns={2}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={styles.galleryContainer}
      ListEmptyComponent={() => (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No items to display right now.</Text>
        </View>
      )}
      renderItem={({ item }) => {
        let mediaUrl = item.media?.[0] || item.imageUrl;
        const isVideo = mediaUrl?.endsWith('.mp4') || mediaUrl?.includes('video');
        let imageSource;
        if (mediaUrl) {
          if (localImages[mediaUrl]) {
            imageSource = localImages[mediaUrl];
          } else if (!mediaUrl.startsWith('http')) {
            imageSource = { uri: `${API_URL}/${mediaUrl}` };
          } else {
            imageSource = { uri: mediaUrl };
          }
        }

        return (
          <TouchableOpacity style={styles.postContainer} onPress={() => handlePress(item)}>
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
                  controls={false} // Prevents user controls, just a preview
                />
              </View>
            )}

            {/* Render Post Content OR Title */}
            {item.content ? (
              <Text style={styles.listContent}>
                {item.content?.length > 50 ? `${item.content?.slice(0, 50)}...` : item.content}
              </Text>
            ) : (
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{item.title}</Text>
                { item.activityType && <Text style={styles.listType}>{item.activityType?.name}</Text> }
                { item.eventType && <Text style={styles.listType}>{item.eventType}</Text> }
              </View>
            )}
          </TouchableOpacity>
        );
      }}
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
  }
});

export default PostGallery;
