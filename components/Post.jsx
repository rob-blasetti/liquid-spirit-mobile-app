import React, { useState, useRef, useContext, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import themeVariables from '../styles/theme';
import FastImage from 'react-native-fast-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import Lightbox from 'react-native-lightbox';
const solidHeart = 'heart';
const heartOutline = 'heart-outline';
const ellipsisIcon = 'ellipsis-vertical';
const shareIcon = 'share-outline';
import { UserContext } from '../contexts/UserContext';
import WelcomeModal from '../modal/WelcomeModal';
import DropdownMenu from './DropdownMenu';
import debounce from 'lodash.debounce';

const DOUBLE_TAP_DELAY = 300;

const Post = ({ post, onLike, onComment, onFlag, onBlock, onMute, onDelete, setScrollEnabled }) => {
  const { token, user } = useContext(UserContext);
  const navigation = useNavigation();

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

  const debouncedToggleLike = useCallback(
    debounce(() => {
      toggleLike();
    }, 300),
    [toggleLike]
  );
  
  const [expanded, setExpanded] = useState(false);

  const authorName = `${post.author?.firstName || 'Unknown'} ${post.author?.lastName || 'Author'}`;
  const authorCommunity = post.community?.name || 'Unknown';
  const profilePic = post.author?.profilePicture?.trim()
    ? post.author.profilePicture.trim()
    : 'https://via.placeholder.com/50';
  const mediaUrl = post.media?.[0] || 'https://via.placeholder.com/200';

  const isVideo = mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm') || mediaUrl.endsWith('.mov');
  const userId = user?.id || user?._id;
  // initial liked state based on post.likes
  const [isLiked, setIsLiked] = useState(() => hasUserLiked(post.likes, userId));
  const commentCount = post.comments?.length || 0;
  const isOwn = post.author._id == userId;

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

  const handleSharePost = async (id) => {
    const url = `https://www.liquidspirit.org/posts/${id}`;
    const message = `Check out this post on Liquid Spirit 👇\n${url}`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
  
    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
  
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        // WhatsApp not installed - fallback to native share
        await Share.share({
          message,
          url,
          title: 'Liquid Spirit Post',
        });
      }
    } catch (err) {
      console.error('Error sharing:', err);
      Alert.alert('Sharing Error', 'Something went wrong while trying to share the post.');
    }
  };  

  const toggleLike = async () => {
    const previousLiked = isLiked;
    setIsLiked(!previousLiked);
  
    try {
      await onLike(post._id, userId);
    } catch (error) {
      setIsLiked(previousLiked);
      console.error('Error updating like:', error);
    }
  };

  const lastTapRef = useRef(0);
  const handlePostPress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY && !isLiked) {
      toggleLike();
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
            <TouchableOpacity
              style={styles.communityChip}
              onPress={() => navigation.navigate('Search', { initialQuery: authorCommunity })}
            >
              <Text style={styles.communityText}>{authorCommunity}</Text>
            </TouchableOpacity>
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
        <Lightbox
          underlayColor="transparent"
          springConfig={{ tension: 30, friction: 20 }}
          renderHeader={close => (
            <TouchableOpacity onPress={close} style={styles.lightboxCloseButton}>
              <Text style={styles.lightboxCloseText}>×</Text>
            </TouchableOpacity>
          )}
          renderContent={() =>
            isVideo ? (
              <Video
                source={{ uri: mediaUrl }}
                style={styles.fullscreenMedia}
                controls
                resizeMode="contain"
              />
            ) : (
              <FastImage
                source={{
                  uri: mediaUrl,
                  priority: FastImage.priority.normal,
                  cache: FastImage.cacheControl.immutable,
                }}
                style={styles.fullscreenMedia}
                resizeMode={FastImage.resizeMode.contain}
              />
            )
          }
        >
          {isVideo ? (
            <Video
              source={{ uri: mediaUrl }}
              style={styles.video}
              controls
              resizeMode="contain"
              paused
            />
          ) : (
            <FastImage
              source={{
                uri: mediaUrl,
                priority: FastImage.priority.normal,
                cache: FastImage.cacheControl.immutable,
              }}
              style={styles.postImage}
              resizeMode={FastImage.resizeMode.cover}
            />
          )}
        </Lightbox>
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
        <TouchableOpacity style={styles.postFooterIcon} onPress={debouncedToggleLike}>
            <Ionicons
              name={isLiked ? solidHeart : heartOutline}
              size={24}
              color="#312783"
            />
            <Text style={styles.footerIconText}></Text>
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
    width: Platform.select({ android: 125 })
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
    marginTop: 4,
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
  postImage: {
    width: '100%',
    height: '100%',
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
});

export default Post;
