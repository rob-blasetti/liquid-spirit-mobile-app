import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import themeVariables from '../../../../styles/theme';
import { timeSince } from '../../../../utils/timeSince';
import sectionBaseStyles from '../../common/sectionBaseStyles';

const CommentsSection = ({
  showCommentBox,
  commentBoxContainerStyle,
  commentInputRef,
  comment,
  setComment,
  onSubmitComment,
  comments = [],
}) => {
  const navigation = useNavigation();
  const [showAll, setShowAll] = useState(false);
  const sorted = Array.isArray(comments)
    ? [...comments].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    : [];
  const visible = showAll ? sorted : sorted.slice(0, 2);

  return (
    <View style={[styles.container, commentBoxContainerStyle]}>
      <View style={styles.divider} />
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Comments</Text>
        {sorted.length > 2 && (
          <TouchableOpacity onPress={() => setShowAll(prev => !prev)}>
            <Text style={styles.seeMoreText}>{showAll ? 'See less' : 'See more'}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={[styles.commentsList, { marginTop: 4 }]}>
        {visible.length > 0 ? (
          visible.map((c, idx) => {
            const user = c.user || {};
            const author =
              user.fullName ||
              user.name ||
              [user.firstName, user.lastName].filter(Boolean).join(' ') ||
              user.email ||
              'Someone';
            const commentText = c.comment || c.content || c.text || '';
            const avatar =
              user.profilePicture ||
              user.avatar ||
              user.photo ||
              user.image ||
              null;
            const userId = user._id || user.id;
            const onPressProfile = () => {
              if (userId) {
                navigation.navigate('PublicUserProfile', { userId });
              }
            };
            return (
              <View key={c._id || idx} style={styles.commentItem}>
                <TouchableOpacity style={styles.commentRow} activeOpacity={0.8} onPress={onPressProfile}>
                  {avatar ? (
                    <FastImage source={{ uri: avatar }} style={styles.commentAvatar} resizeMode={FastImage.resizeMode.cover} />
                  ) : (
                    <View style={[styles.commentAvatar, { backgroundColor: '#ddd' }]} />
                  )}
                  <View style={styles.commentTextContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.commentAuthor}>{author}</Text>
                      <Text style={styles.commentTimestamp}>{timeSince(c.createdAt)}</Text>
                    </View>
                    <Text style={styles.commentContent}>{commentText}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <Text style={styles.noCommentsText}>No comments yet.</Text>
        )}
      </View>

      {showCommentBox && (
        <>
          <View style={[styles.commentRow, { marginBottom: 4 }]}>
            <TextInput
              ref={commentInputRef}
              style={[styles.commentInput, { width: '100%' }]}
              placeholder="Write a comment..."
              placeholderTextColor="#999"
              value={comment}
              onChangeText={setComment}
              multiline
            />
          </View>
          <View style={{ alignItems: 'flex-end', marginBottom: 4 }}>
            <TouchableOpacity
              style={styles.sendButton}
              onPress={onSubmitComment}
            >
              <Text style={styles.sendButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    backgroundColor: themeVariables.whiteColor,
    borderRadius: 8,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  divider: {
    ...sectionBaseStyles.sectionDivider,
    marginBottom: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: {
    ...sectionBaseStyles.sectionTitle,
    marginTop: 0,
    marginBottom: 8,
  },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4, gap: 8 },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    minHeight: 48,
    flex: 1,
  },
  sendButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: themeVariables.primaryColor,
    borderRadius: 24,
    alignSelf: 'flex-end',
    justifyContent: 'center',
  },
  sendButtonText: { color: themeVariables.whiteColor, fontWeight: '700' },
  commentsList: { marginTop: 4 },
  commentItem: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#ddd', paddingBottom: 8 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: themeVariables.greyColor },
  commentTextContainer: { flex: 1 },
  commentAuthor: { fontWeight: '600', marginBottom: 4 },
  commentContent: { fontSize: 14, color: '#333' },
  commentTimestamp: { fontSize: 12, color: '#888', marginLeft: 8 },
  seeMoreText: { color: themeVariables.primaryColor, fontWeight: '600', textDecorationLine: 'underline' },
  noCommentsText: { color: '#888', marginBottom: 12, fontStyle: 'italic' },
});

export default CommentsSection;
