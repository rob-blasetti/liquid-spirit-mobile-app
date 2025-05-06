import React, { useContext } from 'react';
import { TouchableOpacity } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import FastImage from 'react-native-fast-image';
import Avatar from '@flipxyz/react-native-boring-avatars';
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
const ChangeableProfileImage = ({ imageStyle, avatarSize = 55 }) => {
  const { user, setUser } = useContext(UserContext);
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
          // Merge returned data with existing user to preserve nested properties (e.g., community)
          // updatedUserFields includes the new profilePicture and retains other user fields
          setUser({
            // existing user context fields
            ...user,
            // override with any updated fields from server response
            ...data,
          });
        } catch (err) {
          console.error('Error uploading to S3 =>', err);
        }
      }
    });
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      {user?.profilePicture ? (
        <FastImage
          source={{ uri: user.profilePicture }}
          style={imageStyle}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <Avatar
          size={avatarSize}
          name={user?.firstName}
          variant="beam"
          colors={['#1B263B', '#0A74DA', '#6C7A89', '#F8F9FA', '#0C0C0C']}
        />
      )}
    </TouchableOpacity>
  );
};

export default ChangeableProfileImage;