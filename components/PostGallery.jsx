import React from 'react';
import { View, Text, Image, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import Video from 'react-native-video';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window'); // Get device width
const ITEM_SIZE = width / 2 - 15; // Adjust for 2-column layout

const PostGallery = ({ posts }) => {
  const navigation = useNavigation();

  const handlePress = (item) => {
    console.log('item: ', item);
    if (item.content) {
      // ✅ Navigate to the social feed if it's a post
      navigation.navigate('Feed', { post: item });
    } else if (item.title && item.imageUrl) {
      if (item.eventType) {
        // ✅ Navigate to the event detail page if it's an event
        navigation.navigate('EventDetail', { event: item });
      } else {
        // ✅ Navigate to the activity detail page if it's an activity
        navigation.navigate('ActivityDetail', { activityId: item._id });
      }
    }
  };

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item._id.toString()}
      numColumns={2} // ✅ Display in 2 columns
      contentContainerStyle={styles.galleryContainer}
      renderItem={({ item }) => {
        const mediaUrl = item.media?.[0] || item.imageUrl;
        const isVideo = mediaUrl?.endsWith('.mp4') || mediaUrl?.includes('video');

        return (
          <TouchableOpacity style={styles.postContainer} onPress={() => handlePress(item)}>
            {/* Render Image, Video, or Placeholder */}
            {mediaUrl && !isVideo && <Image source={{ uri: mediaUrl }} style={styles.postImage} />}
            {mediaUrl && isVideo && (
              <Video
                source={{ uri: mediaUrl }}
                style={styles.postVideo}
                resizeMode="cover"
                muted
                repeat
                controls={false} // Prevents user controls, just a preview
              />
            )}

            {/* Render Post Content OR Title */}
            {item.content ? (
              <Text style={styles.listContent}>
                {item.content.length > 50 ? `${item.content.slice(0, 50)}...` : item.content}
              </Text>
            ) : (
              <Text style={styles.listTitle}>{item.title}</Text>
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
    borderRadius: 10,
    padding: 10,
    margin: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  postImage: {
    width: '100%',
    height: 120, // Set fixed height for images
    borderRadius: 8,
    marginBottom: 8,
  },
  postVideo: {
    width: '100%',
    height: 120, // Set fixed height for videos
    borderRadius: 8,
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#312783',
    textAlign: 'center',
  },
  listContent: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
});

export default PostGallery;
