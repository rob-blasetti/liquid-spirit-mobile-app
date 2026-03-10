import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  Image as RNImage,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ZoomableImage from '../../../components/ZoomableImage';
import { resolveMediaUrl } from '../../../utils/resolveMediaUrl';
import SwipeToCloseScrollView from '../../../components/SwipeToCloseScrollView';
import { CardContent } from '../../../components/Card';
import CardContainer from '../common/CardContainer';
import useDetailCardHeader from '../common/useDetailCardHeader';
import sectionBaseStyles from '../common/sectionBaseStyles';
import MediaSection from './sections/MediaSection';
import CommentsSection from './sections/CommentsSection';
import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import AuthorSection from './sections/AuthorSection';

import themeVariables from '../../../styles/theme';
import { UserContext } from '../../../contexts/UserContext';
import { fetchPostDetails, likePost, commentOnPost, fetchRecentCommunityPosts } from '../../../services/PostService';
import { shareContent } from '../../../utils/shareContent';
import FooterBrand from '../common/FooterBrand';
import { navigateToPostDetail } from '../../../utils/navigateToPostDetail';
import resolveImageSource from '../../../utils/imageSource';
import {
  detailCardOverlay,
  detailCardTitle,
  detailCardSubtitle,
  detailCardContent,
} from '../common/detailCardLayout';
import { IMAGE_BANNER_HEIGHT } from '../../../components/ImageBanner';
import Ionicons from 'react-native-vector-icons/Ionicons';

const HEADER_OFFSET = 0;
const TAB_BAR_HEIGHT = 80;

const { height: windowHeight } = Dimensions.get('window');

const PostDetailCard = ({ route }) => {
  const navigation = useNavigation();
  const { token, user, storageLoaded, isTokenExpired, refreshSession } = useContext(UserContext);
  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  // Extract post parameters, including preloaded data and image aspect ratio
  const {
    postId,
    postPreload,
    imageAspect: initialImageAspect,
    returnTo,
    returnParams,
    originTab,
    originScreen,
  } = route.params || {};

  const [post, setPost] = useState(postPreload || null);
  const [loading, setLoading] = useState(!postPreload);
  const [error, setError] = useState(null);
  // Redirect to feed if post not found or error occurs
  const [redirected, setRedirected] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);
  const [didRefresh, setDidRefresh] = useState(false);
  const [backgroundRefreshing, setBackgroundRefreshing] = useState(false);
  // Lightbox modal visibility
  const [modalVisible, setModalVisible] = useState(false);
  // Like and comment state
  const [isLiked, setIsLiked] = useState(false);
  const [likeCountState, setLikeCountState] = useState(post?.likes?.length || 0);
  const [commentCountState, setCommentCountState] = useState(post?.comments?.length || 0);
  // Comment input visibility (shown by default) and text
  const [showCommentBox, setShowCommentBox] = useState(true);
  const [commentText, setCommentText] = useState('');
  const normalizedCommentText = commentText ?? '';
  const isPostButtonDisabled = normalizedCommentText.trim().length === 0;
  // Related posts state
  const [relatedPosts, setRelatedPosts] = useState([]);
  // Ref for comment TextInput to focus when tapping comment icon
  const commentInputRef = useRef(null);
  // Fade in overall content and media for smoother entry
  const contentOpacity = useRef(new Animated.Value(Platform.OS === 'android' ? 1 : 0.6)).current;
  const mediaOpacity = useRef(new Animated.Value(Platform.OS === 'android' ? 1 : 0.6)).current;
  const bottomOffset = safeAreaBottom + TAB_BAR_HEIGHT;
  const scrollContentStyle = useMemo(
    () => [styles.scrollContent, { paddingBottom: Math.max(48, bottomOffset) }],
    [bottomOffset],
  );
  const footerContainerStyle = useMemo(
    () => [styles.footerContainer, { paddingBottom: Math.max(36, bottomOffset) }],
    [bottomOffset],
  );
  const commentBoxContainerStyle = useMemo(
    () => ({ marginBottom: Math.max(8, bottomOffset / 4) }),
    [bottomOffset],
  );
  useEffect(() => {
    console.log('[PostDetailCard] route', { name: route?.name, params: route?.params });
  }, [route]);

  useEffect(() => {
    if (post) {
      console.log('[PostDetailCard] post', post);
    }
  }, [post]);

  const handleShare = useCallback(() => {
    const id = post?._id || postId;
    if (!id) return;
    const url = `https://www.liquidspirit.org/posts/${id}`;
    const message = `Check out this post on Liquid Spirit \uD83D\uDC47\n${url}`;
    shareContent({
      url,
      message,
      title: 'Liquid Spirit Post',
      alertMessage: 'Something went wrong while trying to share the post.',
    });
  }, [post, postId]);
  const userId = user?.id || user?._id;

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    const parentNav = navigation.getParent?.();
    if (parentNav?.canGoBack?.()) {
      parentNav.goBack();
      return;
    }
    if (originTab) {
      navigation.navigate('Main', { screen: originTab, params: returnParams || {} });
      return;
    }
    if (originScreen) {
      navigation.navigate(originScreen, returnParams || {});
      return;
    }
    if (returnTo) {
      navigation.navigate(returnTo, returnParams || {});
      return;
    }
    navigation.navigate('SocialFeed');
  }, [navigation, originTab, originScreen, returnTo, returnParams]);

  const hasUserLiked = useCallback((likes, uid) => {
    if (!Array.isArray(likes) || !uid) return false;
    return likes.some(like => {
      if (!like) return false;
      if (typeof like === 'string') {
        return like === uid;
      }
      if (typeof like === 'object') {
        if (like._id === uid || like.id === uid) return true;
        if (typeof like.user === 'string' && like.user === uid) return true;
        if (like.user && typeof like.user === 'object' && (like.user._id === uid || like.user.id === uid)) return true;
        if (typeof like.userId === 'string' && like.userId === uid) return true;
      }
      return false;
    });
  }, []);

  // Toggle like state and update server
  const handleToggleLike = async () => {
    if (!token) {
      Alert.alert('Please sign in to like posts.');
      return;
    }

    const previousLiked = isLiked;
    const previousCount = likeCountState;
    const optimisticLiked = !previousLiked;
    const optimisticCount = previousCount + (previousLiked ? -1 : 1);

    setIsLiked(optimisticLiked);
    setLikeCountState(optimisticCount);

    try {
      const response = await likePost(post._id, token || '', { userId });
      const updatedPost = response?.data;
      if (updatedPost) {
        if (__DEV__) {
          console.log('[PostDetail] like response received', {
            postId: post._id,
            userId,
            likeCount: Array.isArray(updatedPost.likes) ? updatedPost.likes.length : undefined,
          });
        }
        setPost(updatedPost);
        const serverLiked = hasUserLiked(updatedPost.likes, userId);
        setIsLiked(serverLiked);
        setLikeCountState(Array.isArray(updatedPost.likes) ? updatedPost.likes.length : optimisticCount);
      }
    } catch (err) {
      console.error('Failed to update like:', err);
      setIsLiked(previousLiked);
      setLikeCountState(previousCount);
      Alert.alert('Error', 'Failed to update like');
    }
  };
  const handleCommentPress = useCallback(() => {
    setShowCommentBox(true);
    commentInputRef.current?.focus();
  }, []);
  // Post comment to server and update local comments list
  const handlePostComment = async () => {
    const trimmed = normalizedCommentText.trim();
    if (!trimmed) {
      Alert.alert('Comments cannot be empty');
      return;
    }
    try {
      const result = await commentOnPost(post._id, trimmed, token || '');
      setPost(prev => {
        let newComments;
        if (result && Array.isArray(result.comments)) {
          newComments = result.comments;
        } else if (Array.isArray(result)) {
          newComments = result;
        } else if (result && result._id) {
          newComments = [...(prev.comments || []), result];
        } else {
          newComments = prev.comments || [];
        }
        return { ...prev, comments: newComments };
      });
      setCommentText('');
    } catch (err) {
      console.error('Failed to post comment:', err);
      Alert.alert('Error', err.message || 'Failed to post comment');
    }
  };

  useDetailCardHeader({
    navigation,
    onBack: handleBack,
    onShare: handleShare,
    onChat: null,
    chatLoading: false,
    showChat: false,
    showShare: false,
  });

  useEffect(() => {
    Animated.timing(contentOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [contentOpacity]);

  const normalizeId = (raw) => {
    const str = String(raw || '').trim();
    const match = str.match(/[a-fA-F0-9]{24}/);
    return match ? match[0] : null;
  };

  // Always fetch post details to ensure latest state, but guard auth and ID
  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (postPreload) {
        setPost(prev => {
          if (!prev) return postPreload;
          if (prev._id && postPreload._id && prev._id !== postPreload._id) {
            return postPreload;
          }
          return { ...prev, ...postPreload };
        });
        setLoading(false);
      }

      const id = normalizeId(postId || postPreload?._id);
      if (!id) {
        setError('Invalid post link');
        setErrorStatus('invalid_id');
        setLoading(false);
        return;
      }

      if (!storageLoaded) return;
      if (!token || isTokenExpired(token)) {
        if (!didRefresh) {
          setDidRefresh(true);
          try { await refreshSession(); } catch (_) {}
          return;
        } else {
          setError('Please log in to view this post.');
          setErrorStatus(401);
          if (!postPreload) {
            setLoading(false);
          }
          return;
        }
      }

      const useFullScreenSpinner = !postPreload;
      if (useFullScreenSpinner) {
        setLoading(true);
      } else {
        setBackgroundRefreshing(true);
      }
      try {
        const data = await fetchPostDetails(id, token);
        if (isActive) {
          setPost(data);
          setError(null);
          setErrorStatus(null);
        }
      } catch (err) {
        if (isActive) {
          if (err?.status === 401 && !didRefresh) {
            setDidRefresh(true);
            try { await refreshSession(); } catch (_) {}
            return;
          }
          setError(err?.message || 'Failed to load post');
          setErrorStatus(err?.status || 'unknown');
        }
      } finally {
        if (!isActive) return;
        if (useFullScreenSpinner) {
          setLoading(false);
        } else {
          setBackgroundRefreshing(false);
        }
      }
    };
    load();
    return () => { isActive = false; };
  }, [postId, postPreload, token, storageLoaded, didRefresh]);

  // Redirect when specific errors occur
  useEffect(() => {
    if (redirected || loading) return;
    if (errorStatus === 404) {
      navigation.replace('Main', { screen: 'Feed', params: { bannerMessage: 'Sorry, that post no longer exists.' } });
      setRedirected(true);
    } else if (errorStatus === 401) {
      navigation.replace('Main', { screen: 'Feed', params: { bannerMessage: 'Please log in to view this post.' } });
      setRedirected(true);
    } else if (errorStatus === 'invalid_id') {
      navigation.replace('Main', { screen: 'Feed', params: { bannerMessage: 'Invalid post link.' } });
      setRedirected(true);
    }
  }, [redirected, loading, errorStatus, navigation]);

  // Initialize like/comment UI state when post or user changes
  // Related posts section: fetch when post community is available
  useEffect(() => {
    if (post?.community?._id && token) {
      fetchRecentCommunityPosts(post.community._id, token)
        .then(data => setRelatedPosts(data.filter(p => p._id !== post._id)))
        .catch(err => console.error('Error fetching related posts:', err));
    }
  }, [post, token]);
  // Initialize image aspect ratio, using preloaded value if available
  const [imageAspect, setImageAspect] = useState(initialImageAspect || null);
  useEffect(() => {
    if (initialImageAspect && initialImageAspect !== imageAspect) {
      setImageAspect(initialImageAspect);
    }
  }, [initialImageAspect, imageAspect]);
  const mediaUrl = useMemo(() => resolveMediaUrl(post), [post]);
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
    // Use provided image aspect ratio if available; fallback to size lookup once
    if (!imageAspect) {
      if (post.imageAspect) {
        setImageAspect(post.imageAspect);
        return;
      }
      if (initialImageAspect) {
        setImageAspect(initialImageAspect);
        return;
      }
    }
    if (!imageAspect && mediaUrl && !(mediaUrl.endsWith('.mp4') || mediaUrl.includes('video'))) {
      RNImage.getSize(mediaUrl, (w, h) => setImageAspect(w / h), () => {});
    }
  }, [post, user, mediaUrl, imageAspect, initialImageAspect]);

  const isVideo = mediaUrl && (mediaUrl.endsWith('.mp4') || mediaUrl.includes('video'));

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

  const authorName = `${post.author?.firstName || 'Unknown'} ${post.author?.lastName || ''}`.trim();
  const authorCommunity = post.community?.name || '';
  const profilePic = post.author?.profilePicture?.trim();
  const likeCount = post.likes?.length || 0;
  const commentCount = post.comments?.length || 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <SwipeToCloseScrollView
        style={styles.scrollView}
        contentContainerStyle={scrollContentStyle}
        overScrollMode="always"
        scrollEventThrottle={16}
        // swipe down past top to dismiss
        threshold={0}
        onClose={handleBack}
      >
        <View style={styles.contentWrapper}>
          <Animated.View style={{ opacity: contentOpacity }}>
            <CardContainer
              cardStyle={styles.card}
              bannerHeight={IMAGE_BANNER_HEIGHT}
              bannerOverlayColor={null}
              renderBanner={({ height }) => (
                <MediaSection
                  mediaUrl={mediaUrl}
                  isVideo={isVideo}
                  imageAspect={imageAspect}
                  mediaHeight={height}
                  mediaOpacity={mediaOpacity}
                  onVideoLoad={() => {
                    __DEV__ && console.log('[PostDetail] video onLoad');
                    Animated.timing(mediaOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
                  }}
                  onImageLoad={() => {
                    __DEV__ && console.log('[PostDetail] image onLoad');
                    Animated.timing(mediaOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
                  }}
                  onImageError={(e) => __DEV__ && console.log('[PostDetail] media onError', e?.nativeEvent)}
                  onPressImage={() => setModalVisible(true)}
                />
              )}
            >
              <View style={styles.overlayCard}>
                {/* Removed separate community chip here; will display in authorRow */}
                <AuthorSection
                  authorName={authorName}
                  authorCommunity={authorCommunity}
                  profilePic={profilePic}
                  actions={
                    <View style={styles.authorActionsRow}>
                      <TouchableOpacity
                        onPress={handleToggleLike}
                        style={styles.authorIconButton}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={22} color={themeVariables.primaryColor} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleCommentPress}
                        style={styles.authorIconButton}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons name="chatbubble-outline" size={22} color={themeVariables.primaryColor} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleShare}
                        style={styles.authorIconButton}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons name="share-social-outline" size={22} color={themeVariables.primaryColor} />
                      </TouchableOpacity>
                    </View>
                  }
                />
                <CardContent style={styles.cardContent}>
                  {post.content ? (
                    <Text style={styles.postContent}>{post.content}</Text>
                  ) : null}
                </CardContent>
              </View>
            </CardContainer>
          </Animated.View>
        {/* Removed bottom toolbar; icons now overlay the image */}
        {/* Lightbox modal for image */}
        <Modal visible={modalVisible} transparent={true} onRequestClose={() => setModalVisible(false)}>
          <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPress={() => setModalVisible(false)}>
            <GestureHandlerRootView style={{ flex: 1, width: '100%' }}>
              <ZoomableImage
                uri={mediaUrl}
                style={{ width: '100%', height: '100%' }}
                onRequestClose={() => setModalVisible(false)}
              />
            </GestureHandlerRootView>
          </TouchableOpacity>
        </Modal>
        <CommentsSection
          showCommentBox={showCommentBox}
          commentInputRef={commentInputRef}
          comment={normalizedCommentText}
          setComment={setCommentText}
          onSubmitComment={handlePostComment}
          comments={post.comments || []}
          commentBoxContainerStyle={commentBoxContainerStyle}
        />
        {/* Tags Section */}
        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Tags</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tagScrollContainer}
              contentContainerStyle={styles.tagChipsContainer}
            >
              {post.tags.map((tag, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.tagChipDetail}
                  onPress={() =>
                    navigation.navigate('Main', {
                      screen: 'Search',
                      params: { initialQuery: tag, initialQueryTs: Date.now() },
                    })
                  }
                >
                  <Text style={styles.tagTextDetail}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {/* Related Posts */}
        {relatedPosts?.length > 0 && (
          <View style={styles.relatedSection}>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Related Posts</Text>
            <FlatList
              horizontal
              data={relatedPosts.filter(p => p._id !== post._id)}
              keyExtractor={item => item._id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.relatedItem}
                  onPress={() =>
                    navigateToPostDetail({
                      navigation,
                      post: item,
                      postId: item._id,
                      token,
                      isTokenExpired,
                    })
                  }
                >
                  <FastImage
                    source={resolveImageSource(item.media?.[0], { priority: 'normal', fallback: '/img/events/Event_Placeholder.png' })}
                    style={styles.relatedImage}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                </TouchableOpacity>
              )}
            />
          </View>
        )}
        <FooterBrand containerStyle={footerContainerStyle} />
        </View>
      </SwipeToCloseScrollView>
    </SafeAreaView>
  );
};

export default PostDetailCard;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeVariables.whiteColor,
  },
  scrollView: {
    flex: 1,
    backgroundColor: themeVariables.whiteColor,
  },
  scrollContent: {
    paddingTop: HEADER_OFFSET,
    paddingBottom: 36,
    flexGrow: 1,
  },
  contentWrapper: {
    flexGrow: 1,
    minHeight: '100%',
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
  media: { width: '100%', height: undefined, minHeight: 220 },
  overlayCard: {
    ...detailCardOverlay,
  },
  titleBlock: { alignItems: 'center' },
  cardTitleText: {
    ...detailCardTitle,
  },
  cardSubtitleText: {
    ...detailCardSubtitle,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  authorInfoContainer: {
    marginLeft: 8,
    flex: 1,
    height: 40,
    justifyContent: 'space-between',
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: themeVariables.greyColor },
  authorName: { fontSize: 14, fontWeight: '600', color: themeVariables.blackColor, marginLeft: 2 },
  authorCommunity: { fontSize: 14, color: '#666' },
  cardContent: { ...detailCardContent, marginTop: 12 },
  postContent: { fontSize: 16, color: '#333', marginLeft: -15, marginTop: 10 },
  authorActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorIconButton: {
    marginLeft: 4,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
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
  modalContainer: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'center', alignItems: 'stretch', width: '100%' },
  modalImage: { width: '100%', height: '100%' },
  metricText: { marginLeft: 4, fontSize: 14, color: themeVariables.blackColor },
  // Image loading placeholder
  // Placeholder area for image loading to reserve space
  mediaPlaceholder: {
    width: '100%',
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  // Comment box heading
  commentHeading: { fontSize: 16, fontWeight: 'bold', color: themeVariables.blackColor, marginBottom: 8 },
  // Inline comments styles
  // Bottom toolbar styles
  postFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: themeVariables.whiteColor, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#fff' },
  postFooterIcon: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  footerIconText: { color: themeVariables.primaryColor, fontSize: 16, marginLeft: 6 },
  // Community chip below title
  communityChipDetail: {
    alignSelf: 'flex-start',
    backgroundColor: themeVariables.primaryColor,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginTop: 2,
  },
  communityChipText: { color: '#fff', fontSize: 12 },
  // Tag chips scrollable container (horizontal scroll)
  tagScrollContainer: { maxWidth: '100%', marginTop: 8, marginBottom: 8, overflow: 'hidden' },
  // Container for tag chips: align first tag with section heading
  tagChipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingRight: 16,
  },
  tagChipDetail: {
    backgroundColor: themeVariables.secondaryColor,
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 6,
    flexShrink: 0,
  },
  tagTextDetail: {
    fontSize: 14,
    color: themeVariables.blackColor,
    textAlign: 'center',
    flexShrink: 0,
  },
  // Divider before sections
  divider: {
    ...sectionBaseStyles.sectionDivider,
  },
  // Section container (bordered)
  sectionContainer: {
    ...sectionBaseStyles.sectionContainer,
  },
  tagsSection: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: themeVariables.whiteColor,
  },
  sectionTitle: {
    ...sectionBaseStyles.sectionTitle,
  },
  // Related posts section
  relatedSection: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: themeVariables.whiteColor,
  },
  relatedTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: themeVariables.blackColor },
  relatedItem: { marginRight: 12 },
  relatedImage: { width: 100, height: 100, borderRadius: 8 },
  footerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    paddingVertical: 24,
    paddingBottom: 36,
    backgroundColor: themeVariables.whiteColor || '#fff',
  },
});
