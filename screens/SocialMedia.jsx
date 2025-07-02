import React, { useEffect, useContext, useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  InteractionManager,
  TouchableOpacity,
  Alert,
  Text,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { likePost, commentOnPost, fetchExploreFeed, fetchForYouFeed, flagPost, deletePost } from '../services/PostService';
import { blockUser, muteUser } from '../services/UserService';
import themeVariables from '../styles/theme';
import { UserContext } from '../contexts/UserContext';
import Post from '../components/Post';
import WelcomeModal from '../modal/WelcomeModal';
import CommentModal from '../modal/CommentModal';

const SocialMedia = ({ initialPosts, scrollToTop, route, navigation }) => {
  const { token, communityId, isTokenExpired, refreshSession, user } = useContext(UserContext);
  // Debug logs removed
  const [activeTab, setActiveTab] = useState('explore');
  const [explorePosts, setExplorePosts] = useState(initialPosts || []);
  const [forYouPosts, setForYouPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [currentPostId, setCurrentPostId] = useState(null);
  const [commentText, setCommentText] = useState('');

  const [welcomeModalVisible, setWelcomeModalVisible] = useState(false);
  const flatListRef = useRef(null);
  const pendingScrollIndexRef = useRef(null);

  useEffect(() => {
    if (scrollToTop) {
      flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
    }
  }, [scrollToTop]);
  // Handle deep-linking to a specific post: scroll as soon as possible
  useEffect(() => {
    const post = route?.params?.post;
    if (!post) return;
    const data = activeTab === 'explore' ? explorePosts : forYouPosts;
    const idx = data.findIndex(p => p._id === post._id);
    if (idx >= 0 && flatListRef.current) {
      InteractionManager.runAfterInteractions(() => {
        // Delay to allow layout measurement
        setTimeout(() => {
          try {
            flatListRef.current.scrollToIndex({ index: idx, animated: true });
          } catch (err) {
            // Fallback will be handled by onScrollToIndexFailed
          }
          // Clear navigation param after scrolling
          navigation?.setParams({ post: undefined });
        }, 500);
      });
    }
  }, [route?.params?.post, explorePosts, forYouPosts, activeTab]);

  const fetchExplorePosts = useCallback(async () => {
    try {
      const exploreData = await fetchExploreFeed();
      setExplorePosts(exploreData);
    } catch (error) {
      console.error('Error fetching explore feed:', error);
    }
  }, []);

  const fetchForYouPosts = useCallback(async () => {
    if (!token) return;
    // Check token + refresh if needed
    if (isTokenExpired(token)) {
      await refreshSession();
      if (!token || isTokenExpired(token)) return;
    }
    try {
      const forYouData = await fetchForYouFeed(communityId, token);
      setForYouPosts(forYouData);
    } catch (error) {
      console.error('Error fetching for you feed:', error);
    }
  }, [communityId, token, refreshSession, isTokenExpired]);

  useEffect(() => {
    const loadData = async () => {
      if (activeTab === 'explore') {
        await fetchExplorePosts();
      } else if (activeTab === 'foryou' && token) {
        await fetchForYouPosts();
      }
    };
    loadData();
  }, [activeTab, fetchExplorePosts, fetchForYouPosts, token]);

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
      setActiveTab(tab);
    }
  };

  const handleLike = async (postId, userId) => {
    if (!token) {
      setWelcomeModalVisible(true);
      return;
    }
  
    try {
      const updatedPostResponse = await likePost(postId, token);
      const updatedPost = updatedPostResponse.data;
  
      setExplorePosts((prev) => 
        prev.map((p) => (p._id === postId ? updatedPost : p))
      );
      setForYouPosts((prev) => 
        prev.map((p) => (p._id === postId ? updatedPost : p))
      );
  
      const isLiked = updatedPost.likes?.includes(userId);
      return isLiked;
    } catch (error) {
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
      <View style={styles.tabRow}>
        <Pressable
          onPress={() => handleTabPress('explore')}
          style={({ pressed }) => [
            styles.tabItem,
            pressed && styles.pressedTab
          ]}
        >
          {({ pressed }) => (
            <Text style={[
              styles.tabText,
              activeTab === 'explore' && styles.activeTabText,
              pressed && styles.pressedTabText,
              activeTab === 'explore' && styles.underlineText
            ]}>
              Explore
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => handleTabPress('foryou')}
          style={({ pressed }) => [
            styles.tabItem,
            pressed && styles.pressedTab
          ]}
        >
          {({ pressed }) => (
            <Text style={[
              styles.tabText,
              activeTab === 'foryou' && styles.activeTabText,
              pressed && styles.pressedTabText,
              activeTab === 'foryou' && styles.underlineText
            ]}>
              For You
            </Text>
          )}
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size='large' color='#0485e2' style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={activeTab === 'explore' ? explorePosts : forYouPosts}
          scrollEnabled={scrollEnabled}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
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
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          // Fallback if scrollToIndex fails
          onScrollToIndexFailed={({ index, averageItemLength }) => {
            flatListRef.current?.scrollToOffset({
              offset: index * averageItemLength,
              animated: true,
            });
          }}
        />
      )}

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
    backgroundColor: themeVariables.greyColor,
    marginBottom: 50
  },
  tabRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    backgroundColor: themeVariables.whiteColor, 
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: themeVariables.borderColor,
  },
  tabItem: { 
    flex: 1, 
    paddingVertical: 12, 
    backgroundColor: themeVariables.greyColor,
  },
  tabText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333',
    textAlign: 'center',
  },
  activeTab: { 
    borderBottomWidth: 3, 
    borderBottomColor: '#312783' 
  },
  activeTabText: { 
    color: themeVariables.blackColor,
  },
  pressedTab: {
    backgroundColor: themeVariables.greyColor, // subtle highlight when pressing
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
