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
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import FastImage from 'react-native-fast-image';

const CommentModal = ({
  visible,
  onClose,
  comments = [],
  commentText,
  setCommentText,
  onSubmit,
}) => {
  const handleSubmit = () => {
    if (commentText.trim() === '') return;
    onSubmit();
    setCommentText('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      {/* Capture taps outside modalContainer to close */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalBackground}>
          {/* Prevent taps inside modalContainer from closing */}
          <TouchableWithoutFeedback onPress={() => {}}>
            <KeyboardAvoidingView
              style={styles.modalContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <Text style={styles.title}>Comments</Text>
              <ScrollView style={styles.commentsList}>
                {comments.length === 0 && (
                  <Text style={styles.noCommentsText}>No comments yet</Text>
                )}
                {comments.map((comment) => (
                  <View key={comment._id} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <FastImage
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

              <TextInput
                style={styles.textInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Write your comment..."
                multiline
              />

              <View style={styles.buttonRow}>
                <Pressable style={styles.submitButton} onPress={handleSubmit}>
                  <Text style={styles.submitButtonText}>Submit</Text>
                </Pressable>
                <Pressable style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
    backgroundColor: '#fff',
    padding: 20,
    // Extra bottom padding for comfortable spacing inside container
    paddingBottom: 40,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  commentsList: {
    flexGrow: 0,
    maxHeight: 250,
    marginBottom: 12,
  },
  noCommentsText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 10,
  },
  commentItem: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
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
    marginBottom: 4,
  },
  commentAuthor: {
    fontWeight: '600',
    width: Platform.select({ android: 100 })
  },
  commentDate: {
    color: '#666',
    fontSize: 12,
    width: Platform.select({ android: 100 })

  },
  commentContent: {
    fontSize: 14,
  },
  textInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
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
    width: Platform.select({ android: 100 })
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
    width: Platform.select({ android: 100 })
  },
  cancelButtonText: {
    color: '#312783',
    fontSize: 16,
    fontWeight: '600',
  },
});
