import React, { useContext } from 'react';
import { Alert, TouchableOpacity, View, StyleSheet } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import FastImage from 'react-native-fast-image';
import Avatar from '@liquidspirit/react-native-boring-avatars';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { UserContext } from '../contexts/UserContext';
import { useAuthService } from '../services/AuthService';
import s3 from '../awsConfig';
import resolveImageSource from '../utils/imageSource';

const ChangeableProfileImage = ({
  imageStyle,
  avatarSize = 55,
  userDetails: propUserDetails,
  setUserDetails: propSetUserDetails,
  showEditIndicator = false,
}) => {
  const { user, setUser } = useContext(UserContext);
  const { updateMe } = useAuthService();

  // Defensive fallbacks
  const profilePictureUri =
    propUserDetails?.profilePicture || user?.profilePicture || null;

  const displayName =
    propUserDetails?.firstName ||
    user?.firstName ||
    'Anonymous';

  const getBlob = async (uri) => {
    try {
      const response = await fetch(uri);
      return await response.blob();
    } catch (err) {
      console.error('Error fetching image blob:', err);
      throw err;
    }
  };

  const handlePress = () => {
    const options = {
      mediaType: 'photo',
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8,
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      if (response.errorCode) {
        console.error('ImagePicker Error:', response.errorMessage);
        Alert.alert('Image Picker Error', response.errorMessage || 'Unknown error');
        return;
      }

      if (!response.assets || response.assets.length === 0) {
        console.warn('No image assets returned');
        return;
      }

      const asset = response.assets[0];
      const { uri, fileName, type } = asset;

      if (!uri) {
        console.error('Selected asset has no URI');
        Alert.alert('Upload Error', 'No valid image URI found.');
        return;
      }

      try {
        const imageBlob = await getBlob(uri);
        const s3Key = `profile-images/${fileName || Date.now()}`;
        const params = {
          Bucket: 'liquid-spirit',
          Key: s3Key,
          Body: imageBlob,
          ContentType: type || 'image/jpeg',
        };

        const s3Upload = await s3.upload(params).promise();
        console.log('S3 upload success =>', s3Upload.Location);

        const updatedUserFields = {
          ...user,
          profilePicture: s3Upload.Location,
        };

        const { ok, data } = await updateMe(updatedUserFields);

        if (!ok) {
          console.error('Error updating profile:', data);
          Alert.alert('Update Error', 'Failed to update your profile.');
          return;
        }

        // Update user context
        setUser?.({
          ...user,
          ...data,
          community: user?.community,
        });

        // Update additional detailed user if available
        if (typeof propSetUserDetails === 'function' && propUserDetails) {
          propSetUserDetails({
            ...propUserDetails,
            profilePicture: s3Upload.Location,
          });
        }
      } catch (err) {
        console.error('Error uploading to S3 =>', err);
        Alert.alert('Upload Failed', 'Could not upload image. Please try again.');
      }
    });
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={styles.wrapper}>
      {profilePictureUri ? (
        <FastImage
          source={resolveImageSource(profilePictureUri, { priority: 'normal' })}
          style={imageStyle}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <Avatar
          size={avatarSize}
          name={displayName}
          variant="beam"
          colors={['#1B263B', '#0A74DA', '#6C7A89', '#F8F9FA', '#0C0C0C']}
        />
      )}
      {showEditIndicator && (
        <View style={styles.editBadge}>
          <Ionicons name="camera" size={14} color="#312783" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  editBadge: {
    position: 'absolute',
    bottom: -4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default ChangeableProfileImage;
