import React, { useContext, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView 
} from 'react-native';
import { UserContext } from '../contexts/UserContext';
import { useAuthService } from '../services/AuthService';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faLock, faSave } from '@fortawesome/free-solid-svg-icons';

const ChangePassword = ({ navigation }) => {
  const { token } = useContext(UserContext);
  const { updateMe } = useAuthService();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }

    try {
      const response = await // insert change password method.
      console.log('Response:', response);

      if (!response.ok) {
        throw new Error(response.message || 'Failed to change password.');
      }

      Alert.alert('Success', 'Password updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', `Failed to change password. ${error.message}`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Change Password</Text>

      <View style={styles.inputContainer}>
        <FontAwesomeIcon icon={faLock} size={18} color="#312783" />
        <TextInput
          style={styles.input}
          placeholder="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
      </View>

      <View style={styles.inputContainer}>
        <FontAwesomeIcon icon={faLock} size={18} color="#312783" />
        <TextInput
          style={styles.input}
          placeholder="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
      </View>

      <View style={styles.inputContainer}>
        <FontAwesomeIcon icon={faLock} size={18} color="#312783" />
        <TextInput
          style={styles.input}
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword}>
        <FontAwesomeIcon icon={faSave} size={20} color="#fff" />
        <Text style={styles.saveButtonText}>Update Password</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#312783',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginVertical: 8,
    width: '100%',
    elevation: 2,
  },
  input: {
    flex: 1,
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: '#312783',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
});

export default ChangePassword;
