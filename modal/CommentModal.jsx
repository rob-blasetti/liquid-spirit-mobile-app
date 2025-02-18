import React from 'react';
import { 
  Modal, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  TextInput, 
  Button 
} from 'react-native';

const CommentModal = ({
  visible,
  onClose,
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
      {/* Press outside the modal container to close */}
      <TouchableOpacity 
        style={styles.modalBackground}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Prevent clicks on the modal container from closing it immediately */}
        <TouchableOpacity activeOpacity={1} style={styles.modalContainer}>
          <Text style={styles.title}>Add a Comment</Text>
          
          <TextInput
            style={styles.textInput}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Write your comment..."
            multiline
          />
          
          <View style={styles.buttonRow}>
            <Button title="Submit" onPress={onSubmit} />
            <Button title="Cancel" onPress={onClose} color="red" />
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
    backgroundColor: 'rgba(0,0,0,0.5)', // Slight background dimming
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  textInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 16,
    textAlignVertical: 'top',
    minHeight: 60, // ensures a bit of space for multiline input
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
