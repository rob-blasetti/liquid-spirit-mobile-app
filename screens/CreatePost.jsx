import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faImage, faImages } from '@fortawesome/free-regular-svg-icons';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import * as Progress from 'react-native-progress';
import Video from 'react-native-video';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { UserContext } from '../contexts/UserContext';
import { TouchableWithoutFeedback } from 'react-native';
import { createPost, uploadImageWithThumbnail, uploadVideoWithThumbnail } from '../services/PostService';
import themeVariables from '../styles/theme';

export default function CreatePost({ onPostCreated, onClose }) {
  const [content, setContent] = useState('');
  const [mediaUri, setMediaUri] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState('');
  const { communityId, token, user } = useContext(UserContext);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigation = useNavigation();
  const handleClose = onClose ? onClose : () => navigation.goBack();


  const openCamera = async () => {
    const options = { mediaType: 'mixed', quality: 0.7 };
    launchCamera(options, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Camera Error', response.errorMessage || 'Unknown error');
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setMediaUri(asset.uri);
        setMediaType(asset.type);
      }
    });
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
    } catch (err) {
      console.error('Post error:', err);
      setIsUploading(false);
      setUploadStep('');
      Alert.alert('Error', err.message);
    }
  };

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerRow}>
                <Text style={styles.header}>Create a post</Text>
                <TouchableOpacity style={styles.closeIcon} onPress={handleClose}>
                  <FontAwesomeIcon icon={faTimes} size={24} color="#312783" />
                </TouchableOpacity>
              </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>

          <TouchableOpacity style={styles.uploadButton} onPress={openLibrary}>
            <FontAwesomeIcon icon={faImages} size={40} color="#312783" />
            <Text style={styles.uploadButtonText}>Upload image or video</Text>
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
            <View style={{ marginBottom: 10, alignItems: 'center' }}>
              <Progress.Bar
                progress={uploadProgress / 100}
                width={250}
                color="#312783"
                borderRadius={10}
              />
              <Text style={{ color: '#312783', marginTop: 5 }}>{uploadStep}</Text>
            </View>
          )}

            </ScrollView>
            <View style={styles.footer}>
              <TouchableOpacity style={styles.submitButton} onPress={handlePost} disabled={isUploading}>
                <Text style={styles.submitButtonText}>{isUploading ? 'Posting...' : 'Create post'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f3f3',
    marginTop: 10,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
    alignItems: 'center',
  },
  header: {
    fontSize: 18,
    fontWeight: '700',
    color: '#312783',
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
    top: -6,
    right: 15,
    padding: 8,
  },
  textArea: {
    width: '100%',
    backgroundColor: '#fff',
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
    borderColor: '#312783',
    borderStyle: 'dotted',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  uploadButtonText: {
    color: '#312783',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#312783',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    width: Platform.select({ android: 65 }),
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
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40,    // sit above bottom tab bar (height 80)
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#f3f3f3',
  },
  submitButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    width: '90%',
    borderColor: '#312783',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#312783',
  },
  submitButtonText: {
    color: '#312783',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    width: Platform.select({ android: 80 }),
  },
});
