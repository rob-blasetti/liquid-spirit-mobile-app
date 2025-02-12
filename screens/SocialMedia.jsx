import React, {
    useEffect,
    useContext,
    useState,
    useCallback,
    useRef
  } from 'react';
  import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    TextInput,
    Modal,
    Button,
    Alert
  } from 'react-native';
  import FastImage from 'react-native-fast-image';
  import {
    likePost,
    commentOnPost,
    fetchExploreFeed,
    fetchForYouFeed,
  } from '../services/PostService';
  import { UserContext } from '../contexts/UserContext';
  import WelcomeScreen from '../screens/Welcome';
  
  const DOUBLE_TAP_DELAY = 300; // ms between taps for a double-tap
  
  const SocialMedia = () => {
    const { token, communityId, isTokenExpired, refreshSession } = useContext(UserContext);
  
    // Track which tab is active: 'explore' (default) or 'foryou'
    const [activeTab, setActiveTab] = useState('explore');
  
    // Separate states for Explore and For You posts
    const [explorePosts, setExplorePosts] = useState([]);
    const [forYouPosts, setForYouPosts] = useState([]);
  
    // Loading and refresh states
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
  
    // Comment modal state
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
  
    // For You feed
    const fetchForYouPosts = useCallback(async () => {
      if (!token) return;
      
      if (isTokenExpired(token)) {
        await refreshSession();
    
        if (!token || isTokenExpired(token)) {
          return;
        }
      }
    
      try {
        const forYouData = await fetchForYouFeed(communityId, token);
        setForYouPosts(forYouData);
      } catch (error) {
        console.error('Error fetching for you feed:', error);
      }
    }, [communityId, token, refreshSession]);
  
    // On initial load, fetch both feeds in parallel
    useEffect(() => {
        (async () => {
          setLoading(true);
          await fetchExplorePosts();
          if (token) {
            await fetchForYouPosts(); // Only fetch if user is logged in
          }
          setLoading(false);
        })();
      }, [fetchExplorePosts, fetchForYouPosts, token]);
  
    // Refresh control
    const onRefresh = useCallback(async () => {
      setRefreshing(true);
      if (activeTab === 'explore') {
        await fetchExplorePosts();
      } else {
        await fetchForYouPosts();
      }
      setRefreshing(false);
    }, [activeTab, fetchExplorePosts, fetchForYouPosts]);
  
    // ─────────────────────────────────────────────────────────────────────────────
    // LIKE / COMMENT
    // ─────────────────────────────────────────────────────────────────────────────
  
    // Helper: get active array based on tab
    const getActivePosts = () => {
      return activeTab === 'explore' ? explorePosts : forYouPosts;
    };
  
    // Helper: set active array
    const setActivePosts = (updater) => {
      if (activeTab === 'explore') {
        setExplorePosts((prev) => (typeof updater === 'function' ? updater(prev) : updater));
      } else {
        setForYouPosts((prev) => (typeof updater === 'function' ? updater(prev) : updater));
      }
    };
  
    // Like handler
    const handleLike = useCallback(
      async (postId) => {
        try {
          const updatedPost = await likePost(postId, token);
          setActivePosts((prev) =>
            prev.map((p) => (p._id === postId ? updatedPost : p))
          );
        } catch (error) {
          console.error('Error liking post:', error);
          Alert.alert('Error', 'An error occurred while liking the post');
        }
      },
      [token, activeTab]
    );
  
    // Open comment modal
    const openCommentModal = (postId) => {
      setCurrentPostId(postId);
      setCommentText('');
      setCommentModalVisible(true);
    };
  
    // Submit comment
    const submitComment = useCallback(() => {
      if (!commentText.trim()) {
        return Alert.alert('Error', 'Comment cannot be empty');
      }
      (async () => {
        try {
          const updatedPost = await commentOnPost(currentPostId, commentText, token);
          setActivePosts((prev) =>
            prev.map((p) => (p._id === currentPostId ? updatedPost : p))
          );
          setCommentModalVisible(false);
          setCommentText('');
        } catch (error) {
          console.error('Error commenting on post:', error);
          Alert.alert('Error', 'An error occurred while commenting on the post');
        }
      })();
    }, [currentPostId, token, commentText, activeTab]);

    // ─────────────────────────────────────────────────────────────────────────────
    // HANDLE TAB SWITCHING
    // ─────────────────────────────────────────────────────────────────────────────

    const handleTabPress = (tabName) => {
        if (tabName === 'foryou' && !token) {
        // ✅ Show Welcome modal if user is not logged in
        setWelcomeModalVisible(true);
        } else {
        // ✅ Switch tabs normally
        setActiveTab(tabName);
        }
    };
  
    // ─────────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────────
    const RenderPost = React.memo(({ item }) => {
      const authorName = `${item.author?.firstName || 'Unknown'} ${item.author?.lastName || 'Author'}`;
      const authorCommunity = item.community?.name || 'Unknown';
      const profilePic = item.author?.profilePicture || 'https://via.placeholder.com/50';
      const mediaUrl = item.media?.[0] || 'https://via.placeholder.com/200';
      const likeCount = item.likes?.length || 0;
      const commentCount = item.comments?.length || 0;
  
      // Double-tap logic
      const lastTapRef = useRef(0);
      const handlePostPress = () => {
        const now = Date.now();
        if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
          handleLike(item._id);
        }
        lastTapRef.current = now;
      };
  
      // Show/hide comments
      const [showComments, setShowComments] = useState(false);
      const toggleComments = () => setShowComments((prev) => !prev);
  
      return (
        <TouchableOpacity
          style={styles.postContainer}
          activeOpacity={1}
          onPress={handlePostPress}
        >
          <View style={styles.userInfoContainer}>
            <View style={styles.userInfo}>
              <FastImage
                source={{ uri: profilePic }}
                style={styles.profilePic}
                resizeMode={FastImage.resizeMode.cover}
              />
              <Text style={styles.username}>{authorName}</Text>
            </View>
            <View style={styles.communityChip}>
              <Text style={styles.communityText}>{authorCommunity}</Text>
            </View>
          </View>
  
          <FastImage
            source={{ uri: mediaUrl }}
            style={styles.postImage}
            resizeMode={FastImage.resizeMode.cover}
          />
  
          <Text style={styles.postTitle}>{item.title}</Text>
          <Text style={styles.postContent}>{item.content}</Text>
  
          {/* Footer: like and comment actions */}
          <View style={styles.postFooter}>
            <TouchableOpacity onPress={() => handleLike(item._id)}>
              <Text style={styles.footerText}>💙 {likeCount} Likes</Text>
            </TouchableOpacity>
  
            <TouchableOpacity onPress={() => openCommentModal(item._id)}>
              <Text style={styles.footerText}>💬 {commentCount} Comments</Text>
            </TouchableOpacity>
  
            {/* Show/Hide Comments button */}
            <TouchableOpacity onPress={toggleComments}>
              <Text style={styles.footerText}>
                {showComments ? 'Hide Comments' : 'Show All Comments'}
              </Text>
            </TouchableOpacity>
          </View>
  
          {/* Conditionally render the comment list */}
          {showComments && (
            <View style={styles.commentsContainer}>
              {item.comments?.map((comment) => (
                <View style={styles.commentItem} key={comment._id}>
                  <Text style={styles.commentAuthor}>
                    {comment.user?.firstName || 'Unknown'} {comment.user?.lastName || ''}
                  </Text>
                  <Text style={styles.commentText}>{comment.comment}</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      );
    });
  
    // Determine which posts to render
    const postsToRender = getActivePosts();
  
    return (
        <View style={styles.container}>
          {/* Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'explore' && styles.activeTab]}
              onPress={() => handleTabPress('explore')}
            >
              <Text style={[styles.tabText, activeTab === 'explore' && styles.activeTabText]}>
                Explore
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'foryou' && styles.activeTab]}
              onPress={() => handleTabPress('foryou')}
            >
              <Text style={[styles.tabText, activeTab === 'foryou' && styles.activeTabText]}>
                For You
              </Text>
            </TouchableOpacity>
          </View>
  
        {/* Main content */}
        {loading ? (
          <ActivityIndicator size='large' color='#0485e2' style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={postsToRender}
            renderItem={({ item }) => <RenderPost item={item} />}
            keyExtractor={(item, index) => (item._id ? item._id.toString() : index.toString())}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#0485e2']}
              />
            }
          />
        )}

        {/* Welcome Modal */}
        <Modal visible={welcomeModalVisible} animationType="slide" transparent>
            <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setWelcomeModalVisible(false)}
            >
            <View style={styles.modalContainer}>
                <WelcomeScreen closeModal={() => setWelcomeModalVisible(false)} />
            </View>
            </TouchableOpacity>
        </Modal>
  
        {/* Comment Modal */}
        <Modal visible={commentModalVisible} animationType='slide' transparent>
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Add a Comment</Text>
              <TextInput
                style={styles.commentInput}
                placeholder='Write your comment...'
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <View style={styles.modalButtonRow}>
                <Button title='Cancel' onPress={() => setCommentModalVisible(false)} />
                <Button title='Submit' onPress={submitComment} />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  };
  
  export default SocialMedia;
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    tabRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      backgroundColor: '#fff',
      elevation: 2,
    },
    tabItem: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
    },
    tabText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
    },
    activeTab: {
      borderBottomWidth: 3,
      borderBottomColor: '#312783',
    },
    activeTabText: {
      color: '#312783',
    },
    list: {
      padding: 10,
      paddingBottom: 60,
    },
    postContainer: {
      marginBottom: 20,
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 5,
    },
    userInfoContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    profilePic: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 10,
    },
    username: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    communityChip: {
      backgroundColor: '#312783',
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 20,
      alignSelf: 'flex-start',
    },
    communityText: {
      fontSize: 14,
      color: '#fff',
      fontWeight: '600',
    },
    postImage: {
      width: '100%',
      height: 300,
      borderRadius: 20,
      marginBottom: 10,
      resizeMode: 'cover',
    },
    postTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 5,
    },
    postContent: {
      fontSize: 14,
      color: '#555',
    },
    postFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    footerText: {
      fontSize: 14,
      color: '#777',
      marginRight: 10,
    },
    commentsContainer: {
      marginTop: 10,
      backgroundColor: '#f9f9f9',
      borderRadius: 5,
      padding: 10,
    },
    commentItem: {
      marginBottom: 8,
    },
    commentAuthor: {
      fontWeight: 'bold',
      marginBottom: 2,
    },
    commentText: {
      marginLeft: 5,
    },
    modalBackground: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
      width: '90%',
      height: '90%',
      padding: 24,
      backgroundColor: '#fff',
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 12,
    },
    commentInput: {
      width: '100%',
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      padding: 12,
      height: 80,
      textAlignVertical: 'top',
      backgroundColor: '#f9f9f9',
    },
    modalButtonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 10,
    },
  });
  