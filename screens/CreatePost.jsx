import React, { useState, useContext, useEffect } from 'react';
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
  Keyboard
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faImage, faImages } from '@fortawesome/free-regular-svg-icons';
import Video from 'react-native-video';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { UserContext } from '../contexts/UserContext';
import { colors } from '../styles/colours';
import { API_URL } from '../config';
import { TouchableWithoutFeedback } from 'react-native';

export default function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState('');
  const [mediaUri, setMediaUri] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const { communityId, token } = useContext(UserContext);

  useEffect(() => {
    openCamera();
  }, []);

  const uploadToS3 = async (fileUri, fileType) => {
    console.log('fileUri:', fileUri);
    console.log('fileType:', fileType);
  
    try {
      const isVideo = fileType.includes('video');
      const fileExtension = isVideo ? 'mp4' : 'jpg';
      const fileName = `post-media-${Date.now()}.${fileExtension}`;
  
      // ✅ Choose the correct endpoint based on file type
      const endpoint = isVideo ? 's3-video-url' : 's3-url';
  
      // Request signed URL
      const signedUrlResponse = await fetch(
        `${API_URL}/api/upload/${endpoint}?fileName=${fileName}&fileType=${fileType}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      if (!signedUrlResponse.ok) {
        const errorResponse = await signedUrlResponse.json();
        console.error('Signed URL Error Response:', errorResponse);
        throw new Error('Failed to get signed URL');
      }
  
      const { url } = await signedUrlResponse.json();
      if (!url) throw new Error('Signed URL was empty');
  
      // Properly fetch the file as blob
      const fileBlob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function() {
          const blob = xhr.response;
          resolve(blob);
        };
        xhr.onerror = function(e) {
          reject(new Error('Failed to read file'));
        };
        xhr.responseType = 'blob';
        xhr.open('GET', fileUri, true);
        xhr.send(null);
      });
  
      // Upload blob to S3
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: fileBlob,
        headers: {
          'Content-Type': fileType,
        },
      });
  
      if (!uploadResponse.ok) {
        console.error('S3 Upload failed:', uploadResponse.status, uploadResponse.statusText);
        throw new Error('Failed to upload to S3');
      }
  
      return url.split('?')[0];
    } catch (error) {
      console.error('S3 Upload Error:', error);
      Alert.alert('Upload Failed', 'Could not upload media');
      return null;
    }
  };  

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

    let mediaUrl = null;
    if (mediaUri) {
      setIsUploading(true);
      mediaUrl = await uploadToS3(mediaUri, mediaType);
      setIsUploading(false);
      if (!mediaUrl) return;
    }

    try {
      console.log('setting is uploading');
      setIsUploading(true);
      const response = await fetch(`${API_URL}/api/posts/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content,
          media: mediaUrl ? [mediaUrl] : [],
          community: communityId,
        }),
      });
      console.log('response: ', response);
      setIsUploading(false);

      if (!response.ok) {
        throw new Error('Failed to create post.');
      }

      Alert.alert('Success', 'Your post has been created!');
      setContent('');
      setMediaUri(null);
      setMediaType(null);
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      setIsUploading(false);
      Alert.alert('Error', `Create post error: ${error.message}`);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.header}>Create a New Post</Text>

          <TextInput
            style={styles.textArea}
            placeholder="What's on your mind?"
            placeholderTextColor="#999"
            value={content}
            onChangeText={setContent}
            multiline
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.actionButton} onPress={openCamera}>
              <FontAwesomeIcon icon={faImage} size={20} color="white" />
              <Text style={styles.buttonText}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={openLibrary}>
              <FontAwesomeIcon icon={faImages} size={20} color="white" />
              <Text style={styles.buttonText}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {mediaUri && mediaType.includes('image') && (
            <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
          )}
          {mediaUri && mediaType.includes('video') && (
            <Video source={{ uri: mediaUri }} style={styles.video} controls resizeMode="contain" paused={false} repeat />
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handlePost}>
            {isUploading ? <ActivityIndicator color="#312783" /> : <Text style={styles.submitButtonText}>Post</Text>}
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 26,
    fontWeight: '700',
    color: '#312783',
    marginBottom: 20,
    textAlign: 'center',
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
  submitButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    width: '90%',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#312783',
  },
  submitButtonText: {
    color: '#312783',
    fontSize: 18,
    fontWeight: '600',
  },
});
