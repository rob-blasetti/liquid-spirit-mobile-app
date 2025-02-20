import React, { useState, useRef, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faEllipsisV,
  faFlag,
  faVolumeMute,
  faBan,
  faHeart as solidHeart
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as regularHeart, faComment } from '@fortawesome/free-regular-svg-icons';
import { UserContext } from '../contexts/UserContext';
import WelcomeModal from '../modal/WelcomeModal';

const DOUBLE_TAP_DELAY = 300; // ms between taps for a double-tap

/**
 * This component enforces the following behavior:
 * 1. If the post is not currently liked (isLiked = false), a double-tap anywhere on the post will like it.
 * 2. If the post is liked, another double-tap does nothing (i.e., you cannot re-like it a second time).
 * 3. The heart icon toggles between like and unlike.
 *    - If isLiked = false, tapping the heart increments the count and sets isLiked = true.
 *    - If isLiked = true, tapping the heart decrements the count and sets isLiked = false.
 */

const Post = ({ post, onLike, onComment, onFlag, onBlock, onMute }) => {
  const { token } = useContext(UserContext);

  // We'll assume there's a boolean "post.isLiked" from the server.
  // We'll also track the local like count so we can update immediately.

  const [isLiked, setIsLiked] = useState(!!post?.isLiked);
  const [localLikeCount, setLocalLikeCount] = useState(post.likes?.length || 0);

  // Whenever "post" changes, sync our local states.
  useEffect(() => {
    if (post.isLiked !== isLiked) {
      setIsLiked(post.isLiked);
    }
    setLocalLikeCount(post.likes?.length || 0);
  }, [post.isLiked, post.likes]);
  
  // Expand/collapse content.
  const [expanded, setExpanded] = useState(false);

  const authorName = `${post.author?.firstName || 'Unknown'} ${post.author?.lastName || 'Author'}`;
  const authorCommunity = post.community?.name || 'Unknown';
  const profilePic = post.author?.profilePicture?.trim()
    ? post.author.profilePicture.trim()
    : 'https://via.placeholder.com/50';
  const mediaUrl = post.media?.[0] || 'https://via.placeholder.com/200';
  const commentCount = post.comments?.length || 0;

  const toggleLike = async () => {
    try {
      const newIsLiked = await onLike(post._id); // Get latest like state from the server
  
      if (newIsLiked !== null) {
        setIsLiked(newIsLiked);
        setLocalLikeCount((count) => newIsLiked ? count + 1 : Math.max(0, count - 1));
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };  

  // Double-tap logic.
  const lastTapRef = useRef(0);
  const handlePostPress = () => {
    const now = Date.now();
    // If user double-taps quickly, we only like if it's currently unliked.
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY && !isLiked) {
      toggleLike();
    }
    lastTapRef.current = now;
  };

  // Dropdown menu states and ref.
  const kebabRef = useRef(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [welcomeModalVisible, setWelcomeModalVisible] = useState(false);

  const handleToggleMenu = () => {
    if (!token) {
      setWelcomeModalVisible(true);
      return;
    }

    if (menuVisible) {
      setMenuVisible(false);
      return;
    }
    kebabRef.current?.measure((fx, fy, width, height, px, py) => {
      const menuWidth = 140;
      const menuHeight = 100;

      let top = fy + height;
      let left = fx;

      const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

      if (top + menuHeight > screenHeight) {
        top = fy - menuHeight;
      }
      if (left + menuWidth > screenWidth) {
        left = screenWidth - menuWidth - 8;
      }
      if (left < 0) {
        left = 8;
      }

      setMenuPosition({ top, left });
      setMenuVisible(true);
    });
  };

  return (
    <TouchableOpacity
      style={styles.postContainer}
      activeOpacity={1}
      onPress={handlePostPress}
    >
      {/* User and Community Info */}
      <View style={styles.userInfoContainer}>
        <View style={styles.userInfo}>
          <FastImage
            source={{ uri: profilePic }}
            style={styles.profilePic}
            resizeMode={FastImage.resizeMode.cover}
            onError={(e) => console.error('Profile picture failed to load:', e.nativeEvent.error)}
          />
          <Text style={styles.username}>{authorName}</Text>
        </View>
        <View style={styles.communityContainer}>
          <View style={styles.communityChip}>
            <Text style={styles.communityText}>{authorCommunity}</Text>
          </View>
          <View ref={kebabRef} collapsable={false}>
            <TouchableOpacity onPress={handleToggleMenu}>
              <FontAwesomeIcon icon={faEllipsisV} size={20} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Image */}
      <View style={styles.imageContainer}>
        <FastImage
          source={{ uri: mediaUrl }}
          style={styles.postImage}
          resizeMode={FastImage.resizeMode.cover}
          onError={(e) => console.error('Post image failed to load:', e.nativeEvent.error)}
        />
        {/* Overlayed Title & Description */}
        <View style={styles.overlayContainer}>
          <Text style={styles.postTitle}>{post.title}</Text>
          {expanded ? (
            // Expanded mode: multiline description + See Less on the right
            <View>
              <Text style={styles.postContent}>{post.content}</Text>
              <TouchableOpacity style={styles.seeMoreRightContainer} onPress={() => setExpanded(false)}>
                <Text style={styles.seeMoreText}>See Less</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Collapsed mode: single-line description + See More on the right in the same row
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

      {/* Footer Icons */}
      <View style={styles.postFooter}>
        {/* Heart toggles like/unlike every time it is pressed */}
        <TouchableOpacity style={styles.postFooterIcon} onPress={toggleLike}>
          <Text style={styles.footerIconText}>
            <FontAwesomeIcon
              icon={isLiked ? solidHeart : regularHeart}
              size={18}
              color="#312783"
            />{' '}
            {localLikeCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postFooterIcon} onPress={() => onComment(post._id)}>
          <Text style={styles.footerIconText}>
            <FontAwesomeIcon icon={faComment} size={18} color="#312783" /> {commentCount}
          </Text>
        </TouchableOpacity>
      </View>

      <WelcomeModal
        visible={welcomeModalVisible}
        onClose={() => setWelcomeModalVisible(false)}
      />

      {menuVisible && (
        <>
          {/* Overlay to capture touches outside the dropdown */}
          <TouchableOpacity
            style={styles.dropdownOverlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />
          <View style={[styles.dropdownMenu, { top: menuPosition.top, left: menuPosition.left }]}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                onFlag(post._id);
                setMenuVisible(false);
              }}
            >
              <Text style={styles.menuItem}>
                <FontAwesomeIcon icon={faFlag} size={16} color="#312783" /> Report Post
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                onBlock(post.author?._id);
                setMenuVisible(false);
              }}
            >
              <Text style={styles.menuItem}>
                <FontAwesomeIcon icon={faBan} size={16} color="#312783" /> Block User
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                onMute(post.author?._id);
                setMenuVisible(false);
              }}
            >
              <Text style={styles.menuItem}>
                <FontAwesomeIcon icon={faVolumeMute} size={16} color="#312783" /> Mute User
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
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
  },
  communityText: {
    fontSize: 14,
    color: '#fff',
  },
  imageContainer: {
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: 350,
    borderRadius: 10,
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
  postTitle: {
    fontSize: 18,
    fontWeight: '700',
    textDecorationLine: 'underline',
    color: '#fff',
    marginBottom: 4,
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
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginTop: 10,
  },
  postFooterIcon: {
    paddingLeft: 15,
    marginRight: 10,
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
