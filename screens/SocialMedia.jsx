import React, { useEffect, useContext, useState, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  InteractionManager,
  TouchableOpacity,
  Alert,
  Text,
  Pressable,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SlideBanner from '../components/SlideBanner';

import { likePost, commentOnPost, fetchExploreFeed, fetchForYouFeed, flagPost, deletePost } from '../services/PostService';
import { blockUser, muteUser } from '../services/UserService';
import themeVariables from '../styles/theme';
import { UserContext } from '../contexts/UserContext';
import { CommunityContext } from '../contexts/CommunityContext';
import Post from '../components/Post';
import WelcomeModal from '../modal/WelcomeModal';
import CommentModal from '../modal/CommentModal';
import SkeletonPost from '../components/SkeletonPost';

const SocialMedia = ({ initialPosts, scrollToTop, route, navigation }) => {
  const { token, isTokenExpired, refreshSession, user } = useContext(UserContext);
  const { communityId } = useContext(CommunityContext);
  // Debug logs removed
  const [activeTab, setActiveTab] = useState('explore');
  const [explorePosts, setExplorePosts] = useState(initialPosts || []);
  const [forYouPosts, setForYouPosts] = useState([]);
  // Per-tab loading to control skeleton display on first load of each tab
  const [loadingExplore, setLoadingExplore] = useState(!(initialPosts && initialPosts.length > 0));
  const [loadingForYou, setLoadingForYou] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [currentPostId, setCurrentPostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  // Banner message for redirects or alerts
  const [bannerMessage, setBannerMessage] = useState('');
  // Offset for banner to slide below the tabs
  const [bannerOffset, setBannerOffset] = useState(0);

  const [welcomeModalVisible, setWelcomeModalVisible] = useState(false);
  const flatListExploreRef = useRef(null);
  const flatListForYouRef = useRef(null);
  const pendingScrollIndexRef = useRef(null);
  // Slide transitions between tabs/content
  const screenWidth = Dimensions.get('window').width;
  const slideX = useRef(new Animated.Value(0)).current; // 0 = explore, -screenWidth = foryou
  // Listen for banner message passed via navigation params
  useEffect(() => {
    const msg = route?.params?.bannerMessage;
    if (msg) {
      setBannerMessage(msg);
      navigation.setParams({ bannerMessage: undefined });
    }
  }, [route?.params?.bannerMessage, navigation]);

  useEffect(() => {
    const ref = activeTab === 'explore' ? flatListExploreRef : flatListForYouRef;
    if (scrollToTop) {
      ref.current?.scrollToOffset({ animated: true, offset: 0 });
    }
  }, [scrollToTop, activeTab]);
  // Handle deep-linking to a specific post: scroll as soon as possible
  useEffect(() => {
    const post = route?.params?.post;
    const postIdParam = route?.params?.postId;
    const targetId = post?._id ?? postIdParam;
    if (!targetId) return;
    const data = activeTab === 'explore' ? explorePosts : forYouPosts;
    const idx = data.findIndex(p => p._id === targetId);
    const ref = activeTab === 'explore' ? flatListExploreRef : flatListForYouRef;
    if (idx >= 0 && ref.current) {
      InteractionManager.runAfterInteractions(() => {
        // Delay to allow layout measurement
        setTimeout(() => {
          try {
            ref.current.scrollToIndex({ index: idx, animated: true });
          } catch (err) {
            // Fallback will be handled by onScrollToIndexFailed
          }
          // Clear navigation param after scrolling
          navigation?.setParams({ post: undefined, postId: undefined });
        }, 500);
      });
    }
  }, [route?.params?.post, route?.params?.postId, explorePosts, forYouPosts, activeTab]);

  // Load Explore tab posts, include auth token
  const fetchExplorePosts = useCallback(async () => {
    if (!token) return;
    try {
      // Ensure token validity
      if (isTokenExpired(token)) {
        await refreshSession();
        if (!token || isTokenExpired(token)) return;
      }
      // Show skeleton only if we don't already have items
      const shouldSkeleton = (explorePosts?.length || 0) === 0;
      if (shouldSkeleton) setLoadingExplore(true);
      // Defer heavy state work until after initial interactions
      await new Promise(resolve => InteractionManager.runAfterInteractions(resolve));
      const exploreData = await fetchExploreFeed(token);
      setExplorePosts(exploreData);
      if (shouldSkeleton) setLoadingExplore(false);
    } catch (error) {
      console.error('Error fetching explore feed:', error);
      setLoadingExplore(false);
    }
  }, [token, isTokenExpired, refreshSession, explorePosts?.length]);

  const fetchForYouPosts = useCallback(async () => {
    if (!token) return;
    // Check token + refresh if needed
    if (isTokenExpired(token)) {
      await refreshSession();
      if (!token || isTokenExpired(token)) return;
    }
    try {
      const shouldSkeleton = (forYouPosts?.length || 0) === 0;
      if (shouldSkeleton) setLoadingForYou(true);
      await new Promise(resolve => InteractionManager.runAfterInteractions(resolve));
      const forYouData = await fetchForYouFeed(communityId, token);
      setForYouPosts(forYouData);
      if (shouldSkeleton) setLoadingForYou(false);
    } catch (error) {
      console.error('Error fetching for you feed:', error);
      setLoadingForYou(false);
    }
  }, [communityId, token, refreshSession, isTokenExpired, forYouPosts?.length]);

  useEffect(() => {
    const loadData = async () => {
      if (activeTab === 'explore') {
        fetchExplorePosts();
      } else if (activeTab === 'foryou' && token) {
        fetchForYouPosts();
      }
    };
    loadData();
  }, [activeTab, fetchExplorePosts, fetchForYouPosts, token]);

  // Preload first few images to speed up perception of load
  useEffect(() => {
    const data = activeTab === 'explore' ? explorePosts : forYouPosts;
    const urls = data
      .slice(0, 4)
      .map(p => (Array.isArray(p.media) && p.media[0] ? p.media[0] : null))
      .filter(Boolean)
      .map(uri => ({ uri }));
    if (urls.length > 0) {
      try {
        // Dynamically require to avoid import cost if not needed
        const FastImage = require('react-native-fast-image');
        FastImage.preload(urls);
      } catch (_) {}
    }
  }, [activeTab, explorePosts, forYouPosts]);

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

  const renderPost = useCallback(({ item }) => (
    <Post
      post={item}
      onLike={handleLike}
      onComment={openCommentModal}
      onFlag={handleFlag}
      onBlock={handleBlock}
      onMute={handleMute}
      onDelete={handleDelete}
      setScrollEnabled={setScrollEnabled}
    />
  ), [handleLike, openCommentModal, handleFlag, handleBlock, handleMute, handleDelete]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'explore') {
      await fetchExplorePosts();
    } else {
      await fetchForYouPosts();
    }
    setRefreshing(false);
  }, [activeTab, fetchExplorePosts, fetchForYouPosts]);

  const handleTabPress = (tab) => {
    if (tab === 'foryou' && !token) {
      setWelcomeModalVisible(true);
    } else {
      // Animate horizontal slide between panes
      const toValue = tab === 'explore' ? 0 : -screenWidth;
      setActiveTab(tab);
      Animated.timing(slideX, {
        toValue,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      // Kick off skeleton state early if target tab has no items yet
      if (tab === 'explore' && (explorePosts?.length || 0) === 0) setLoadingExplore(true);
      if (tab === 'foryou' && (forYouPosts?.length || 0) === 0) setLoadingForYou(true);
    }
  };

  const handleLike = async (postId, userId) => {
    if (!token) {
      setWelcomeModalVisible(true);
      return;
    }

    try {
      const updatedPostResponse = await likePost(postId, token, { userId });
      const updatedPost = updatedPostResponse.data;

      if (__DEV__) {
        console.log('[SocialMedia] like response received', {
          postId,
          userId,
          likeCount: Array.isArray(updatedPost?.likes) ? updatedPost.likes.length : undefined,
        });
      }

      setExplorePosts((prev) =>
        prev.map((p) => (p._id === postId ? updatedPost : p))
      );
      setForYouPosts((prev) =>
        prev.map((p) => (p._id === postId ? updatedPost : p))
      );

      const isLiked = hasUserLiked(updatedPost.likes, userId);
      return isLiked;
    } catch (error) {
      console.error('[SocialMedia] handleLike error', error);
      Alert.alert('Error', 'An error occurred while liking the post');
      return null;
    }
  };

  const openCommentModal = (postId) => {
    if (!token) {
      setWelcomeModalVisible(true);
      return;
    }
    setCurrentPostId(postId);
    setCommentText('');
    setCommentModalVisible(true);
  };

  const submitComment = async () => {
    if (!commentText.trim()) {
      return Alert.alert('Error', 'Comment cannot be empty');
    }
    try {
      const updatedPost = await commentOnPost(currentPostId, commentText, token);
      // Update both feeds if the post is present in them
      setExplorePosts(prev => prev.map(p => (p._id === currentPostId ? updatedPost : p)));
      setForYouPosts(prev => prev.map(p => (p._id === currentPostId ? updatedPost : p)));
      setCommentModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'An error occurred while commenting on the post');
    }
  };

  const handleFlag = async (postId) => {
    try {
      // Example: call an API to flag the post
      await flagPost(postId, token);
      Alert.alert('Report', 'Post has been reported.');
    } catch (error) {
      Alert.alert('Error', 'An error occurred while reporting the post');
    }
  };

  const handleBlock = async (userId) => {
    try {
      // Example: call an API to block the user
      await blockUser(userId, token);
      Alert.alert('Block', 'User has been blocked.');

      setExplorePosts(prev => prev.filter(p => p.author?._id !== userId));
      setForYouPosts(prev => prev.filter(p => p.author?._id !== userId));
    } catch (error) {
      Alert.alert('Error', 'An error occurred while blocking the user');
    }
  };

  const handleMute = async (userId) => {
    try {
      await muteUser(userId, token);
      Alert.alert('Mute', 'User has been muted.');

      setExplorePosts(prev => prev.filter(p => p.author?._id !== userId));
      setForYouPosts(prev => prev.filter(p => p.author?._id !== userId));
    } catch (error) {
      Alert.alert('Error', 'An error occurred while muting the user');
    }
  };

  const handleDelete = async (postId) => {
    try {
      await deletePost(postId, token);
      Alert.alert('Delete Post', 'Post has been deleted.');

      // filter by post id instead of author id
      setExplorePosts(prev => prev.filter(p => p._id !== postId));
      setForYouPosts(prev => prev.filter(p => p._id !== postId));
    } catch (error) {
      Alert.alert('Error', 'An error occurred while deleting the post.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Banner for messages */}
      {bannerMessage && (
        <SlideBanner
          message={bannerMessage}
          onClose={() => setBannerMessage('')}
          slideTo={bannerOffset}
        />
      )}
      <View
        style={styles.tabRow}
        onLayout={e => setBannerOffset(e.nativeEvent.layout.height)}
      >
        <Pressable
          onPress={() => handleTabPress('explore')}
          style={({ pressed }) => [
            styles.tabItem,
            pressed && styles.pressedTab,
          ]}
        >
          {({ pressed }) => (
            <Text style={[
              styles.tabText,
              activeTab === 'explore' && styles.activeTabText,
              pressed && styles.pressedTabText,
              activeTab === 'explore' && styles.underlineText,
            ]}>
              Explore
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => handleTabPress('foryou')}
          style={({ pressed }) => [
            styles.tabItem,
            pressed && styles.pressedTab,
          ]}
        >
          {({ pressed }) => (
            <Text style={[
              styles.tabText,
              activeTab === 'foryou' && styles.activeTabText,
              pressed && styles.pressedTabText,
              activeTab === 'foryou' && styles.underlineText,
            ]}>
              For You
            </Text>
          )}
        </Pressable>
      </View>

      <View style={{ flex: 1, overflow: 'hidden' }}>
        <Animated.View style={{ flexDirection: 'row', width: screenWidth * 2, transform: [{ translateX: slideX }] }}>
          {/* Explore Pane */}
          <View style={{ width: screenWidth }}>
            <FlatList
              ref={flatListExploreRef}
              data={explorePosts}
              scrollEnabled={scrollEnabled}
              keyExtractor={(item) => item._id}
              renderItem={renderPost}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              removeClippedSubviews
              initialNumToRender={3}
              maxToRenderPerBatch={4}
              windowSize={9}
              updateCellsBatchingPeriod={40}
              ListEmptyComponent={() => (
                <View style={{ paddingTop: 12 }}>
                  {[0,1,2].map(i => (
                    <SkeletonPost key={`skeleton-explore-${i}`} />
                  ))}
                </View>
              )}
              onScrollToIndexFailed={({ index, averageItemLength }) => {
                flatListExploreRef.current?.scrollToOffset({ offset: index * averageItemLength, animated: true });
              }}
            />
          </View>
          {/* For You Pane */}
          <View style={{ width: screenWidth }}>
            <FlatList
              ref={flatListForYouRef}
              data={forYouPosts}
              scrollEnabled={scrollEnabled}
              keyExtractor={(item) => item._id}
              renderItem={renderPost}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              removeClippedSubviews
              initialNumToRender={3}
              maxToRenderPerBatch={4}
              windowSize={9}
              updateCellsBatchingPeriod={40}
              ListEmptyComponent={() => (
                <View style={{ paddingTop: 12 }}>
                  {[0,1,2].map(i => (
                    <SkeletonPost key={`skeleton-foryou-${i}`} />
                  ))}
                </View>
              )}
              onScrollToIndexFailed={({ index, averageItemLength }) => {
                flatListForYouRef.current?.scrollToOffset({ offset: index * averageItemLength, animated: true });
              }}
            />
          </View>
        </Animated.View>
      </View>

      <WelcomeModal
        visible={welcomeModalVisible}
        onClose={() => setWelcomeModalVisible(false)}
      />

      <CommentModal
        visible={commentModalVisible}
        onClose={() => setCommentModalVisible(false)}
        comments={explorePosts.find(p => p._id === currentPostId)?.comments}
        commentText={commentText}
        setCommentText={setCommentText}
        onSubmit={submitComment}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeVariables.screenBackgroundColor,
    marginBottom: 80,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: themeVariables.whiteColor,
    borderBottomWidth: 1,
    borderBottomColor: themeVariables.whiteColor,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: themeVariables.screenBackgroundColor,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#312783',
  },
  activeTabText: {
    color: themeVariables.blackColor,
  },
  pressedTab: {
    backgroundColor: themeVariables.screenBackgroundColor, // subtle highlight when pressing
  },
  pressedTabText: {
    color: themeVariables.blackColor,
  },
  underlineText: {
    borderBottomWidth: 3,
    borderBottomColor: '#312783',
    paddingBottom: 4, // spacing between text and underline
    alignSelf: 'center',
  },
});

export default SocialMedia;
