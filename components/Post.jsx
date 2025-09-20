import React, { useState, useRef, useContext, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Animated,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import themeVariables from '../styles/theme';
import FastImage from 'react-native-fast-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ZoomableImage from './ZoomableImage';
import { resolveMediaUrl } from '../utils/resolveMediaUrl';
import { UserContext } from '../contexts/UserContext';
import WelcomeModal from '../modal/WelcomeModal';
import DropdownMenu from './DropdownMenu';
import { shareContent } from '../utils/shareContent';

const solidHeart = 'heart';
const heartOutline = 'heart-outline';
const ellipsisIcon = 'ellipsis-vertical';
const shareIcon = 'share-outline';

const DOUBLE_TAP_DELAY = 300;

const Post = ({ post, onLike, onComment, onFlag, onBlock, onMute, onDelete, setScrollEnabled }) => {
  const { token, user } = useContext(UserContext);
  const navigation = useNavigation();
  // Ref to track pending single-tap navigation vs double-tap like
  const singleTapTimeoutRef = useRef(null);
  // Clean up pending timer on unmount
  useEffect(() => () => {
    clearTimeout(singleTapTimeoutRef.current);
  }, []);
  // Track loaded image aspect ratio for detail screen
  const [imageAspect, setImageAspect] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  // Helper: determine if current user has liked this post
  const hasUserLiked = useCallback((likes, uid) => {
    if (!Array.isArray(likes) || !uid) return false;
    return likes.some(like => {
      if (!like) return false;
      // Case: likes array contains plain user ID strings
      if (typeof like === 'string') {
        return like === uid;
      }
      if (typeof like === 'object') {
        // Case: like is a user object ({ _id, id, ... })
        if (like._id === uid || like.id === uid) {
          return true;
        }
        // Case: like is a like document with a user field (string or nested object)
        if (typeof like.user === 'string' && like.user === uid) {
          return true;
        }
        if (like.user && typeof like.user === 'object' && (like.user._id === uid || like.user.id === uid)) {
          return true;
        }
        // Case: like document uses userId field
        if (typeof like.userId === 'string' && like.userId === uid) {
          return true;
        }
      }
      return false;
    });
  }, []);
  // Sync isLiked state when likes or user changes
  useEffect(() => {
    const uid = user?.id || user?._id;
    setIsLiked(hasUserLiked(post.likes, uid));
  }, [post.likes, user, hasUserLiked]);

  const [expanded, setExpanded] = useState(false);

  const authorName = `${post.author?.firstName || 'Unknown'} ${post.author?.lastName || 'Author'}`;
  const authorCommunity = post.community?.name || 'Unknown';
  const profilePic = post.author?.profilePicture?.trim()
    ? post.author.profilePicture.trim()
    : 'https://via.placeholder.com/50';
  const mediaUrl = resolveMediaUrl(post) || 'https://via.placeholder.com/200';
  const isVideo = typeof mediaUrl === 'string' && (
    mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm') || mediaUrl.endsWith('.mov')
  );
  const userId = user?.id || user?._id;
  // initial liked state based on post.likes
  const [isLiked, setIsLiked] = useState(() => hasUserLiked(post.likes, userId));
  const commentCount = post.comments?.length || 0;
  const isOwn = post.author._id === userId;

  const handleToggleMenu = () => {
    if (!token) {
      setWelcomeModalVisible(true);
      return;
    }

    const newMenuVisible = !menuVisible;
    setMenuVisible(newMenuVisible);
    setScrollEnabled(!newMenuVisible);
  };

  const handleCloseMenu = () => {
    setMenuVisible(false);
    setScrollEnabled(true);
  };

  const handleFlag = () => {
    onFlag(post._id);
    handleCloseMenu();
  };

  const handleBlock = () => {
    onBlock(post.author._id);
    handleCloseMenu();
  };

  const handleMute = () => {
    onMute(post.author._id);
    handleCloseMenu();
  };

  const handleDeletePost = () => {
    onDelete(post._id);
    handleCloseMenu();
  };

  const handleSharePost = useCallback((id) => {
    if (!id) return;
    const url = `https://www.liquidspirit.org/posts/${id}`;
    const message = `Check out this post on Liquid Spirit \uD83D\uDC47\n${url}`;
    shareContent({
      url,
      message,
      title: 'Liquid Spirit Post',
      alertMessage: 'Something went wrong while trying to share the post.',
    });
  }, []);

  const isLikedRef = useRef(isLiked);
  useEffect(() => {
    isLikedRef.current = isLiked;
  }, [isLiked]);

  const likeInFlightRef = useRef(false);

  const toggleLike = useCallback(async () => {
    if (!token) {
      setWelcomeModalVisible(true);
      return;
    }

    if (likeInFlightRef.current) {
      if (__DEV__) {
        console.log('[Post] like ignored (in flight)', { postId: post._id, userId });
      }
      return;
    }

    const previousLiked = isLikedRef.current;
    const optimisticLiked = !previousLiked;

    if (__DEV__) {
      console.log('[Post] toggling like', {
        postId: post._id,
        userId,
        previousLiked,
        optimisticLiked,
      });
    }

    likeInFlightRef.current = true;
    setIsLiked(optimisticLiked);
    isLikedRef.current = optimisticLiked;

    try {
      const serverLiked = await onLike(post._id, userId);
      if (__DEV__) {
        console.log('[Post] like response', {
          postId: post._id,
          userId,
          serverLiked,
        });
      }
      if (typeof serverLiked === 'boolean') {
        setIsLiked(serverLiked);
        isLikedRef.current = serverLiked;
      }
    } catch (error) {
      console.error('Error updating like:', error);
      setIsLiked(previousLiked);
      isLikedRef.current = previousLiked;
    if (__DEV__) {
      console.log('[Post] like reverted due to error', {
        postId: post._id,
        userId,
        error: String(error),
      });
    }
    } finally {
      likeInFlightRef.current = false;
    }
  }, [onLike, post._id, token, userId]);

  const lastTapRef = useRef(0);
  /**
   * Handle tap: double-tap to like, single-tap to open detail
   */
  const handlePostPress = () => {
    const now = Date.now();
    // Double-tap within delay -> like
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      clearTimeout(singleTapTimeoutRef.current);
      if (!isLikedRef.current) toggleLike();
    } else {
      // Single-tap -> navigate to detail after delay
      singleTapTimeoutRef.current = setTimeout(() => {
        if (__DEV__) console.log('[Post] navigate PostDetailCard', { id: post._id });
        navigation.navigate('PostDetailCard', {
          postId: post._id,
          postPreload: post,
          imageAspect,
        });
      }, DOUBLE_TAP_DELAY);
    }
    lastTapRef.current = now;
  };

  const kebabRef = useRef(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [welcomeModalVisible, setWelcomeModalVisible] = useState(false);
  // Helper to format relative time ago
  const computeTimeAgo = (dateString) => {
    if (!dateString) return '';
    const diffMs = Date.now() - new Date(dateString).getTime();
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo`;
    const years = Math.floor(days / 365);
    return `${years}y`;
  };

  // Fade media on load for smoother appearance
  const mediaOpacity = useRef(new Animated.Value(0.6)).current;
  const animateMediaIn = () => {
    Animated.timing(mediaOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  };

  return (
    <TouchableOpacity
      style={styles.postContainer}
      activeOpacity={1}
      onPress={handlePostPress}
    >
      <View style={styles.userInfoContainer}>
        <View style={styles.leftContainer}>
          <TouchableOpacity
            style={styles.avatarTouchable}
            onPress={() => navigation.navigate('PublicUserProfile', { userId: post.author?._id })}
          >
            <FastImage
              source={{ uri: profilePic, priority: FastImage.priority.normal, cache: FastImage.cacheControl.immutable }}
              style={styles.profilePic}
              resizeMode={FastImage.resizeMode.cover}
              onError={(e) => console.error('Profile picture failed to load:', e.nativeEvent.error)}
            />
          </TouchableOpacity>
          <View style={styles.infoContainer}>
            <TouchableOpacity
              style={styles.nameRow}
              onPress={() => navigation.navigate('PublicUserProfile', { userId: post.author?._id })}
            >
              <Text style={styles.username}>{authorName}</Text>
              <Text style={styles.dotSeparator}>·</Text>
              <Text style={styles.timeAgo}>{computeTimeAgo(post.createdAt)}</Text>
            </TouchableOpacity>

            {(authorCommunity || (Array.isArray(post.tags) && post.tags.length > 0)) && (
              <View style={styles.chipsRow}>
                {authorCommunity && (
                  <TouchableOpacity
                    style={styles.communityChip}
                    onPress={() => navigation.navigate('Search', { initialQuery: authorCommunity })}
                  >
                    <Text style={styles.communityText}>{authorCommunity}</Text>
                  </TouchableOpacity>
                )}

                {Array.isArray(post.tags) && post.tags.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tagScrollContainer}
                    contentContainerStyle={styles.tagChipsContainer}
                  >
                    {post.tags.map((tag, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.tagChip}
                        onPress={() => navigation.navigate('Search', { initialQuery: tag })}
                      >
                        <Text style={styles.tagText}>{tag}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>
        </View>
        <View ref={kebabRef} collapsable={false} style={styles.kebabContainer}>
          <TouchableOpacity onPress={handleToggleMenu}>
            <Ionicons name={ellipsisIcon} size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Image */}
      <View style={styles.mediaContainer}>
        <Animated.View style={{ opacity: mediaOpacity }}>
          {isVideo ? (
            <Video
              source={{ uri: mediaUrl }}
              style={styles.video}
              controls
              resizeMode="contain"
              paused
              onLoad={() => { __DEV__ && console.log('[Post] video onLoad'); animateMediaIn(); }}
              onError={e => __DEV__ && console.log('[Post] video onError', e?.nativeEvent)}
            />
          ) : (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                try { FastImage.preload([{ uri: mediaUrl }]); } catch (_) {}
                setImageModalVisible(true);
              }}
            >
              <FastImage
                source={{
                  uri: mediaUrl,
                  priority: FastImage.priority.normal,
                  cache: FastImage.cacheControl.immutable,
                }}
                style={styles.postImage}
                resizeMode={FastImage.resizeMode.cover}
                onLoadStart={() => __DEV__ && console.log('[Post] image onLoadStart')}
                onLoad={({ nativeEvent }) => {
                  const { width, height } = nativeEvent;
                  if (width && height) {
                    setImageAspect(width / height);
                  }
                  __DEV__ && console.log('[Post] image onLoad', { width: nativeEvent?.width, height: nativeEvent?.height });
                  animateMediaIn();
                }}
                onError={e => __DEV__ && console.log('[Post] image onError', e?.nativeEvent)}
              />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Fullscreen Image Modal */}
        {!isVideo && (
          <Modal
            visible={imageModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setImageModalVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalContainer}
              activeOpacity={1}
              onPress={() => setImageModalVisible(false)}
            >
              <GestureHandlerRootView style={{ flex: 1, width: '100%' }}>
                <ZoomableImage
                  uri={mediaUrl}
                  style={{ width: '100%', height: '100%' }}
                  onRequestClose={() => setImageModalVisible(false)}
                />
              </GestureHandlerRootView>
              <TouchableOpacity style={styles.lightboxCloseButton} onPress={() => setImageModalVisible(false)}>
                <Text style={styles.lightboxCloseText}>×</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        )}
        <View style={styles.overlayContainer}>
          {expanded ? (
            <View>
              <Text style={styles.postContent}>{post.content}</Text>
              <TouchableOpacity style={styles.seeMoreRightContainer} onPress={() => setExpanded(false)}>
                <Text style={styles.seeMoreText}>See Less</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.descriptionRow}>
              <Text
                style={[styles.postContent, { flex: 1 }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {post.content}
              </Text>
              <TouchableOpacity style={styles.seeMoreRightContainer} onPress={() => setExpanded(true)}>
                <Text style={styles.seeMoreText}>See More</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.postFooter}>
        <TouchableOpacity style={styles.postFooterIcon} onPress={toggleLike}>
            <Ionicons
              name={isLiked ? solidHeart : heartOutline}
              size={24}
              color="#312783"
            />
            <Text style={styles.footerIconText} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.postFooterIcon} onPress={() => onComment(post._id)}>
          <Ionicons name="chatbubble-outline" size={24} color="#312783" />
          <Text style={styles.footerIconText}>{commentCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          // Push share icon to the right
          style={[styles.postFooterIcon, { marginLeft: 'auto' }]}
          onPress={() => handleSharePost(post._id)}
        >
          <Ionicons name={shareIcon} size={24} color="#312783" />
        </TouchableOpacity>
      </View>

      <WelcomeModal
        visible={welcomeModalVisible}
        onClose={() => setWelcomeModalVisible(false)}
      />

      {menuVisible && (
        <DropdownMenu
          onFlag={handleFlag}
          onBlock={handleBlock}
          onMute={handleMute}
          onClose={handleCloseMenu}
          onDelete={handleDeletePost}
          isOwnPost={isOwn}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    marginHorizontal: 4,
    marginBottom: 2,
    marginTop: 4,
    backgroundColor: themeVariables.greyColor,
    borderRadius: themeVariables.borderRadiusPill,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    position: 'relative',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    // Top align name and community chip
    alignItems: 'flex-start',
  },
  // Wrapper for name and community chip stacked vertically
  userInfoText: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  // Row container for username and time separator
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotSeparator: {
    marginHorizontal: 4,
    color: themeVariables.greyTextColor || '#666',
  },
  timeAgo: {
    fontSize: 14,
    color: themeVariables.greyTextColor || '#666',
    marginBottom: 4,
  },
  profilePic: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 10,
    backgroundColor: 'grey',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    marginTop: -2,
    width: Platform.select({ android: 125 }),
  },
  communityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityChip: {
    backgroundColor: '#312783',
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 14,
    flexShrink: 0,
    width: Platform.select({ android: 85 }),
    marginRight: 6,
    marginBottom: 4,
  },
  communityText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    flexShrink: 0,
  },
  avatarTouchable: {
    marginRight: 10,
  },
  infoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flexShrink: 1,
  },
  chipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Tag chips scrollable container
  tagScrollContainer: {
    maxWidth: '100%',
    marginTop: 0,
    marginBottom: 4,
    overflow: 'hidden',
  },
  tagChipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagChip: {
    backgroundColor: themeVariables.secondaryColor,
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 14,
    flexShrink: 0,
    marginRight: 8,
  },
  tagText: {
    fontSize: 14,
    color: themeVariables.blackColor,
    textAlign: 'center',
    flexShrink: 0,
  },
  kebabContainer: {
    marginLeft: 'auto',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: 350,
    borderRadius: 10,
  },
  mediaContainer: {
    position: 'relative',
    width: '100%',
    height: 350,
    borderRadius: 10,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  fullscreenMedia: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'stretch',
    width: '100%',
  },
  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  descriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  postContent: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 20,
  },
  seeMoreRightContainer: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  seeMoreText: {
    color: '#fff',
    textDecorationLine: 'underline',
    fontSize: 14,
    width: Platform.select({ android: 75 }),
  },
  postFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 5,
    marginTop: 5,
    // If you want spacing between buttons:
    justifyContent: 'flex-start',
  },
  postFooterIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: 4,
  },
  footerIconText: {
    color: '#312783',
    fontSize: 16,
    marginLeft: 5,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 2,
  },
  dropdownItem: {
    paddingVertical: 8,
  },
  menuItem: {
    fontSize: 16,
    color: '#333',
  },
  // Custom close button for lightbox
  lightboxCloseButton: {
    position: 'absolute',
    // Positioned lower and towards right to sit just above the image
    top: 60,
    right: 10,
    zIndex: 2,
  },
  lightboxCloseText: {
    fontSize: 35,
    color: '#fff',
    lineHeight: 40,
    width: 40,
    textAlign: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});

// Memoize to avoid unnecessary re-renders when parent list updates
export default memo(Post);
