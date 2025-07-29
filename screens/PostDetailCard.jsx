import React, { useState, useEffect, useContext, useLayoutEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Share,
  Alert,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, CardTitle, CardContent } from 'react-native-material-cards';
import FastImage from 'react-native-fast-image';
import BoringAvatar from '@liquidspirit/react-native-boring-avatars';
import Video from 'react-native-video';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Avatar from '@liquidspirit/react-native-boring-avatars';

import themeVariables from '../styles/theme';
import { UserContext } from '../contexts/UserContext';
import { fetchPostDetails, likePost, commentOnPost, fetchRecentCommunityPosts } from '../services/PostService';
import { Button } from 'liquid-spirit-styleguide';

const HEADER_OFFSET = 0;

const { height: windowHeight } = Dimensions.get('window');

const PostDetailCard = ({ route }) => {
  const navigation = useNavigation();
  const { token, user } = useContext(UserContext);
  const { postId, postPreload } = route.params || {};

  const [post, setPost] = useState(postPreload || null);
  const [loading, setLoading] = useState(!postPreload);
  const [error, setError] = useState(null);
  // Redirect to feed if post not found or error occurs
  const [redirected, setRedirected] = useState(false);
  // Lightbox modal visibility
  const [modalVisible, setModalVisible] = useState(false);
  // Like and comment state
  const [isLiked, setIsLiked] = useState(false);
  const [likeCountState, setLikeCountState] = useState(post?.likes?.length || 0);
  const [commentCountState, setCommentCountState] = useState(post?.comments?.length || 0);
  // Comment input visibility (shown by default) and text
  const [showCommentBox, setShowCommentBox] = useState(true);
  const [commentText, setCommentText] = useState('');
  // Related posts state
  const [relatedPosts, setRelatedPosts] = useState([]);
  // Ref for comment TextInput to focus when tapping comment icon
  const commentInputRef = useRef(null);

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
  // Toggle like state and update server
  const handleToggleLike = async () => {
    setIsLiked(prev => !prev);
    setLikeCountState(prev => prev + (isLiked ? -1 : 1));
    try {
      await likePost(post._id, token || '');
    } catch (err) {
      setIsLiked(prev => !prev);
      setLikeCountState(prev => prev + (isLiked ? 1 : -1));
      Alert.alert('Error', 'Failed to update like');
    }
  };
  // Open comment input box
  const handleAddComment = () => {
    setShowCommentBox(true);
  };
  // Cancel commenting
  const handleCancelComment = () => {
    setShowCommentBox(false);
    setCommentText('');
  };
  // Post comment to server
  const handlePostComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('Comments cannot be empty');
      return;
    }
    try {
      await commentOnPost(post._id, commentText, token || '');
      setCommentCountState(prev => prev + 1);
      setCommentText('');
      setShowCommentBox(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to post comment');
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

  // Load post details if not preloaded, then initialize like/comment state
  useEffect(() => {
    if (postPreload) {
      setLoading(false);
    } else if (postId) {
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
    }
  }, [postId, postPreload, token]);

  // Redirect when loaded but no post or error
  useEffect(() => {
    if (!redirected && !loading && (error || !post)) {
      // Navigate to main feed with banner message
      navigation.replace('Main', {
        screen: 'Feed',
        params: { bannerMessage: 'Sorry, that post no longer exists.' }
      });
      setRedirected(true);
    }
  }, [redirected, loading, error, post, navigation]);

  // Initialize like/comment UI state when post or user changes
  // Related posts section: fetch when post community is available
  useEffect(() => {
    if (post?.community?._id && token) {
      fetchRecentCommunityPosts(post.community._id, token)
        .then(data => setRelatedPosts(data.filter(p => p._id !== post._id)))
        .catch(err => console.error('Error fetching related posts:', err));
    }
  }, [post, token]);
  // Initialize like/comment UI state and compute image aspect ratio when post loads
  const [imageAspect, setImageAspect] = useState(null);
  useEffect(() => {
    if (!post) return;
    // Determine if current user has liked
    const uid = user?.id || user?._id;
    let liked = false;
    if (Array.isArray(post.likes)) {
      liked = post.likes.some(like => {
        if (!like) return false;
        if (typeof like === 'string') return like === uid;
        if (typeof like === 'object') {
          if (like._id === uid || like.id === uid) return true;
          if (typeof like.user === 'string' && like.user === uid) return true;
          if (like.user && typeof like.user === 'object' && (like.user._id === uid || like.user.id === uid)) return true;
          if (typeof like.userId === 'string' && like.userId === uid) return true;
        }
        return false;
      });
    }
    setIsLiked(liked);
    setLikeCountState(post.likes?.length || 0);
    setCommentCountState(post.comments?.length || 0);
    // Compute image aspect ratio for full display
    const url = post.media?.[0];
    if (url && !(url.endsWith('.mp4') || url.includes('video'))) {
      Image.getSize(url, (w, h) => setImageAspect(w / h), () => {});
    }
  }, [post, user]);

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
          <View style={styles.mediaWrapper}>
            {mediaUrl && (
              isVideo ? (
                <Video source={{ uri: mediaUrl }} style={[styles.media, { height: 300 }]} controls resizeMode="contain" />
              ) : imageAspect ? (
                <TouchableOpacity activeOpacity={1} onPress={() => setModalVisible(true)}>
                  <FastImage
                    source={{ uri: mediaUrl }}
                    style={[styles.media, { aspectRatio: imageAspect }]}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.mediaPlaceholder}>
                  <ActivityIndicator size="large" color={themeVariables.primaryColor} />
                </View>
              )
            )}
            {/* Overlay like & comment icons on image */}
            <View style={styles.imageOverlayIcons}>
              <TouchableOpacity onPress={handleToggleLike} style={styles.overlayIconBtn}>
                <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={22} color={themeVariables.primaryColor} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setShowCommentBox(true); commentInputRef.current?.focus(); }}
                style={[styles.overlayIconBtn, { marginLeft: 16 }]}
              >
                <Ionicons name="chatbubble-outline" size={22} color={themeVariables.primaryColor} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.overlayCard}>
          {/* Removed separate community chip here; will display in authorRow */}
            <View style={[styles.authorRow, { justifyContent: 'space-between' }]}>
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
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={styles.authorName}>{authorName}</Text>
              </View>
              {authorCommunity && (
                <View style={styles.communityChipDetail}>
                  <Text style={styles.communityChipText}>{authorCommunity}</Text>
                </View>
              )}
            </View>
            <CardContent style={styles.cardContent}>
              {post.content ? (
                <Text style={styles.postContent}>{post.content}</Text>
              ) : null}
            </CardContent>
          </View>
        </Card>
        {/* Removed bottom toolbar; icons now overlay the image */}
        {/* Lightbox modal for image */}
        <Modal visible={modalVisible} transparent={true} onRequestClose={() => setModalVisible(false)}>
          <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPress={() => setModalVisible(false)}>
            <FastImage source={{ uri: mediaUrl }} style={styles.modalImage} resizeMode={FastImage.resizeMode.contain} />
          </TouchableOpacity>
        </Modal>
        {/* Comment input box */}
        {showCommentBox && (
          <View style={styles.commentBoxContainer}>
            <Text style={styles.commentHeading}>Comments</Text>
            {/* Inline comments list */}
            {post.comments && post.comments.length > 0 ? (
              <View style={styles.commentsList}>
              {post.comments.map(comment => (
                <View key={comment._id} style={styles.commentItem}>
                  <View style={styles.commentRow}>
                    {comment.user?.profilePicture ? (
                      <FastImage
                        source={{ uri: comment.user.profilePicture }}
                        style={styles.commentAvatar}
                      />
                    ) : (
                      <BoringAvatar
                        size={32}
                        name={`${comment.user?.firstName || ''} ${comment.user?.lastName || ''}`.trim()}
                        variant="beam"
                        colors={[ '#1B263B', '#0A74DA', '#6C7A89', '#F8F9FA', '#0C0C0C' ]}
                        style={styles.commentAvatar}
                      />
                    )}
                    <View style={styles.commentTextContainer}>
                      <Text style={styles.commentAuthor}>
                        {comment.user?.firstName || ''} {comment.user?.lastName || ''}
                      </Text>
                      <Text style={styles.commentContent}>{comment.comment}</Text>
                    </View>
                  </View>
                </View>
              ))}
              </View>
            ) : (
              <Text style={styles.noCommentsText}>No comments yet</Text>
            )}
            <TextInput
              ref={commentInputRef}
              style={styles.commentInput}
              placeholder="Write a comment..."
              value={commentText}
              onChangeText={setCommentText}
            />
            <View style={styles.commentButtonsRow}>
              <Button label="Clear" secondary onPress={handleCancelComment} />
              <Button label="Post" primary onPress={handlePostComment} />
            </View>
          </View>
        )}
        {/* Related Posts */}
        {relatedPosts?.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>Related Posts</Text>
            <FlatList
              horizontal
              data={relatedPosts.filter(p => p._id !== post._id)}
              keyExtractor={item => item._id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.relatedItem}
                  onPress={() => navigation.push('PostDetailCard', { postId: item._id, postPreload: item })}
                >
                  <FastImage
                    source={{ uri: item.media?.[0] }}
                    style={styles.relatedImage}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                </TouchableOpacity>
              )}
            />
          </View>
        )}
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
    backgroundColor: themeVariables.whiteColor
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
    backgroundColor: themeVariables.whiteColor,
    elevation: 0,
    margin: 0,
    overflow: 'hidden',
  },
  media: { width: '100%', height: undefined },
  overlayCard: {
    width: '100%',
    marginTop: -40,
    backgroundColor: themeVariables.whiteColor,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
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
    marginTop: 20,
    // space-between will push community chip to right
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: themeVariables.greyColor },
  authorName: { fontSize: 16, fontWeight: '600', color: themeVariables.blackColor },
  authorCommunity: { fontSize: 14, color: '#666' },
  cardContent: { marginTop: 12 },
  postContent: { fontSize: 16, color: '#333', marginLeft: -15 },
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
  // Button style for metrics
  metricButton: { flexDirection: 'row', alignItems: 'center' },
  // Modal for full-screen image
  modalContainer: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'center', alignItems: 'center' },
  modalImage: { width: '100%', height: '100%' },
  // Comment input box styles
  commentBoxContainer: { marginTop: 16, marginHorizontal: 16, backgroundColor: themeVariables.whiteColor, borderRadius: 8 },
  commentInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 20, padding: 8, backgroundColor: '#fff' },
  commentButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  commentButton: { marginLeft: 16 },
  commentButtonText: { color: themeVariables.primaryColor, fontSize: 16, fontWeight: '600' },
  metricText: { marginLeft: 4, fontSize: 14, color: themeVariables.blackColor },
  // Image loading placeholder
  // Placeholder area for image loading to reserve space
  mediaPlaceholder: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  // Wrapper for media to position overlay icons
  mediaWrapper: {
    width: '100%',
    position: 'relative',
  },
  // Overlay heart/comment icons on image, raised above overlay card
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
  // Comment box heading
  commentHeading: { fontSize: 16, fontWeight: 'bold', color: themeVariables.blackColor, marginBottom: 8 },
  // Inline comments styles
  commentsList: { marginBottom: 12 },
  commentItem: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#ddd', paddingBottom: 8 },
  commentRow: { flexDirection: 'row', alignItems: 'center' },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: themeVariables.greyColor },
  commentTextContainer: { marginLeft: 12, flex: 1 },
  commentAuthor: { fontWeight: '600', marginBottom: 4 },
  commentContent: { fontSize: 14, color: '#333' },
  noCommentsText: { color: '#888', marginBottom: 12, fontStyle: 'italic' },
  // Bottom toolbar styles
  postFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: themeVariables.whiteColor, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#fff' },
  postFooterIcon: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  footerIconText: { color: themeVariables.primaryColor, fontSize: 16, marginLeft: 6 },
  // Community chip below title
  communityChipDetail: { alignSelf: 'center', backgroundColor: themeVariables.primaryColor, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, marginTop: 8 },
  communityChipText: { color: '#fff', fontSize: 14 },
  // Related posts section
  relatedSection: { marginTop: 16, paddingHorizontal: 16, backgroundColor: themeVariables.whiteColor },
  relatedTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8, color: themeVariables.blackColor },
  relatedItem: { marginRight: 12 },
  relatedImage: { width: 100, height: 100, borderRadius: 8 },
});

