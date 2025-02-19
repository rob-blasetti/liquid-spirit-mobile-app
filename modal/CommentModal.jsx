import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  ScrollView,
  Image,
  Pressable
} from 'react-native';

const CommentModal = ({
  visible,
  onClose,
  comments = [], // array of existing comments
  commentText,
  setCommentText,
  onSubmit
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalBackground}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
        >
          {/* Existing Comments */}
          <Text style={styles.title}>Comments</Text>
          <ScrollView style={styles.commentsList}>
            {comments.length === 0 && (
              <Text style={styles.noCommentsText}>No comments yet</Text>
            )}
            {comments.map((comment) => (
              <View key={comment._id} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <Image
                    source={{ uri: comment.user.profilePicture }}
                    style={styles.profilePic}
                  />
                  <View style={styles.commentTextContainer}>
                    <View style={styles.commentTopRow}>
                      <Text style={styles.commentAuthor}>
                        {comment.user.firstName} {comment.user.lastName}
                      </Text>
                      <Text style={styles.commentDate}>
                        {new Date(comment.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </Text>
                    </View>
                    <Text style={styles.commentContent}>{comment.comment}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Create New Comment */}
          <TextInput
            style={styles.textInput}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Write your comment..."
            multiline
          />

          <View style={styles.buttonRow}>
            <Pressable style={styles.submitButton} onPress={onSubmit}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default CommentModal;

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  commentsList: {
    maxHeight: 200,
    marginBottom: 12,
  },
  noCommentsText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 10,
  },
  commentItem: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  commentTextContainer: {
    flex: 1,
  },
  commentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontWeight: '600',
  },
  commentDate: {
    fontSize: 12,
    color: '#666',
  },
  commentContent: {
    fontSize: 14,
    color: '#333',
  },
  textInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 16,
    textAlignVertical: 'top',
    minHeight: 60,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitButton: {
    backgroundColor: '#312783',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderColor: '#312783',
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'white',
  },
  cancelButtonText: {
    color: '#312783',
    fontSize: 16,
    fontWeight: '600',
  },
});