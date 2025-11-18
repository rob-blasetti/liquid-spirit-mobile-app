import React, { useState, useContext } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Video from 'react-native-video';
import * as Progress from 'react-native-progress';
import { launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../styles/theme';
import { UserContext } from '../contexts/UserContext';
import { CommunityContext } from '../contexts/CommunityContext';
import { createPost, uploadImageWithThumbnail, uploadVideoWithThumbnail } from '../services/PostService';
import FastImage from 'react-native-fast-image';
import resolveImageSource from '../utils/imageSource';

const PostModal = ({ visible = true, onPostCreated, onClose }) => {
  const [content, setContent] = useState('');
  const [mediaUri, setMediaUri] = useState(null);
  const [mediaType, setMediaType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState('');
  const { token, user } = useContext(UserContext);
  const { communityId } = useContext(CommunityContext);
  const [tags, setTags] = useState([]);
  // Dropdown open state for tag selection chips
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

  const toggleTag = (tag) => {
    setTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
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
        handleClose();
      } catch (err) {
        console.error('Post error:', err);
        setIsUploading(false);
        setUploadStep('');
        Alert.alert('Error', err.message);
      }
    };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.header}>Create a post</Text>
              <TouchableOpacity style={styles.closeIcon} onPress={handleClose}>
                <Ionicons
                  name="close"
                  size={24}
                  color={themeVariables.blackColor}
                />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
              <TouchableOpacity style={styles.uploadButton} onPress={openLibrary}>
                <Ionicons
                  name="images-outline"
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

              <Text style={styles.label}>Tags</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setDropdownOpen(!dropdownOpen)}
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
                  <ScrollView contentContainerStyle={styles.chipsContainer}>
                    {tagOptions.map(t => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.chip, tags.includes(t) && styles.chipSelected]}
                        onPress={() => toggleTag(t)}
                      >
                        <Text style={[styles.chipText, tags.includes(t) && styles.chipSelectedText]}>
                          {t}
                        </Text>
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
          </View>
        </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: themeVariables.screenBackgroundColor,
    justifyContent: 'flex-end',
    alignItems: 'center',
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
    color: themeVariables.blackColor,
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
    top: -8,
    right: -10,
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
  // Styles for selectable tag chips
  chipsContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  chip: {
    borderWidth: 1,
    borderColor: themeVariables.darkGreyColor,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
    backgroundColor: themeVariables.whiteColor,
  },
  chipSelected: {
    backgroundColor: themeVariables.secondaryColor,
    borderWidth: 1,
    borderColor: themeVariables.blackColor,
  },
  chipText: {
    color: '#555',
    fontSize: 14,
  },
  chipSelectedText: {
    color: themeVariables.blackColor,
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
