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

  return (
    <TouchableOpacity
      style={styles.postContainer}
      activeOpacity={1}
      onPress={handlePostPress}
    >
      <View style={styles.userInfoContainer}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => navigation.navigate('PublicUserProfile', { userId: post.author?._id })}
        >
          <FastImage
            source={{ uri: profilePic }}
            style={styles.profilePic}
            resizeMode={FastImage.resizeMode.cover}
            onError={(e) => console.error('Profile picture failed to load:', e.nativeEvent.error)}
          />
          <Text style={styles.username}>{authorName}</Text>
        </TouchableOpacity>
        <View style={styles.communityContainer}>
          <View style={styles.communityChip}>
            <Text style={styles.communityText}>{authorCommunity}</Text>
          </View>
          <View ref={kebabRef} collapsable={false}>
            <TouchableOpacity onPress={handleToggleMenu}>
              <Ionicons name={ellipsisIcon} size={20} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Image */}
      <View style={styles.mediaContainer}>
        {isVideo ? (
          <Video
            source={{ uri: mediaUrl }}
            style={styles.video}
            controls
            resizeMode="contain"
            paused
          />
        ) : (
          <FastImage source={{ uri: mediaUrl }} style={styles.postImage} resizeMode={FastImage.resizeMode.cover} />
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
        <TouchableOpacity style={styles.postFooterIcon} onPress={debouncedToggleLike}>
            <Ionicons
              name={isLiked ? solidHeart : heartOutline}
              size={22}
              color="#312783"
            />
            <Text style={styles.footerIconText}></Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postFooterIcon} onPress={() => onComment(post._id)}>
          <Ionicons name="chatbubble-outline" size={22} color="#312783" />
          <Text style={styles.footerIconText}>{commentCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          // Push share icon to the right
          style={[styles.postFooterIcon, { marginLeft: 'auto' }]}
          onPress={() => handleSharePost(post._id)}
        >
          <Ionicons name={shareIcon} size={22} color="#312783" />
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
    marginHorizontal: 16,
    marginBottom: 16,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
    width: Platform.select({ android: 125 })
  },
  communityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityChip: {
    backgroundColor: '#312783',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginRight: 8,
    flexShrink: 0,
    width: Platform.select({ android: 85 })
  },
  communityText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    flexShrink: 0,
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
    paddingTop: 10,
    marginTop: 10,
    // If you want spacing between buttons:
    justifyContent: 'flex-start',
  },
  postFooterIcon: {
    flexDirection: 'row', 
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 10, 
    paddingHorizontal: 8,
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
});

export default Post;
