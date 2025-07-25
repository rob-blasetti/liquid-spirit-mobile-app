import React, { useContext } from 'react';
import { TouchableOpacity } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import FastImage from 'react-native-fast-image';
import Avatar from '@liquidspirit/react-native-boring-avatars';
import { UserContext } from '../contexts/UserContext';
import { useAuthService } from '../services/AuthService';
import s3 from '../awsConfig';

/**
 * A changeable profile image component that allows the user to pick a new image,
 * uploads it to S3, updates the user via the AuthService, and displays the image.
 * Props:
 * - imageStyle: style object applied to the FastImage when showing the profile picture
 * - avatarSize: size of the placeholder avatar when no profile picture is set (default: 55)
 */
const ChangeableProfileImage = ({ imageStyle, avatarSize = 55, userDetails: propUserDetails, setUserDetails: propSetUserDetails }) => {
  const { user, setUser } = useContext(UserContext);
  // Determine which profile picture to show: prefer detailed user data, fallback to main user
  const profilePictureUri = (propUserDetails && propUserDetails.profilePicture) || user.profilePicture;
  // Determine display name for avatar placeholder
  const displayName = (propUserDetails && propUserDetails.firstName) || user.firstName;
  const { updateMe } = useAuthService();

  const getBlob = async (uri) => {
    const response = await fetch(uri);
    return await response.blob();
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
      } else if (response.errorCode) {
        console.error('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const { uri, fileName, type } = asset;
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

          const updatedUserFields = { ...user, profilePicture: s3Upload.Location };
          const { ok, data } = await updateMe(updatedUserFields);
          if (!ok) {
            console.error('Error updating profile:', data);
            alert('Failed to update profile on the server.');
            return;
          }
          // Update main user context, preserving nested community
          setUser({
            ...user,
            ...data,
            community: user.community,
          });
          // If a userDetails setter was passed, update detailed context (e.g., for Profile screen)
          if (propSetUserDetails) {
            propSetUserDetails({
              ...propUserDetails,
              // update only profilePicture to preserve certifications and other details
              profilePicture: s3Upload.Location,
            });
          }
        } catch (err) {
          console.error('Error uploading to S3 =>', err);
        }
      }
    });
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      {profilePictureUri ? (
        <FastImage
          source={{ uri: profilePictureUri }}
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
    </TouchableOpacity>
  );
};

export default ChangeableProfileImage;