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
  ActivityIndicator
} from 'react-native';
import Video from 'react-native-video'; // ✅ Import Video Component
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { UserContext } from '../contexts/UserContext';
import { colors } from '../styles/colours';
import { API_URL } from '../config';

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
    if ( !content || !communityId) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    let mediaUrl = null;
    if (mediaUri) {
      Alert.alert('Uploading Media', 'Please wait while your media is uploaded.');
      setIsUploading(true);
      mediaUrl = await uploadToS3(mediaUri, mediaType);
      setIsUploading(false);
      if (!mediaUrl) return;
    }

    console.log('content: ', content);
    console.log('mediaUrl: ', mediaUrl);
    console.log('community: ', communityId);

    try {
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
      setIsUploading(false);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create post.');
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
      console.error('Error creating post:', error);
      Alert.alert('Error', `Create post error: ${error.message}`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Create a New Post</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Write content..."
          placeholderTextColor="#999"
          value={content}
          onChangeText={setContent}
          multiline
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionButton} onPress={openCamera}>
          <Text style={styles.buttonText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={openLibrary}>
          <Text style={styles.buttonText}>Gallery</Text>
        </TouchableOpacity>
      </View>

      {mediaUri && mediaType.includes('image') && (
        <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
      )}
      {mediaUri && mediaType.includes('video') && (
        <Video
          source={{ uri: mediaUri }}
          style={styles.video}
          controls
          resizeMode="contain"
          paused={false}
          repeat
        />
      )}

      <TouchableOpacity style={styles.submitButton} onPress={handlePost}>
        {isUploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Post</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f7f7f7',
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary || '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  mediaPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 20,
  },
  video: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: colors.primary || '#28a745',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

