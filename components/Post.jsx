import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions 
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEllipsisV, faFlag, faVolumeMute, faBan } from '@fortawesome/free-solid-svg-icons';

const DOUBLE_TAP_DELAY = 300; // ms between taps for a double-tap

const Post = ({ post, onLike, onComment, onFlag, onBlock, onMute }) => {  
  const authorName = `${post.author?.firstName || 'Unknown'} ${post.author?.lastName || 'Author'}`;
  const authorCommunity = post.community?.name || 'Unknown';
  const profilePic = post.author?.profilePicture || 'https://via.placeholder.com/50';
  const mediaUrl = post.media?.[0] || 'https://via.placeholder.com/200';
  const likeCount = post.likes?.length || 0;
  const commentCount = post.comments?.length || 0;

  const lastTapRef = useRef(0);
  const handlePostPress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      onLike(post._id);
    }
    lastTapRef.current = now;
  };

  const [showComments, setShowComments] = useState(false);
  const toggleComments = () => setShowComments((prev) => !prev);

  // Dropdown menu states and ref
  const kebabRef = useRef(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const handleToggleMenu = () => {
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

      <FastImage 
        source={{ uri: mediaUrl }} 
        style={styles.postImage} 
        resizeMode={FastImage.resizeMode.cover} 
        onError={(e) => console.error('Post image failed to load:', e.nativeEvent.error)}
      />
      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postContent}>{post.content}</Text>

      <View style={styles.postFooter}>
        <TouchableOpacity onPress={() => onLike(post._id)}>
          <Text style={styles.footerText}>💙 {likeCount} Likes</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onComment(post._id)}>
          <Text style={styles.footerText}>💬 {commentCount} Comments</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleComments}>
          <Text style={styles.footerText}>
            {showComments ? 'Hide Comments' : 'Show All Comments'}
          </Text>
        </TouchableOpacity>
      </View>

      {showComments && (
        <View style={styles.commentsContainer}>
          {post.comments?.map((comment) => (
            <View style={styles.commentItem} key={comment._id}>
              <Text style={styles.commentAuthor}>
                {comment.user?.firstName || 'Unknown'} {comment.user?.lastName || ''}
              </Text>
              <Text style={styles.commentText}>{comment.comment}</Text>
            </View>
          ))}
        </View>
      )}

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
              onPress={() => { onFlag(post._id); setMenuVisible(false); }}
            >
              <Text style={styles.menuItem}>
                <FontAwesomeIcon icon={faFlag} size={16} color="#d9534f" /> Report Post
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.dropdownItem} 
              onPress={() => { onBlock(post.author?._id); setMenuVisible(false); }}
            >
              <Text style={styles.menuItem}>
                <FontAwesomeIcon icon={faBan} size={16} color="#d9534f" /> Block User
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.dropdownItem} 
              onPress={() => { onMute(post.author?._id); setMenuVisible(false); }}
            >
              <Text style={styles.menuItem}>
                <FontAwesomeIcon icon={faVolumeMute} size={16} color="#d9534f" /> Mute User
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
    postImage: {
      width: '100%',
      height: 250,
      borderRadius: 10,
      marginBottom: 10,
    },
    postTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#222',
      marginBottom: 4,
    },
    postContent: {
      fontSize: 15,
      color: '#555',
      lineHeight: 20,
      marginBottom: 10,
    },
    postFooter: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      borderTopWidth: 1,
      borderTopColor: '#eee',
      paddingTop: 10,
    },
    footerText: {
      fontSize: 14,
      color: '#007BFF',
    },
    commentsContainer: {
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#eee',
      paddingTop: 10,
    },
    commentItem: {
      marginBottom: 10,
    },
    commentAuthor: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
    },
    commentText: {
      fontSize: 14,
      color: '#555',
      marginLeft: 10,
    },
    // Dropdown overlay + menu remain the same
    dropdownOverlay: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
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
