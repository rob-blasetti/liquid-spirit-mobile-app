import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { UserContext } from '../contexts/UserContext';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faSave, faUpload } from '@fortawesome/free-solid-svg-icons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuthService } from '../services/AuthService';
import s3 from '../awsConfig';

const EditProfile = ({ navigation }) => {
  const { user, token, setUser } = useContext(UserContext);
  const { updateMe } = useAuthService();

  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [birthday, setBirthday] = useState(user.birthday ? new Date(user.birthday) : new Date());const [email, setEmail] = useState(user.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [address, setAddress] = useState(user.address || '');
  const [occupation, setOccupation] = useState(user.occupation || '');
  const [skills, setSkills] = useState(user.skills?.join(', ') || '');
  const [preferredLanguage, setPreferredLanguage] = useState(user.preferredLanguage || '');
  const [facebook, setFacebook] = useState(user.socialMedia?.facebook || '');
  const [x, setX] = useState(user.socialMedia?.x || '');
  const [linkedin, setLinkedin] = useState(user.socialMedia?.linkedin || '');
  const [instagram, setInstagram] = useState(user.socialMedia?.instagram || '');
  const [tiktok, setTiktok] = useState(user.socialMedia?.tiktok || '');
  const [imageUri, setImageUri] = useState(user.profilePicture || null);

  const handleProfilePicturePress = async () => {
    const options = {
      mediaType: 'photo',
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8,
    };

    launchImageLibrary(options, async response => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage);
        return;
      }

      const asset = response.assets[0];
      const { uri, fileName, type } = asset;

      try {
        const imageBlob = await fetch(uri).then(res => res.blob());
        const s3Key = `profile-images/${fileName || Date.now()}`;
        const params = {
          Bucket: 'liquid-spirit',
          Key: s3Key,
          Body: imageBlob,
          ContentType: type || 'image/jpeg',
        };
        const s3Upload = await s3.upload(params).promise();

        setImageUri(s3Upload.Location);
      } catch (err) {
        Alert.alert('Upload Error', 'Failed to upload image.');
      }
    });
  };

  const handleSave = async () => {
    const updatedUser = {
      firstName,
      lastName,
      birthday: birthday.toISOString().split('T')[0],
      email,
      phoneNumber,
      address,
      occupation,
      skills: skills.split(',').map(skill => skill.trim()),
      profilePicture: imageUri,
      preferredLanguage,
      socialMedia: { facebook, x, linkedin, instagram, tiktok },
    };
  
    try {
      const response = await updateMe(updatedUser);
      console.log('Response from server:', response);
  
      if (!response || !response.ok) {
        throw new Error(`Unexpected response: ${JSON.stringify(response)}`);
      }
  
      setUser(response.data);
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', `Failed to update profile. ${error.message}`);
    }
  };
  

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Edit Profile</Text>

      <TouchableOpacity style={styles.avatarContainer} onPress={handleProfilePicturePress}>
        <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
        <FontAwesomeIcon icon={faUpload} style={styles.uploadIcon} />
      </TouchableOpacity>

      {[
        { label: 'First Name', value: firstName, onChange: setFirstName },
        { label: 'Last Name', value: lastName, onChange: setLastName },
        { label: 'Birthday', value: birthday.toDateString(), onPress: () => setShowDatePicker(true), isDate: true },
        { label: 'Email', value: email, onChange: setEmail },
        { label: 'Phone Number', value: phoneNumber, onChange: setPhoneNumber },
        { label: 'Address', value: address, onChange: setAddress },
        { label: 'Occupation', value: occupation, onChange: setOccupation },
        { label: 'Skills (comma separated)', value: skills, onChange: setSkills },
        { label: 'Preferred Language', value: preferredLanguage, onChange: setPreferredLanguage },
        { label: 'Facebook', value: facebook, onChange: setFacebook },
        { label: 'X', value: x, onChange: setX },
        { label: 'LinkedIn', value: linkedin, onChange: setLinkedin },
        { label: 'Instagram', value: instagram, onChange: setInstagram },
        { label: 'TikTok', value: tiktok, onChange: setTiktok },
      ].map((item, index) => (
        <View key={index}>
          <Text style={styles.label}>{item.label}</Text>
          <TextInput
            style={styles.input}
            placeholder={item.label}
            value={item.value}
            onChangeText={item.onChange}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <FontAwesomeIcon icon={faSave} size={20} color="#fff" />
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F9FAFB',
      padding: 20,
      marginBottom: 60,
    },
    header: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#312783',
      marginVertical: 20,
      textAlign: 'center',
    },
    avatarContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: '#e1e4e8',
    },
    uploadIcon: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      backgroundColor: '#fff',
      padding: 8,
      borderRadius: 20,
      elevation: 4,
    },
    input: {
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: 15,
      marginVertical: 8,
      elevation: 2,
    },
    saveButton: {
      backgroundColor: '#312783',
      borderRadius: 10,
      padding: 15,
      alignItems: 'center',
      marginTop: 20,
      flexDirection: 'row',
      justifyContent: 'center',
    },
    saveButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
      marginLeft: 10,
    }
  });  

export default EditProfile;
