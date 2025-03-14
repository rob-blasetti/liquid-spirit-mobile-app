import React, { useState, useRef, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import Video from 'react-native-video';
import {
  faEllipsisV,
  faHeart as solidHeart
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as regularHeart, faComment } from '@fortawesome/free-regular-svg-icons';
import { UserContext } from '../contexts/UserContext';
import WelcomeModal from '../modal/WelcomeModal';
import DropdownMenu from './DropdownMenu';

const DOUBLE_TAP_DELAY = 300;

const Post = ({ post, onLike, onComment, onFlag, onBlock, onMute, onDelete, setScrollEnabled }) => {
  const { token, user } = useContext(UserContext);
  const [isLiked, setIsLiked] = useState(!!post?.isLiked);
  const [localLikeCount, setLocalLikeCount] = useState(post.likes?.length || 0);
  console.log(post)

  useEffect(() => {
    if (post.isLiked !== isLiked) {
      setIsLiked(post.isLiked);
    }
    setLocalLikeCount(post.likes?.length || 0);
  }, [post.isLiked, post.likes]);
  
  const [expanded, setExpanded] = useState(false);

  const authorName = `${post.author?.firstName || 'Unknown'} ${post.author?.lastName || 'Author'}`;
  const authorCommunity = post.community?.name || 'Unknown';
  const profilePic = post.author?.profilePicture?.trim()
    ? post.author.profilePicture.trim()
    : 'https://via.placeholder.com/50';
  const mediaUrl = post.media?.[0] || 'https://via.placeholder.com/200';

  const isVideo = mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm') || mediaUrl.endsWith('.mov');
  const userId = user?.id || user?._id;
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

  const toggleLike = async () => {
    try {
      const newIsLiked = await onLike(post._id);
  
      if (newIsLiked !== null) {
        setIsLiked(newIsLiked);
        setLocalLikeCount((count) => newIsLiked ? count + 1 : Math.max(0, count - 1));
      }
    } catch (error) {
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
    textAlign: 'center'
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
