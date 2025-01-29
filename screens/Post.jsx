import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  Image, 
  StyleSheet,
  Alert 
} from 'react-native';

import { 
  launchCamera, 
  launchImageLibrary 
} from 'react-native-image-picker';
import { UserContext } from '../contexts/UserContext';

const stagingAPI = 'https://liquid-spirit-backend-staging-2a7049350332.herokuapp.com';

export default function Post({ onPostCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUri, setMediaUri] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const { communityId, token } = useContext(UserContext);

  const uploadToS3 = async (fileUri) => {
    try {
      const fileName = `post-media-${Date.now()}.jpg`;
      const fileType = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
      const signedUrlResponse = await fetch(`${stagingAPI}/api/upload/s3-url?fileName=${fileName}&fileType=${fileType}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { url } = await signedUrlResponse.json();
      if (!url) throw new Error('Failed to get signed URL');

      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: await fetch(fileUri).then(res => res.blob()),
        headers: {
          'Content-Type': fileType,
        },
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload to S3');
      return url.split('?')[0]; // Return the URL without query params
    } catch (error) {
      console.error('S3 Upload Error:', error);
      Alert.alert('Upload Failed', 'Could not upload media');
      return null;
    }
  };

  const openCamera = async () => {
    const options = {
      mediaType: 'mixed',
      quality: 0.7,
      includeBase64: false,
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera picker');
      } else if (response.errorCode) {
        Alert.alert('Camera Error', response.errorMessage || 'Unknown error');
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setMediaUri(asset.uri);
        setMediaType(asset.type && asset.type.startsWith('video') ? 'video' : 'image');
      }
    });
  };

  const openLibrary = async () => {
    const options = {
      mediaType: 'mixed',
      quality: 0.7,
      includeBase64: false,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        Alert.alert('Library Error', response.errorMessage || 'Unknown error');
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setMediaUri(asset.uri);
        setMediaType(asset.type && asset.type.startsWith('video') ? 'video' : 'image');
      }
    });
  };

  const handlePost = async () => {
    if (!title || !content || !communityId) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    let mediaUrl = null;
    if (mediaUri) {
      Alert.alert('Uploading Media', 'Please wait while your media is uploaded.');
      mediaUrl = await uploadToS3(mediaUri);
      if (!mediaUrl) return;
    }

    try {
      const response = await fetch(`${stagingAPI}/api/posts/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
          media: mediaUrl ? [mediaUrl] : [],
          community: communityId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create post.');
      }

      Alert.alert('Success', 'Your post has been created!');
      setTitle('');
      setContent('');
      setMediaUri(null);
      setMediaType(null);

      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', `Create post error: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create a New Post</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter title..."
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Write content..."
        value={content}
        onChangeText={setContent}
        multiline
      />

      <View style={styles.buttonRow}>
        <Button title="Open Camera" onPress={openCamera} />
        <Button title="Open Library" onPress={openLibrary} />
      </View>

      {mediaUri && mediaType === 'image' && (
        <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
      )}
      {mediaUri && mediaType === 'video' && (
        <Text style={{ marginVertical: 10 }}>Video selected: {mediaUri}</Text>
      )}

      <Button title="Post" onPress={handlePost} color="#007BFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    padding: 10,
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  mediaPreview: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginBottom: 15,
  },
});
