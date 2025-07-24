import React, { useState, useEffect, useContext, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, CardTitle, CardContent } from 'react-native-material-cards';
import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Avatar from '@liquidspirit/react-native-boring-avatars';

import themeVariables from '../styles/theme';
import { UserContext } from '../contexts/UserContext';
import { fetchPostDetails } from '../services/PostService';

const HEADER_OFFSET = 0;

const { height: windowHeight } = Dimensions.get('window');

const PostDetailCard = ({ route }) => {
  const navigation = useNavigation();
  const { token } = useContext(UserContext);
  const { postId, postPreload } = route.params || {};

  const [post, setPost] = useState(postPreload || null);
  const [loading, setLoading] = useState(!postPreload);
  const [error, setError] = useState(null);

  const handleShare = async () => {
    const id = post?._id || postId;
    if (!id) return;
    const url = `https://www.liquidspirit.org/posts/${id}`;
    const message = `Check out this post on Liquid Spirit \uD83D\uDC47\n${url}`;
    try {
      await Share.share({ message, url, title: 'Liquid Spirit Post' });
    } catch (err) {
      console.error('Error sharing:', err);
      Alert.alert('Sharing Error', 'Something went wrong while trying to share the post.');
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{
            backgroundColor: themeVariables.greyColor,
            borderRadius: themeVariables.borderRadiusPill,
            padding: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={20} color={themeVariables.blackColor} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, post]);

  useEffect(() => {
    if (!postId || postPreload) return;
    const load = async () => {
      try {
        const data = await fetchPostDetails(postId, token || '');
        setPost(data);
      } catch (err) {
        setError(err.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [postId, postPreload, token]);

  if (!postId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No post to display.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={themeVariables.primaryColor} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Post not found.</Text>
      </View>
    );
  }

  const mediaUrl = post.media?.[0];
  const isVideo = mediaUrl && (mediaUrl.endsWith('.mp4') || mediaUrl.includes('video'));
  const authorName = `${post.author?.firstName || 'Unknown'} ${post.author?.lastName || ''}`.trim();
  const authorCommunity = post.community?.name || '';
  const profilePic = post.author?.profilePicture?.trim();
  const likeCount = post.likes?.length || 0;
  const commentCount = post.comments?.length || 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={[ 'left', 'right', 'bottom' ]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: HEADER_OFFSET, paddingBottom: 30 }}
        overScrollMode="always"
        scrollEventThrottle={16}
      >
        <Card style={styles.card}>
          {mediaUrl && (
            isVideo ? (
              <Video source={{ uri: mediaUrl }} style={styles.media} controls resizeMode="contain" />
            ) : (
              <FastImage source={{ uri: mediaUrl }} style={styles.media} resizeMode={FastImage.resizeMode.cover} />
            )
          )}
          <View style={styles.overlayCard}>
            <CardTitle
              title={authorName}
              subtitle={authorCommunity}
              titleStyle={styles.cardTitleText}
              subtitleStyle={styles.cardSubtitleText}
              style={styles.titleBlock}
            />
            <View style={styles.authorRow}>
              {profilePic ? (
                <FastImage source={{ uri: profilePic }} style={styles.avatar} />
              ) : (
                <Avatar
                  size={40}
                  name={authorName}
                  variant="beam"
                  colors={[ '#1B263B', '#0A74DA', '#6C7A89', '#F8F9FA', '#0C0C0C' ]}
                  style={styles.avatar}
                />
              )}
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.authorName}>{authorName}</Text>
                {authorCommunity ? <Text style={styles.authorCommunity}>{authorCommunity}</Text> : null}
              </View>
            </View>
            <CardContent style={styles.cardContent}>
              {post.content ? (
                <Text style={styles.postContent}>{post.content}</Text>
              ) : null}
              {Array.isArray(post.tags) && post.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {post.tags.map((tag, idx) => (
                    <View key={idx} style={styles.tagChip}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.metricsRow}>
                <Ionicons name="heart" size={18} color={themeVariables.primaryColor} />
                <Text style={styles.metricText}>{likeCount}</Text>
                <Ionicons name="chatbubble-outline" size={18} color={themeVariables.primaryColor} style={{ marginLeft: 12 }} />
                <Text style={styles.metricText}>{commentCount}</Text>
              </View>
            </CardContent>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PostDetailCard;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  centered: {
    flex: 1,
    height: windowHeight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeVariables.whiteColor,
  },
  errorText: { color: 'red', fontSize: 16 },
  card: {
    width: '100%',
    backgroundColor: 'transparent',
    elevation: 0,
    margin: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  media: { width: '100%', height: 300 },
  overlayCard: {
    width: '100%',
    marginTop: -40,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  titleBlock: { alignItems: 'center' },
  cardTitleText: {
    fontSize: 24,
    fontWeight: '700',
    color: themeVariables.blackColor,
    textAlign: 'center',
  },
  cardSubtitleText: {
    fontSize: 20,
    color: '#444',
    textAlign: 'center',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: themeVariables.greyColor },
  authorName: { fontSize: 16, fontWeight: '600', color: themeVariables.blackColor },
  authorCommunity: { fontSize: 14, color: '#666' },
  cardContent: { marginTop: 12 },
  postContent: { fontSize: 16, color: '#333', marginBottom: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  tagChip: {
    backgroundColor: themeVariables.primaryColor,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: { color: '#fff', fontSize: 12 },
  metricsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metricText: { marginLeft: 4, fontSize: 14, color: themeVariables.blackColor },
});

