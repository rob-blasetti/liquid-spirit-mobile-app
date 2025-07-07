import React, { useState, useContext } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import Video from 'react-native-video';
import * as Progress from 'react-native-progress';
import { launchImageLibrary } from 'react-native-image-picker';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes, faImages } from '@fortawesome/free-solid-svg-icons';
import themeVariables from '../styles/theme';
import { UserContext } from '../contexts/UserContext';
import { createPost, uploadImageWithThumbnail, uploadVideoWithThumbnail } from '../services/PostService';

const PostModal = ({ visible = true, onPostCreated, onClose }) => {
  const [content, setContent] = useState('');
  const [mediaUri, setMediaUri] = useState(null);
  const [mediaType, setMediaType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState('');
  const { communityId, token, user } = useContext(UserContext);

  // Close handler: use onClose prop if provided, otherwise navigate back
  const navigation = useNavigation();
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigation.goBack();
    }
  };

  const openLibrary = async () => {
      const options = { mediaType: 'mixed', quality: 0.7 };
      launchImageLibrary(options, (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Library Error', response.errorMessage || 'Unknown error');
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setMediaUri(asset.uri);
          setMediaType(asset.type);
        }
      });
    };
  
    const handlePost = async () => {
      if (!content || !communityId) {
        Alert.alert('Missing Fields', 'Please write something.');
        return;
      }
  
      let mediaResult = null;
  
      try {
        setIsUploading(true);
        setUploadStep('Uploading media...');
        setUploadProgress(30);
  
        if (mediaUri) {
          if (mediaType.includes('image')) {
            mediaResult = await uploadImageWithThumbnail(mediaUri, mediaType, token);
          } else if (mediaType.includes('video')) {
            mediaResult = await uploadVideoWithThumbnail(mediaUri, mediaType, token);
          }
        }
  
        setUploadStep('Creating post...');
        setUploadProgress(70);
  
        await createPost({
          title: '',
          content,
          mediaUrl: mediaResult ? mediaResult.originalUrl : null,
          mediaThumbnailUrl: mediaResult ? mediaResult.thumbnailUrl : null,
          user: { id: user.id },
          userCommunityId: communityId,
          token,
        });
  
        setUploadProgress(100);
        setIsUploading(false);
        setUploadStep('');
        Alert.alert('Success', 'Your post has been created!');
        setContent('');
        setMediaUri(null);
        setMediaType(null);
        if (onPostCreated) {
          onPostCreated();
        }
        handleClose();
      } catch (err) {
        console.error('Post error:', err);
        setIsUploading(false);
        setUploadStep('');
        Alert.alert('Error', err.message);
      }
    };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <KeyboardAvoidingView
              style={styles.modalContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <View style={styles.headerRow}>
                <Text style={styles.header}>Create a post</Text>
                <TouchableOpacity style={styles.closeIcon} onPress={handleClose}>
                  <FontAwesomeIcon
                    icon={faTimes}
                    size={24}
                    color={themeVariables.primaryColor}
                  />
                </TouchableOpacity>
              </View>

            <ScrollView contentContainerStyle={styles.content}>
              <TouchableOpacity style={styles.uploadButton} onPress={openLibrary}>
                <FontAwesomeIcon
                  icon={faImages}
                  size={40}
                  color={themeVariables.primaryColor}
                />
                <Text style={styles.uploadButtonText}>
                  Upload image or video
                </Text>
              </TouchableOpacity>

              <Text style={styles.label}>Content</Text>
              <TextInput
                style={styles.textArea}
                placeholder="What's on your mind?"
                placeholderTextColor="#999"
                value={content}
                onChangeText={setContent}
                multiline
              />

              {mediaUri && mediaType.includes('image') && (
                <Image
                  testID="imagePreview"
                  source={{ uri: mediaUri }}
                  style={styles.mediaPreview}
                />
              )}

              {mediaUri && mediaType.includes('video') && (
                <Video
                  testID="videoPreview"
                  source={{ uri: mediaUri }}
                  style={styles.video}
                  controls
                  resizeMode="contain"
                  paused={false}
                  repeat
                />
              )}

              {isUploading && (
                <View style={styles.uploadContainer}>
                  <Progress.Bar
                    progress={uploadProgress / 100}
                    width={250}
                    color={themeVariables.primaryColor}
                    borderRadius={10}
                  />
                  <Text style={styles.uploadText}>{uploadStep}</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handlePost}
                disabled={isUploading || (!content && !mediaUri)}
              >
                <Text style={styles.submitButtonText}>
                  {isUploading ? 'Posting...' : 'Create post'}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '100%',
    backgroundColor: themeVariables.whiteColor,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  content: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 18,
    fontWeight: '700',
    color: themeVariables.primaryColor,
    textAlign: 'center',
  },
  headerRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  closeIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
  },
  textArea: {
    width: '100%',
    backgroundColor: themeVariables.lightGreyColor,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  label: {
    alignSelf: 'flex-start',
    color: themeVariables.blackColor,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  uploadButton: {
    width: '100%',
    borderWidth: 1,
    borderColor: themeVariables.primaryColor,
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: themeVariables.whiteColor,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  uploadButtonText: {
    color: themeVariables.primaryColor,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  uploadContainer: {
    marginBottom: 10,
    alignItems: 'center',
  },
  uploadText: {
    color: themeVariables.primaryColor,
    marginTop: 5,
  },
  mediaPreview: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginBottom: 20,
  },
  video: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginBottom: 20,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  submitButton: {
    backgroundColor: themeVariables.primaryColor,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    width: '100%',
  },
  submitButtonText: {
    color: themeVariables.whiteColor,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default PostModal;
