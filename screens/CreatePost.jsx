import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StatusBar,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Progress from 'react-native-progress';
import Video from 'react-native-video';
import { launchImageLibrary } from 'react-native-image-picker';
import { UserContext } from '../contexts/UserContext';
import { CommunityContext } from '../contexts/CommunityContext';
import { createPost, uploadImageWithThumbnail, uploadVideoWithThumbnail } from '../services/PostService';
import themeVariables from '../styles/theme';
import FastImage from 'react-native-fast-image';
import resolveImageSource from '../utils/imageSource';
import ContentSection from '../components/forms/ContentSection';

export default function CreatePost({ onPostCreated, onClose }) {
  const [content, setContent] = useState('');
  const [mediaUri, setMediaUri] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState('');
  const { token, user } = useContext(UserContext);
  const { communityId } = useContext(CommunityContext);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tags, setTags] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigation = useNavigation();
  const handleClose = onClose ? onClose : () => navigation.goBack();
  const insets = useSafeAreaInsets();
  const [contentError, setContentError] = useState('');
  // Static tag options: one for each activity type (6) and event type (3)
  const tagOptions = [
    "Children's Class",
    'Junior Youth Group',
    'Study Circle',
    'Devotional',
    'Independent Initiative',
    'Fireside',
    'Feast',
    'Holy Day',
    'Admin',
  ];

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

  const toggleTag = (tag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handlePost = async () => {
    if (!content || !content.trim() || !communityId) {
      const message = !communityId ? 'Please join a community before posting.' : 'Please add some content.';
      setContentError(!content || !content.trim() ? 'Content is required.' : '');
      Alert.alert('Missing Fields', message);
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
        tags,
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
      setTags([]);
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
      {/* Status bar matching screen background */}
      <StatusBar
        backgroundColor={themeVariables.screenBackgroundColor}
        barStyle="dark-content"
        translucent={false}
      />
      <SafeAreaView
        style={[
          styles.container,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <View style={styles.headerRow}>
              <Text style={styles.header}>Create a post</Text>
              <TouchableOpacity
                style={styles.closeIcon}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Close create post"
              >
                <Ionicons name="close" size={24} color={themeVariables.primaryColor} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.content}
            >

              <TouchableOpacity
                style={styles.uploadButton}
                onPress={openLibrary}
                accessibilityRole="button"
                accessibilityLabel="Upload image or video"
              >
                <Ionicons name="images-outline" size={40} color={themeVariables.primaryColor} />
                <Text style={styles.uploadButtonText}>Upload image or video</Text>
              </TouchableOpacity>

              <ContentSection
                title="Content"
                placeholder="Share an update with your community..."
                value={content}
                onChangeText={(text) => {
                  setContent(text);
                  if (contentError && text.trim()) {
                    setContentError('');
                  }
                }}
                error={contentError}
                required
              />

              <Text style={styles.label}>Tags</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setDropdownOpen(!dropdownOpen)}
                accessibilityRole="button"
                accessibilityLabel="Select tags"
                accessibilityHint={dropdownOpen ? 'Closes the tags list' : 'Opens the tags list'}
              >
                <Text style={styles.dropdownText}>
                  {tags.length > 0 ? tags.join(', ') : 'Select tags'}
                </Text>
                <Ionicons
                  name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={themeVariables.primaryColor}
                />
              </TouchableOpacity>
              {dropdownOpen && (
                <View style={styles.dropdownList}>
                  <ScrollView style={{ maxHeight: 150 }}>
                    {tagOptions.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={styles.dropdownItem}
                        onPress={() => toggleTag(t)}
                      >
                        <Ionicons
                          name={tags.includes(t) ? 'checkbox' : 'square-outline'}
                          size={20}
                          color={themeVariables.primaryColor}
                          style={{ marginRight: 8 }}
                        />
                        <Text>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {mediaUri && mediaType.includes('image') && (
                <FastImage
                  testID="imagePreview"
                  source={resolveImageSource(mediaUri, { priority: 'high' })}
                  style={styles.mediaPreview}
                  resizeMode={FastImage.resizeMode.cover}
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
                    color={themeVariables.primaryColor}
                    borderRadius={10}
                  />
                  <Text style={{ color: themeVariables.primaryColor, marginTop: 5 }}>{uploadStep}</Text>
                </View>
              )}

            </ScrollView>
            <View
              style={styles.footer}
            >
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
    backgroundColor: themeVariables.screenBackgroundColor,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 18,
    fontWeight: '700',
    color: themeVariables.blackColor,
    textAlign: 'center',
  },
  headerRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
    position: 'relative',
  },
  closeIcon: {
    position: 'absolute',
    top: -6,
    right: 15,
    padding: 8,
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
    borderStyle: 'dotted',
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: themeVariables.primaryColor,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    color: themeVariables.whiteColor,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    width: Platform.select({ android: 65 }),
  },
  dropdown: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: themeVariables.whiteColor,
    marginBottom: 10,
  },
  dropdownText: {
    color: '#333',
    fontSize: 16,
  },
  dropdownList: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: themeVariables.whiteColor,
    marginBottom: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
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
    bottom: 40,
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: themeVariables.screenBackgroundColor,
  },
  submitButton: {
    backgroundColor: themeVariables.whiteColor,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    width: '90%',
    borderColor: themeVariables.primaryColor,
    borderWidth: 1,
    borderStyle: 'solid',
  },
  submitButtonText: {
    color: themeVariables.primaryColor,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    width: Platform.select({ android: 80 }),
  },
});
