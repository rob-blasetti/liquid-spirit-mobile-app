import React, { useEffect, useContext, useState, useCallback } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  RefreshControl, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Button, 
  Alert, 
  Text 
} from 'react-native';

import { likePost, commentOnPost, fetchExploreFeed, fetchForYouFeed, flagPost } from '../services/PostService';
import { blockUser, muteUser } from '../services/UserService';

import { UserContext } from '../contexts/UserContext';
import Post from '../components/Post';

const SocialMedia = () => {
  const { token, communityId, isTokenExpired, refreshSession } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('explore');
  const [explorePosts, setExplorePosts] = useState([]);
  const [forYouPosts, setForYouPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [currentPostId, setCurrentPostId] = useState(null);
  const [commentText, setCommentText] = useState('');

  const [welcomeModalVisible, setWelcomeModalVisible] = useState(false);

  const fetchExplorePosts = useCallback(async () => {
    try {
      const exploreData = await fetchExploreFeed();
      setExplorePosts(exploreData);
    } catch (error) {
      console.error('Error fetching explore feed:', error);
    }
  }, [token]);

  const fetchForYouPosts = useCallback(async () => {
    if (!token) return;
    if (isTokenExpired(token)) {
      await refreshSession();
      // If refresh failed or still expired, bail out
      if (!token || isTokenExpired(token)) return;
    }
    try {
      const forYouData = await fetchForYouFeed(communityId, token);
      setForYouPosts(forYouData);
    } catch (error) {
      console.error('Error fetching for you feed:', error);
    }
  }, [communityId, token, refreshSession]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchExplorePosts();
      if (token) {
        await fetchForYouPosts();
      }
      setLoading(false);
    };
  
    fetchData();
  }, [activeTab]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'explore') {
      await fetchExplorePosts();
    } else {
      await fetchForYouPosts();
    }
    setRefreshing(false);
  }, [activeTab, fetchExplorePosts, fetchForYouPosts]);

  // -------------------------
  //    Post action handlers
  // -------------------------
  const handleLike = async (postId) => {
    try {
      const updatedPost = await likePost(postId, token);
      // Update both feeds if the post is present in them
      setExplorePosts(prev => prev.map(p => (p._id === postId ? updatedPost : p)));
      setForYouPosts(prev => prev.map(p => (p._id === postId ? updatedPost : p)));
    } catch (error) {
      Alert.alert('Error', 'An error occurred while liking the post');
    }
  };

  const openCommentModal = (postId) => {
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

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'explore' && styles.activeTab]} 
          onPress={() => setActiveTab('explore')}
        >
          <Text style={[styles.tabText, activeTab === 'explore' && styles.activeTabText]}>
            Explore
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'foryou' && styles.activeTab]} 
          onPress={() => setActiveTab('foryou')}
        >
          <Text style={[styles.tabText, activeTab === 'foryou' && styles.activeTabText]}>
            For You
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size='large' color='#0485e2' style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={activeTab === 'explore' ? explorePosts : forYouPosts}
          renderItem={({ item }) => (
            <Post
              post={item}
              onLike={handleLike}
              onComment={openCommentModal}
              onFlag={handleFlag}
              onBlock={handleBlock}
              onMute={handleMute}
            />
          )}
          keyExtractor={(item, index) => item._id || index.toString()}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={['#0485e2']} 
            />
          }
        />
      )}

      {/* Example: a modal for adding comments */}
      <Modal visible={commentModalVisible} animationType="slide" onRequestClose={() => setCommentModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>Add a comment</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10 }}
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <Button title="Submit" onPress={submitComment} />
          <Button title="Cancel" onPress={() => setCommentModalVisible(false)} color="red" />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  tabRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    backgroundColor: '#fff', 
    elevation: 2 
  },
  tabItem: { 
    flex: 1, 
    paddingVertical: 12, 
    alignItems: 'center' 
  },
  tabText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333' 
  },
  activeTab: { 
    borderBottomWidth: 3, 
    borderBottomColor: '#312783' 
  },
  activeTabText: { 
    color: '#312783' 
  }
});

export default SocialMedia;
