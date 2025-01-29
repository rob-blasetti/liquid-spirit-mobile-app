import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  Image, 
  StyleSheet,
  Alert 
} from 'react-native';

// Import the launch methods from react-native-image-picker
import { 
  launchCamera, 
  launchImageLibrary 
} from 'react-native-image-picker';

export default function Post() {
  const [description, setDescription] = useState('');
  const [mediaUri, setMediaUri] = useState(null);
  const [mediaType, setMediaType] = useState(null);

  // Open the device camera
  const openCamera = async () => {
    const options = {
      mediaType: 'mixed', // "photo", "video", or "mixed"
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

        // Some platforms label videos differently, e.g. "video" or "image"
        // We can do a simple check or parse the MIME type if needed
        if (asset.type && asset.type.startsWith('video')) {
          setMediaType('video');
        } else {
          setMediaType('image');
        }
      }
    });
  };

  // Open the image library
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

        if (asset.type && asset.type.startsWith('video')) {
          setMediaType('video');
        } else {
          setMediaType('image');
        }
      }
    });
  };

  // Submit the post to your server
  const handlePost = async () => {
    if (!mediaUri) {
      Alert.alert('No Media', 'Please take or select a photo/video first.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('description', description);

      const fileExtension = (mediaType === 'video') ? 'mp4' : 'jpg';
      const mimeType = (mediaType === 'video') ? 'video/mp4' : 'image/jpeg';

      formData.append('media', {
        uri: mediaUri,
        name: `post-media.${fileExtension}`,
        type: mimeType,
      });

      // POST request to your API
      const response = await fetch('https://your-api.com/posts', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        Alert.alert('Success', 'Your post has been created!');
        setDescription('');
        setMediaUri(null);
        setMediaType(null);
      } else {
        Alert.alert('Upload Failed', `Server returned status: ${response.status}`);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while uploading your post.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create a New Post</Text>

      {/* Description Input */}
      <TextInput
        style={styles.input}
        placeholder="Write a description..."
        value={description}
        onChangeText={setDescription}
      />

      {/* Capture/Select Media Buttons */}
      <View style={styles.buttonRow}>
        <Button title="Open Camera" onPress={openCamera} />
        <Button title="Open Library" onPress={openLibrary} />
      </View>

      {/* Preview Selected Media */}
      {mediaUri && mediaType === 'image' && (
        <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
      )}
      {mediaUri && mediaType === 'video' && (
        <Text style={{ marginVertical: 10 }}>Video selected: {mediaUri}</Text>
      )}

      {/* Submit Post */}
      <Button title="Post" onPress={handlePost} color="#007BFF" />
    </View>
  );
}

// Basic styling
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
