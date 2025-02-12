import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { UserContext } from '../contexts/UserContext';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUserEdit, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

const Settings = ({ navigation }) => {
  const { logout } = useContext(UserContext);

  const handleLogout = async () => {
    await logout();  // Ensure logout process completes
    navigation.reset({
      index: 0,
      routes: [{ name: 'SocialMedia' }], // Change 'SocialMediaScreen' to your actual screen name
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {/* Edit Profile Button */}
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('EditProfile')}>
        <FontAwesomeIcon icon={faUserEdit} size={20} color="#312783" />
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
        <FontAwesomeIcon icon={faSignOutAlt} size={20} color="#fff" />
        <Text style={[styles.buttonText, styles.logoutText]}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#312783',
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    width: '80%',
    justifyContent: 'center',
    marginVertical: 10,
    elevation: 2,
  },
  buttonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#312783',
  },
  logoutButton: {
    backgroundColor: '#d9534f',
  },
  logoutText: {
    color: '#fff',
  },
});

export default Settings;
